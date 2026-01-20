/**
 * Processor Dashboard Module
 * Handles sales data viewing, CSV export with field mapping, and profile management
 */

// Global state
let sales = [];
let filteredSales = [];
let formFields = [];
let fieldMappings = {};
let mappingProfiles = {}; // All mapping profiles
let currentMappingProfile = 'default'; // Currently selected profile name
let currentSortColumn = null;
let currentSortDirection = 'desc';
let currentUser = null;

// Pagination state
let currentPage = 1;
let pageSize = 50;
let totalPages = 1;

/**
 * Initialize processor dashboard
 */
async function initializeProcessor() {
  // Check authentication first
  if (typeof checkAuth === 'function') {
    const authenticated = await checkAuth('login.html');
    if (!authenticated) {
      return; // Redirected to login
    }
  }

  // Check if user is processor or admin (both can access processor route)
  let hasAccess = false;
  if (typeof isProcessor === 'function') {
    const isProc = await isProcessor();
    if (isProc) {
      hasAccess = true;
    }
  }
  
  // Also check if user is admin (admins can access processor route)
  if (!hasAccess && typeof isAdmin === 'function') {
    const isAdm = await isAdmin();
    if (isAdm) {
      hasAccess = true;
    }
  }
  
  // If neither processor nor admin, redirect to form
  if (!hasAccess) {
    showProcessorMessage('Access denied. Processor or Admin role required.', 'error');
    setTimeout(() => {
      window.location.href = '/form';
    }, 2000);
    return;
  }

  // Get current user
  if (typeof getCurrentUser === 'function') {
    currentUser = getCurrentUser();
    if (currentUser && currentUser.email) {
      const userEmail = document.getElementById('userEmail');
      if (userEmail) {
        userEmail.textContent = currentUser.email;
      }
    }
  }

  // Initialize QueryOptimizer and CacheManager for performance optimization
  if (typeof QueryOptimizer !== 'undefined' && !window.queryOptimizer) {
    window.queryOptimizer = new QueryOptimizer({
      defaultPageSize: pageSize,
      cacheQueries: true,
      cacheTTL: 5 * 60 * 1000 // 5 minutes
    });
    console.log('QueryOptimizer initialized');
  }
  
  // CacheManager should already be global from cache-manager.js
  if (typeof cacheManager !== 'undefined' && !window.cacheManager) {
    window.cacheManager = cacheManager;
    console.log('CacheManager initialized');
  }

  // Set up event listeners
  setupEventListeners();

  // Load initial data
  await loadSales();
  await loadFormFields();
  await loadFieldMappings();
  await loadProfile();
  
  // Initialize enhanced filter component with advanced filters
  if (typeof initFilterComponent === 'function') {
    initFilterComponent('filterPills', {
      onFilterChange: (filters) => {
        // Trigger filtering
        if (typeof filterSales === 'function') {
          filterSales();
        }
      }
    });
    
    // Load agents for agent filter
    if (typeof filterComponentInstance !== 'undefined' && sales.length > 0) {
      filterComponentInstance.loadAgents(sales);
    }
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      if (typeof logoutUser === 'function') {
        try {
          await logoutUser();
        } catch (error) {
          console.error('Logout error:', error);
          alert('Error logging out. Please try again.');
        }
      }
    });
  }
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.admin-tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  // Remove active class from all tab buttons
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  const tabContent = document.getElementById(tabName + 'Tab');
  const tabBtn = document.getElementById(tabName + 'TabBtn');
  
  if (tabContent) {
    tabContent.style.display = 'block';
  }
  if (tabBtn) {
    tabBtn.classList.add('active');
  }

  // Load data for specific tabs
  if (tabName === 'mapping') {
    loadFieldMappings();
  } else if (tabName === 'profile') {
    loadProfile();
  } else if (tabName === 'activity') {
    loadActivityLog();
  }
}

/**
 * Load sales data with pagination and caching
 */
async function loadSales(page = 1) {
  const salesLoading = document.getElementById('salesLoading');
  const salesTable = document.getElementById('salesTable');
  const salesTableBody = document.getElementById('salesTableBody');

  try {
    salesLoading.style.display = 'block';
    salesTable.style.display = 'none';

    // Initialize QueryOptimizer if not exists
    if (!window.queryOptimizer) {
      window.queryOptimizer = new QueryOptimizer({
        defaultPageSize: pageSize,
        cacheQueries: true,
        cacheTTL: 5 * 60 * 1000 // 5 minutes
      });
    }

    // Get current user for cache key
    const user = firebase.auth().currentUser;
    const userId = user ? user.uid : 'anonymous';

    // Check cache first
    const cacheKey = `sales_page_${page}_${userId}`;
    if (window.cacheManager && window.cacheManager.has(cacheKey)) {
      const cached = window.cacheManager.get(cacheKey);
      sales = cached.allItems || [];
      filteredSales = cached.items || [];
      currentPage = page;
      totalPages = cached.totalPages || 1;
      
      salesLoading.style.display = 'none';
      salesTable.style.display = 'block';
      
      populateAgentFilter();
      updateSalesPaginationControls();
      renderSalesTable();
      return; // Return from cache - instant!
    }

    // Build optimized query
    const salesRef = database.ref('sales');
    const query = salesRef
      .orderByChild('timestamp')
      .limitToFirst(pageSize * page); // Load enough for current page
    
    const snapshot = await query.once('value');
    
    sales = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleId = childSnapshot.key;
        const saleData = childSnapshot.val();
        sales.push({
          id: saleId,
          ...saleData
        });
      });
    }

    // Sort by timestamp (newest first)
    sales.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSales = sales.slice(startIndex, endIndex);
    
    filteredSales = paginatedSales;
    currentPage = page;
    totalPages = Math.ceil(sales.length / pageSize);
    
    // Cache result
    if (window.cacheManager) {
      window.cacheManager.set(cacheKey, {
        items: paginatedSales,
        allItems: sales, // Cache all for filtering
        totalPages: totalPages,
        totalItems: sales.length
      }, 5 * 60 * 1000);
    }
    
    // Populate agent filter dropdown
    populateAgentFilter();

    salesLoading.style.display = 'none';
    salesTable.style.display = 'block';
    
    updateSalesPaginationControls();
    renderSalesTable();
  } catch (error) {
    console.error('Error loading sales:', error);
    salesLoading.innerHTML = `<p style="color: #dc2626;">Error loading sales. Please try again.</p><button class="btn btn-primary" onclick="loadSales(${currentPage})">Retry</button>`;
    showProcessorMessage('Error loading sales: ' + error.message, 'error');
  }
}

/**
 * Update sales pagination controls
 */
function updateSalesPaginationControls() {
  let container = document.getElementById('salesPagination');
  
  if (!container) {
    // Create pagination container if it doesn't exist
    const parentContainer = document.getElementById('salesTable') || document.querySelector('.sales-container');
    if (parentContainer) {
      const paginationDiv = document.createElement('div');
      paginationDiv.id = 'salesPagination';
      paginationDiv.className = 'pagination-controls';
      paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin: 20px 0; padding: 10px;';
      parentContainer.appendChild(paginationDiv);
      container = paginationDiv;
    }
  }
  
  if (!container) return;
  
  const page = currentPage;
  const total = totalPages;
  const totalItems = sales.length;
  
  const paginationHTML = `
    <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;">
      <button 
        class="btn btn-secondary" 
        ${page === 1 ? 'disabled' : ''} 
        onclick="loadSales(${page - 1})"
        style="min-width: 100px;"
      >
        ← Previous
      </button>
      <span style="padding: 0 15px; color: var(--text-secondary);">
        Page <strong>${page}</strong> of <strong>${total}</strong>
        ${totalItems > 0 ? ` (${totalItems} total sales)` : ''}
      </span>
      <button 
        class="btn btn-secondary" 
        ${page >= total ? 'disabled' : ''} 
        onclick="loadSales(${page + 1})"
        style="min-width: 100px;"
      >
        Next →
      </button>
    </div>
  `;
  
  container.innerHTML = paginationHTML;
}

/**
 * Render sales table
 */
function renderSalesTable() {
  const salesTableBody = document.getElementById('salesTableBody');
  if (!salesTableBody) return;

  salesTableBody.innerHTML = '';

  // Update count display
  const salesCount = document.getElementById('salesCount');
  const salesTotal = document.getElementById('salesTotal');
  if (salesCount) salesCount.textContent = filteredSales.length;
  if (salesTotal) salesTotal.textContent = sales.length;

  if (filteredSales.length === 0) {
    salesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 60px; color: var(--text-secondary);">📊 No sales data found.</td></tr>';
    return;
  }

  filteredSales.forEach(sale => {
    const date = sale.submittedAt ? new Date(sale.submittedAt).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }) : 'N/A';
    // Sanitize user data to prevent XSS
    const customerName = sanitizeHTML(sale.contact?.name || 'N/A');
    const customerEmail = sanitizeHTML(sale.contact?.email || '');
    const customerPhone = sanitizeHTML(sale.contact?.phone || '');
    const agentEmail = sanitizeHTML(sale.agentEmail || 'N/A');
    const planType = sanitizeHTML(sale.plan?.type || 'N/A');
    const totalCost = sale.plan?.totalCost ? `£${sale.plan.totalCost.toFixed(2)}` : 'N/A';

    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.onclick = () => viewSaleDetails(sale.id);
    row.innerHTML = `
      <td><strong style="color: var(--text-primary);">${date}</strong></td>
      <td>
        <div><strong>${customerName}</strong></div>
        <small style="color: var(--text-secondary); font-size: 12px;">${customerEmail || customerPhone || ''}</small>
      </td>
      <td><span style="color: var(--text-secondary); font-size: 14px;">${agentEmail}</span></td>
      <td><span class="badge badge-agent">${planType}</span></td>
      <td><strong style="color: var(--success); font-size: 16px;">${totalCost}</strong></td>
      <td>
        <button class="btn btn-action btn-primary" onclick="event.stopPropagation(); viewSaleDetails('${sale.id}')">👁️ View</button>
      </td>
    `;
    salesTableBody.appendChild(row);
  });
}

/**
 * Filter sales by search term and advanced filters
 */
function filterSales() {
  const searchTerm = (document.getElementById('salesSearch')?.value || '').toLowerCase();
  const filterAgent = document.getElementById('salesFilterAgent')?.value || '';
  const filterPlan = document.getElementById('salesFilterPlan')?.value || '';

  // Get advanced filters from filter component
  let advancedFilters = {};
  if (typeof filterComponentInstance !== 'undefined') {
    advancedFilters = filterComponentInstance.getAdvancedFilters();
  }

  filteredSales = sales.filter(sale => {
    // Search term - search across all fields
    if (searchTerm) {
      const searchableText = JSON.stringify(sale).toLowerCase();
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Agent filter (from dropdown or advanced filter)
    const agentFilterValue = filterAgent || advancedFilters.agent;
    if (agentFilterValue && sale.agentEmail !== agentFilterValue) {
      return false;
    }

    // Plan filter (from dropdown or advanced filter)
    const planFilterValue = filterPlan || advancedFilters.planType;
    if (planFilterValue && sale.plan?.type !== planFilterValue) {
      return false;
    }

    // Date range filter (sales creation date)
    if (advancedFilters.dateFrom || advancedFilters.dateTo) {
      const saleDate = sale.submittedAt ? new Date(sale.submittedAt) : null;
      if (!saleDate) return false;
      
      if (advancedFilters.dateFrom) {
        const fromDate = new Date(advancedFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (saleDate < fromDate) return false;
      }
      
      if (advancedFilters.dateTo) {
        const toDate = new Date(advancedFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (saleDate > toDate) return false;
      }
    }

    // DD date range filter
    if (advancedFilters.ddDateFrom || advancedFilters.ddDateTo) {
      const ddDate = sale.payment?.ddDate || '';
      if (!ddDate) return false;
      
      const ddDay = parseInt(ddDate.split('/')[0]) || parseInt(ddDate);
      if (isNaN(ddDay)) return false;
      
      if (advancedFilters.ddDateFrom) {
        const fromDay = parseInt(advancedFilters.ddDateFrom.split('-')[2]) || parseInt(advancedFilters.ddDateFrom);
        if (ddDay < fromDay) return false;
      }
      
      if (advancedFilters.ddDateTo) {
        const toDay = parseInt(advancedFilters.ddDateTo.split('-')[2]) || parseInt(advancedFilters.ddDateTo);
        if (ddDay > toDay) return false;
      }
    }

    // Appliance count filter
    if (advancedFilters.applianceCount) {
      const applianceCount = sale.appliances?.length || 0;
      const filterCount = advancedFilters.applianceCount;
      
      if (filterCount === '1' && applianceCount !== 1) return false;
      if (filterCount === '2-3' && (applianceCount < 2 || applianceCount > 3)) return false;
      if (filterCount === '4-5' && (applianceCount < 4 || applianceCount > 5)) return false;
      if (filterCount === '6+' && applianceCount < 6) return false;
    }

    // Boiler cover filter
    if (advancedFilters.boilerCover) {
      const hasBoiler = sale.plan?.type?.includes('Boiler') || false;
      if (advancedFilters.boilerCover === 'yes' && !hasBoiler) return false;
      if (advancedFilters.boilerCover === 'no' && hasBoiler) return false;
    }

    return true;
  });

  // Apply current sort if any
  if (currentSortColumn) {
    sortSales(currentSortColumn, true);
  }

  renderSalesTable();
}

/**
 * Populate agent filter dropdown
 */
function populateAgentFilter() {
  const agentFilter = document.getElementById('salesFilterAgent');
  if (!agentFilter) return;

  const agents = [...new Set(sales.map(sale => sale.agentEmail).filter(Boolean))].sort();
  
  agentFilter.innerHTML = '<option value="">All Agents</option>';
  
  agents.forEach(agent => {
    const option = document.createElement('option');
    option.value = agent;
    option.textContent = agent;
    agentFilter.appendChild(option);
  });
}

/**
 * Sort sales table
 */
function sortSales(column, preserveDirection = false) {
  if (!preserveDirection) {
    if (currentSortColumn === column) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortColumn = column;
      currentSortDirection = 'asc';
    }
  }

  // Clear all sort indicators
  document.querySelectorAll('.sort-indicator').forEach(indicator => {
    indicator.textContent = '⇅';
  });

  // Update sort indicator
  const sortIndicator = document.getElementById(`sort-${column}`);
  if (sortIndicator) {
    sortIndicator.textContent = currentSortDirection === 'asc' ? '↑' : '↓';
  }

  // Sort filtered sales
  filteredSales.sort((a, b) => {
    let aValue, bValue;

    switch (column) {
      case 'date':
        aValue = a.submittedAt || a.timestamp || 0;
        bValue = b.submittedAt || b.timestamp || 0;
        break;
      case 'customer':
        aValue = (a.contact?.name || '').toLowerCase();
        bValue = (b.contact?.name || '').toLowerCase();
        break;
      case 'agent':
        aValue = (a.agentEmail || '').toLowerCase();
        bValue = (b.agentEmail || '').toLowerCase();
        break;
      case 'plan':
        aValue = (a.plan?.type || '').toLowerCase();
        bValue = (b.plan?.type || '').toLowerCase();
        break;
      case 'cost':
        aValue = a.plan?.totalCost || 0;
        bValue = b.plan?.totalCost || 0;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return currentSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      if (aValue < bValue) return currentSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return currentSortDirection === 'asc' ? 1 : -1;
      return 0;
    }
  });

  renderSalesTable();
}

/**
 * View sale details in modal
 */
function viewSaleDetails(saleId) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) return;

  const modal = document.getElementById('saleDetailsModal');
  const content = document.getElementById('saleDetailsContent');
  if (!modal || !content) return;

  // Build details HTML (similar to admin.js)
  let detailsHTML = '<div style="display: grid; gap: 24px;">';

  // Contact Information Section
  detailsHTML += '<div class="details-section">';
  detailsHTML += '<h4 style="margin: 0 0 16px 0; color: var(--primary); font-size: 18px;">👤 Contact Information</h4>';
  detailsHTML += '<div style="display: grid; gap: 12px;">';
  detailsHTML += `<div><strong>Name:</strong> ${sale.contact?.name || 'N/A'}</div>`;
  detailsHTML += `<div><strong>Email:</strong> ${sale.contact?.email || 'N/A'}</div>`;
  detailsHTML += `<div><strong>Phone:</strong> ${sale.contact?.phone || 'N/A'}</div>`;
  detailsHTML += `<div><strong>Address:</strong> ${sale.contact?.address || 'N/A'}</div>`;
  detailsHTML += `<div><strong>Postcode:</strong> ${sale.contact?.postcode || 'N/A'}</div>`;
  detailsHTML += '</div></div>';

  // Plan & Payment Section
  detailsHTML += '<div class="details-section">';
  detailsHTML += '<h4 style="margin: 0 0 16px 0; color: var(--primary); font-size: 18px;">💳 Plan & Payment</h4>';
  detailsHTML += '<div style="display: grid; gap: 12px;">';
  detailsHTML += `<div><strong>Plan Number:</strong> ${sale.plan?.number || 'N/A'}</div>`;
  detailsHTML += `<div><strong>Plan Type:</strong> <span class="badge badge-agent">${sale.plan?.type || 'N/A'}</span></div>`;
  detailsHTML += `<div><strong>Total Cost:</strong> <strong style="color: var(--success); font-size: 18px;">£${(sale.plan?.totalCost || 0).toFixed(2)}</strong></div>`;
  if (sale.payment) {
    detailsHTML += `<div><strong>Sort Code:</strong> ${sale.payment.sortCode || 'N/A'}</div>`;
    detailsHTML += `<div><strong>Account Number:</strong> ${sale.payment.accountNumber || 'N/A'}</div>`;
    detailsHTML += `<div><strong>DD Date:</strong> ${sale.payment.ddDate || 'N/A'}</div>`;
  }
  detailsHTML += '</div></div>';

  // Appliances Section
  if (sale.appliances && sale.appliances.length > 0) {
    detailsHTML += '<div class="details-section">';
    detailsHTML += '<h4 style="margin: 0 0 16px 0; color: var(--primary); font-size: 18px;">🏠 Appliances</h4>';
    detailsHTML += '<div style="display: grid; gap: 12px;">';
    sale.appliances.forEach((appliance, index) => {
      detailsHTML += `<div style="padding: 12px; background: var(--gray-100); border-radius: 8px;">`;
      detailsHTML += `<strong>Appliance ${index + 1}:</strong><br>`;
      detailsHTML += `Type: ${appliance.type || 'N/A'}<br>`;
      detailsHTML += `Make: ${appliance.make || 'N/A'}<br>`;
      detailsHTML += `Model: ${appliance.model || 'N/A'}<br>`;
      detailsHTML += `Age: ${appliance.age || 'N/A'}<br>`;
      detailsHTML += `Monthly Cost: £${(appliance.monthlyCost || 0).toFixed(2)}`;
      detailsHTML += '</div>';
    });
    detailsHTML += '</div></div>';
  }

  // Dynamic Fields Section
  if (sale.dynamicFields && Object.keys(sale.dynamicFields).length > 0) {
    detailsHTML += '<div class="details-section">';
    detailsHTML += '<h4 style="margin: 0 0 16px 0; color: var(--primary); font-size: 18px;">📝 Additional Fields</h4>';
    detailsHTML += '<div style="display: grid; gap: 12px;">';
    Object.entries(sale.dynamicFields).forEach(([key, value]) => {
      detailsHTML += `<div><strong>${key}:</strong> ${value || 'N/A'}</div>`;
    });
    detailsHTML += '</div></div>';
  }

  // Notes Section
  if (sale.notes) {
    detailsHTML += '<div class="details-section">';
    detailsHTML += '<h4 style="margin: 0 0 16px 0; color: var(--primary); font-size: 18px;">📄 Notes</h4>';
    detailsHTML += `<div style="padding: 12px; background: var(--gray-100); border-radius: 8px; white-space: pre-wrap;">${sale.notes}</div>`;
    detailsHTML += '</div>';
  }

  detailsHTML += '</div>';

  content.innerHTML = detailsHTML;
  modal.style.display = 'flex';
}

/**
 * Close sale details modal
 */
function closeSaleDetailsModal() {
  const modal = document.getElementById('saleDetailsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Load form fields for mapping
 */
async function loadFormFields() {
  try {
    const fieldsRef = database.ref('form_fields');
    const snapshot = await fieldsRef.once('value');
    
    formFields = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const fieldData = childSnapshot.val();
        formFields.push({
          fieldId: childSnapshot.key,
          ...fieldData
        });
      });
    }
    formFields.sort((a, b) => (a.order || 999) - (b.order || 999));
  } catch (error) {
    console.error('Error loading form fields:', error);
  }
}

/**
 * Load all mapping profiles and set current profile
 */
async function loadFieldMappings() {
  const mappingLoading = document.getElementById('mappingLoading');
  const mappingContent = document.getElementById('mappingContent');

  try {
    mappingLoading.style.display = 'block';
    mappingContent.style.display = 'none';

    if (!currentUser || !currentUser.uid) {
      throw new Error('User not authenticated');
    }

    // Load all mapping profiles
    if (typeof processorProfile !== 'undefined' && processorProfile.getAllMappingProfiles) {
      mappingProfiles = await processorProfile.getAllMappingProfiles(currentUser.uid);
      
      // Get default profile name
      const defaultProfileName = await processorProfile.getDefaultMappingProfile(currentUser.uid);
      currentMappingProfile = defaultProfileName;
      
      // If default profile doesn't exist, create it
      if (!mappingProfiles[currentMappingProfile]) {
        mappingProfiles[currentMappingProfile] = {};
      }
    } else {
      // Fallback: direct database access (backward compatibility)
      const profileRef = database.ref(`processor_profiles/${currentUser.uid}`);
      const snapshot = await profileRef.once('value');

      if (snapshot.exists()) {
        const profile = snapshot.val();
        // Support old format (single fieldMappings) and new format (mappingProfiles)
        if (profile.mappingProfiles) {
          mappingProfiles = profile.mappingProfiles;
          currentMappingProfile = profile.defaultMappingProfile || 'default';
        } else if (profile.fieldMappings) {
          // Migrate old format to new format
          mappingProfiles = { default: profile.fieldMappings };
          currentMappingProfile = 'default';
        } else {
          mappingProfiles = { default: {} };
          currentMappingProfile = 'default';
        }
      } else {
        mappingProfiles = { default: {} };
        currentMappingProfile = 'default';
      }
    }

    // Load current profile's mappings
    fieldMappings = mappingProfiles[currentMappingProfile]?.mappings || mappingProfiles[currentMappingProfile] || {};

    mappingLoading.style.display = 'none';
    mappingContent.style.display = 'block';
    populateProfileSelector();
    renderFieldMappings();
  } catch (error) {
    console.error('Error loading field mappings:', error);
    mappingLoading.innerHTML = '<p style="color: #dc2626;">Error loading field mappings. Please try again.</p>';
    showProcessorMessage('Error loading field mappings: ' + error.message, 'error');
  }
}

/**
 * Populate profile selector dropdown
 */
function populateProfileSelector() {
  const profileSelect = document.getElementById('mappingProfileSelect');
  const deleteBtn = document.getElementById('deleteProfileBtn');
  const setDefaultBtn = document.getElementById('setDefaultBtn');
  
  if (!profileSelect) return;

  profileSelect.innerHTML = '';
  
  const profileNames = Object.keys(mappingProfiles).sort();
  
  profileNames.forEach(profileName => {
    const option = document.createElement('option');
    option.value = profileName;
    option.textContent = profileName === 'default' ? 'Default Profile' : profileName;
    if (profileName === currentMappingProfile) {
      option.selected = true;
    }
    profileSelect.appendChild(option);
  });

  // Show/hide delete and set default buttons
  if (deleteBtn) {
    deleteBtn.style.display = currentMappingProfile === 'default' ? 'none' : 'inline-block';
  }
  if (setDefaultBtn) {
    setDefaultBtn.style.display = currentMappingProfile === 'default' ? 'none' : 'inline-block';
  }
}

/**
 * Switch to a different mapping profile
 */
async function switchMappingProfile(profileName) {
  if (!profileName || profileName === currentMappingProfile) return;
  
  // Save current profile before switching
  await saveCurrentProfileMappings();
  
  const previousProfile = currentMappingProfile;
  currentMappingProfile = profileName;
  fieldMappings = mappingProfiles[currentMappingProfile]?.mappings || mappingProfiles[currentMappingProfile] || {};
  
  // Log profile switch
  await logProcessorActivity('profile_switched', { 
    fromProfile: previousProfile,
    toProfile: profileName 
  });
  
  populateProfileSelector();
  renderFieldMappings();
}

/**
 * Show new profile modal
 */
function showNewProfileModal() {
  const modal = document.getElementById('newProfileModal');
  const nameInput = document.getElementById('newProfileName');
  const errorMsg = document.getElementById('newProfileName-error');
  
  if (modal) {
    modal.style.display = 'flex';
    if (nameInput) {
      nameInput.value = '';
      nameInput.focus();
    }
    if (errorMsg) {
      errorMsg.textContent = '';
    }
  }
}

/**
 * Close new profile modal
 */
function closeNewProfileModal() {
  const modal = document.getElementById('newProfileModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Create a new mapping profile
 */
async function createNewProfile() {
  const nameInput = document.getElementById('newProfileName');
  const errorMsg = document.getElementById('newProfileName-error');
  
  if (!nameInput || !currentUser) return;
  
  const profileName = nameInput.value.trim();
  
  // Validate
  if (!profileName) {
    if (errorMsg) errorMsg.textContent = 'Profile name is required';
    return;
  }
  
  if (profileName === 'default') {
    if (errorMsg) errorMsg.textContent = 'Profile name cannot be "default"';
    return;
  }
  
  if (mappingProfiles[profileName]) {
    if (errorMsg) errorMsg.textContent = 'Profile name already exists';
    return;
  }
  
  // Create new profile
  try {
    mappingProfiles[profileName] = {};
    currentMappingProfile = profileName;
    fieldMappings = {};
    
    // Save to database
    if (typeof processorProfile !== 'undefined' && processorProfile.updateMappingProfile) {
      await processorProfile.updateMappingProfile(currentUser.uid, profileName, {});
      await logProcessorActivity('profile_created', { 
        profileName: profileName 
      });
    }
    
    closeNewProfileModal();
    populateProfileSelector();
    renderFieldMappings();
    showProcessorMessage(`Profile "${profileName}" created successfully`, 'success');
  } catch (error) {
    console.error('Error creating profile:', error);
    if (errorMsg) errorMsg.textContent = 'Error creating profile: ' + error.message;
  }
}

/**
 * Delete current mapping profile
 */
async function deleteCurrentProfile() {
  if (currentMappingProfile === 'default') {
    showProcessorMessage('Cannot delete the default profile', 'error');
    return;
  }
  
  if (!confirm(`Are you sure you want to delete the profile "${currentMappingProfile}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const deletedProfileName = currentMappingProfile;
    
    // Delete from database
    if (typeof processorProfile !== 'undefined' && processorProfile.deleteMappingProfile) {
      await processorProfile.deleteMappingProfile(currentUser.uid, currentMappingProfile);
      await logProcessorActivity('profile_deleted', { 
        profileName: deletedProfileName 
      });
    }
    
    // Remove from local state
    delete mappingProfiles[currentMappingProfile];
    
    // Switch to default profile
    currentMappingProfile = 'default';
    fieldMappings = mappingProfiles[currentMappingProfile] || {};
    
    populateProfileSelector();
    renderFieldMappings();
    showProcessorMessage('Profile deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting profile:', error);
    showProcessorMessage('Error deleting profile: ' + error.message, 'error');
  }
}

/**
 * Set current profile as default
 */
async function setAsDefaultProfile() {
  if (currentMappingProfile === 'default') return;
  
  try {
    if (typeof processorProfile !== 'undefined' && processorProfile.setDefaultMappingProfile) {
      await processorProfile.setDefaultMappingProfile(currentUser.uid, currentMappingProfile);
      await logProcessorActivity('profile_set_default', { 
        profileName: currentMappingProfile 
      });
      showProcessorMessage(`Profile "${currentMappingProfile}" set as default`, 'success');
    }
  } catch (error) {
    console.error('Error setting default profile:', error);
    showProcessorMessage('Error setting default profile: ' + error.message, 'error');
  }
}

/**
 * Save current profile's mappings before switching
 */
async function saveCurrentProfileMappings() {
  if (!currentUser || !currentMappingProfile) return;
  
  try {
    // Collect mappings from UI
    const mappingRulesList = document.getElementById('mappingRulesList');
    if (!mappingRulesList) return;
    
    const inputs = mappingRulesList.querySelectorAll('input[data-field-name]');
    const newMappings = {};
    
    inputs.forEach(input => {
      const fieldName = input.getAttribute('data-field-name');
      const csvName = input.value.trim();
      if (csvName) {
        newMappings[fieldName] = csvName;
      }
    });
    
    // Update local state
    if (!mappingProfiles[currentMappingProfile]) {
      mappingProfiles[currentMappingProfile] = {};
    }
    mappingProfiles[currentMappingProfile].mappings = newMappings;
    fieldMappings = newMappings;
    
    // Save to database
    if (typeof processorProfile !== 'undefined' && processorProfile.updateMappingProfile) {
      await processorProfile.updateMappingProfile(currentUser.uid, currentMappingProfile, newMappings);
    }
  } catch (error) {
    console.error('Error saving current profile:', error);
  }
}

/**
 * Render field mappings UI
 */
function renderFieldMappings() {
  const mappingRulesList = document.getElementById('mappingRulesList');
  if (!mappingRulesList) return;

  mappingRulesList.innerHTML = '';

  // Get all unique field names from sales and form fields
  const allFieldNames = new Set();
  
  // Add standard fields
  allFieldNames.add('Name');
  allFieldNames.add('Phone Numbers');
  allFieldNames.add('Email');
  allFieldNames.add('Adress');
  allFieldNames.add('Postcode');
  allFieldNames.add('Plan number');
  allFieldNames.add('Plan');
  allFieldNames.add('Total Cost');
  allFieldNames.add('Sort Code');
  allFieldNames.add('Account number');
  allFieldNames.add('DD Date');
  allFieldNames.add('Notes - e.g. whats covered');

  // Add form fields
  formFields.forEach(field => {
    allFieldNames.add(field.fieldName);
  });

  // Add dynamic fields from sales
  sales.forEach(sale => {
    if (sale.dynamicFields) {
      Object.keys(sale.dynamicFields).forEach(key => allFieldNames.add(key));
    }
  });

  const fieldNames = Array.from(allFieldNames).sort();

  if (fieldNames.length === 0) {
    mappingRulesList.innerHTML = '<p style="color: var(--text-secondary);">No fields available for mapping.</p>';
    return;
  }

  fieldNames.forEach(fieldName => {
    const mappingRow = document.createElement('div');
    mappingRow.style.display = 'grid';
    mappingRow.style.gridTemplateColumns = '1fr 1fr';
    mappingRow.style.gap = '12px';
    mappingRow.style.marginBottom = '12px';
    mappingRow.style.alignItems = 'center';

    mappingRow.innerHTML = `
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 600; color: var(--text-primary);">${fieldName}</label>
        <small style="color: var(--text-secondary);">Form field name</small>
      </div>
      <div>
        <input 
          type="text" 
          class="mapping-input" 
          data-field-name="${fieldName}"
          value="${fieldMappings[fieldName] || fieldName}"
          placeholder="CSV column name"
          style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: var(--border-radius-sm);">
      </div>
    `;

    mappingRulesList.appendChild(mappingRow);
  });
}

/**
 * Save field mappings to processor profile
 */
async function saveFieldMappings() {
  try {
    if (!currentUser || !currentUser.uid) {
      throw new Error('User not authenticated');
    }

    // Collect mappings from inputs
    const mappingInputs = document.querySelectorAll('.mapping-input');
    const newMappings = {};

    mappingInputs.forEach(input => {
      const fieldName = input.getAttribute('data-field-name');
      const csvName = input.value.trim();
      if (fieldName && csvName) {
        newMappings[fieldName] = csvName;
      }
    });

    // Update local state
    if (!mappingProfiles[currentMappingProfile]) {
      mappingProfiles[currentMappingProfile] = {};
    }
    mappingProfiles[currentMappingProfile].mappings = newMappings;
    fieldMappings = newMappings;

    // Use processor profile service if available, otherwise fallback to direct database access
    if (typeof processorProfile !== 'undefined' && processorProfile.updateMappingProfile) {
      await processorProfile.updateMappingProfile(currentUser.uid, currentMappingProfile, newMappings);
      await processorProfile.logActivity(currentUser.uid, 'mapping_updated', { 
        profileName: currentMappingProfile,
        fieldCount: Object.keys(newMappings).length 
      });
    } else {
      // Fallback: direct database access (backward compatibility)
      const profileRef = database.ref(`processor_profiles/${currentUser.uid}`);
      const existing = await profileRef.once('value');
      const profileData = existing.exists() ? existing.val() : { userId: currentUser.uid };
      
      if (!profileData.mappingProfiles) {
        profileData.mappingProfiles = {};
      }
      profileData.mappingProfiles[currentMappingProfile] = {
        mappings: newMappings,
        updatedAt: new Date().toISOString()
      };
      
      await profileRef.set(profileData);
    }

    showProcessorMessage(`Field mappings saved to profile "${currentMappingProfile}"`, 'success');
  } catch (error) {
    console.error('Error saving field mappings:', error);
    showProcessorMessage('Error saving field mappings: ' + error.message, 'error');
  }
}

/**
 * Load processor profile
 */
async function loadProfile() {
  const profileLoading = document.getElementById('profileLoading');
  const profileContent = document.getElementById('profileContent');
  const profileInfo = document.getElementById('profileInfo');

  try {
    profileLoading.style.display = 'block';
    profileContent.style.display = 'none';

    if (!currentUser || !currentUser.uid) {
      throw new Error('User not authenticated');
    }

    const profileRef = database.ref(`processor_profiles/${currentUser.uid}`);
    const snapshot = await profileRef.once('value');

    let profileHTML = '<div style="display: grid; gap: 16px;">';
    profileHTML += `<div><strong>Email:</strong> ${currentUser.email || 'N/A'}</div>`;
    profileHTML += `<div><strong>Role:</strong> <span class="badge badge-agent">${currentUser.role || 'processor'}</span></div>`;

    if (snapshot.exists()) {
      const profile = snapshot.val();
      profileHTML += `<div><strong>Mappings Count:</strong> ${Object.keys(profile.fieldMappings || {}).length}</div>`;
      if (profile.updatedAt) {
        profileHTML += `<div><strong>Last Updated:</strong> ${new Date(profile.updatedAt).toLocaleString('en-GB')}</div>`;
      }
    } else {
      profileHTML += '<div style="color: var(--text-secondary);">No profile data yet. Create field mappings to get started.</div>';
    }

    profileHTML += '</div>';

    profileInfo.innerHTML = profileHTML;

    profileLoading.style.display = 'none';
    profileContent.style.display = 'block';
  } catch (error) {
    console.error('Error loading profile:', error);
    profileLoading.innerHTML = '<p style="color: #dc2626;">Error loading profile. Please try again.</p>';
    showProcessorMessage('Error loading profile: ' + error.message, 'error');
  }
}

/**
 * Export sales to CSV with field mappings (Enhanced with 160+ fields)
 */
async function exportSalesToCSV() {
  if (filteredSales.length === 0) {
    showProcessorMessage('No sales data to export', 'error');
    return;
  }

  // Use enhanced export service if available
  if (typeof exportService !== 'undefined') {
    try {
      // Get mappings from current profile (or default if not set)
      const currentMappings = fieldMappings || {};
      
      // Apply custom mappings to export service
      exportService.setFieldMappings(currentMappings);
      
      const result = await exportService.exportToCSV(filteredSales, {
        mappings: currentMappings,
        filename: `sales_export_${new Date().toISOString().split('T')[0]}.csv`
      });
      
      showProcessorMessage(`Exported ${result.recordCount} sales to CSV (160+ fields) with your field mappings`, 'success');
      
      // Log activity
      await logProcessorActivity('csv_export', { 
        count: result.recordCount,
        profileName: currentMappingProfile 
      });
      return;
    } catch (error) {
      console.error('Error with enhanced export service:', error);
      // Fall back to basic export
    }
  }

  // Fallback to basic export (backward compatibility)
  // Collect all unique field names from all sales
  const allFieldNames = new Set();
  filteredSales.forEach(sale => {
    allFieldNames.add('Date');
    allFieldNames.add('Customer Name');
    allFieldNames.add('Customer Email');
    allFieldNames.add('Customer Phone');
    allFieldNames.add('Address');
    allFieldNames.add('Postcode');
    allFieldNames.add('Agent Email');
    allFieldNames.add('Plan Number');
    allFieldNames.add('Plan Type');
    allFieldNames.add('Total Cost');
    
    if (sale.dynamicFields) {
      Object.keys(sale.dynamicFields).forEach(key => allFieldNames.add(key));
    }
  });

  const headers = Array.from(allFieldNames);
  
  // Get mappings from current profile (or default if not set)
  const currentMappings = fieldMappings || {};
  
  // Apply field mappings to headers
  const mappedHeaders = headers.map(header => {
    // Map standard fields
    let mappedName = header;
    if (header === 'Customer Name') mappedName = fieldMappings['Name'] || header;
    if (header === 'Customer Email') mappedName = fieldMappings['Email'] || header;
    if (header === 'Customer Phone') mappedName = fieldMappings['Phone Numbers'] || header;
    if (header === 'Address') mappedName = fieldMappings['Adress'] || header;
    if (header === 'Postcode') mappedName = fieldMappings['Postcode'] || header;
    if (header === 'Plan Number') mappedName = fieldMappings['Plan number'] || header;
    if (header === 'Plan Type') mappedName = fieldMappings['Plan'] || header;
    if (header === 'Total Cost') mappedName = fieldMappings['Total Cost'] || header;
    
    // Map dynamic fields
    if (fieldMappings[header]) {
      mappedName = fieldMappings[header];
    }
    
    return mappedName;
  });

  const rows = [mappedHeaders.join(',')];

  filteredSales.forEach(sale => {
    const row = headers.map(header => {
      let value = '';
      
      switch (header) {
        case 'Date':
          value = sale.submittedAt ? new Date(sale.submittedAt).toLocaleDateString('en-GB') : '';
          break;
        case 'Customer Name':
          value = sale.contact?.name || '';
          break;
        case 'Customer Email':
          value = sale.contact?.email || '';
          break;
        case 'Customer Phone':
          value = sale.contact?.phone || '';
          break;
        case 'Address':
          value = sale.contact?.address || '';
          break;
        case 'Postcode':
          value = sale.contact?.postcode || '';
          break;
        case 'Agent Email':
          value = sale.agentEmail || '';
          break;
        case 'Plan Number':
          value = sale.plan?.number || '';
          break;
        case 'Plan Type':
          value = sale.plan?.type || '';
          break;
        case 'Total Cost':
          value = sale.plan?.totalCost || 0;
          break;
        default:
          value = sale.dynamicFields?.[header] || '';
      }
      
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    rows.push(row.join(','));
  });

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showProcessorMessage(`Exported ${filteredSales.length} sales to CSV with your field mappings`, 'success');
  
  // Log activity
  await logProcessorActivity('csv_export', { 
    count: filteredSales.length,
    profileName: currentMappingProfile 
  });
}

/**
 * Load and display activity log
 */
async function loadActivityLog() {
  const activityLoading = document.getElementById('activityLoading');
  const activityList = document.getElementById('activityList');
  const activityEmpty = document.getElementById('activityEmpty');
  
  if (!activityLoading || !activityList || !activityEmpty) return;
  
  try {
    activityLoading.style.display = 'block';
    activityList.style.display = 'none';
    activityEmpty.style.display = 'none';
    
    if (!currentUser || !currentUser.uid) {
      throw new Error('User not authenticated');
    }
    
    const activityRef = database.ref(`processor_profiles/${currentUser.uid}/activity`);
    const snapshot = await activityRef.orderByChild('timestamp').limitToLast(50).once('value');
    
    activityLoading.style.display = 'none';
    
    if (!snapshot.exists() || snapshot.numChildren() === 0) {
      activityEmpty.style.display = 'block';
      return;
    }
    
    const activities = [];
    snapshot.forEach((childSnapshot) => {
      const activity = childSnapshot.val();
      activities.push({
        id: childSnapshot.key,
        ...activity
      });
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    // Render activities
    activityList.innerHTML = '';
    activities.forEach(activity => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.style.cssText = `
        background: var(--bg-secondary);
        padding: 16px;
        border-radius: var(--border-radius);
        margin-bottom: 12px;
        border-left: 4px solid var(--primary);
      `;
      
      const actionIcon = getActionIcon(activity.action);
      const actionLabel = getActionLabel(activity.action);
      const timestamp = activity.timestamp ? new Date(activity.timestamp).toLocaleString('en-GB') : 'Unknown time';
      const details = formatActivityDetails(activity.action, activity.data);
      
      activityItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">${actionIcon}</span>
              <strong style="color: var(--text-primary);">${actionLabel}</strong>
            </div>
            ${details ? `<div style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">${details}</div>` : ''}
          </div>
          <div style="color: var(--text-secondary); font-size: 12px; white-space: nowrap;">
            ${timestamp}
          </div>
        </div>
      `;
      
      activityList.appendChild(activityItem);
    });
    
    activityList.style.display = 'block';
  } catch (error) {
    console.error('Error loading activity log:', error);
    activityLoading.style.display = 'none';
    activityEmpty.style.display = 'block';
    activityEmpty.innerHTML = `
      <p style="font-size: 18px; margin-bottom: 8px; color: var(--error);">Error loading activity log</p>
      <p>${error.message}</p>
    `;
  }
}

/**
 * Get icon for activity action
 */
function getActionIcon(action) {
  const icons = {
    'csv_export': '📥',
    'mapping_updated': '✏️',
    'profile_created': '➕',
    'profile_deleted': '🗑️',
    'profile_switched': '🔄',
    'profile_set_default': '⭐'
  };
  return icons[action] || '📋';
}

/**
 * Get label for activity action
 */
function getActionLabel(action) {
  const labels = {
    'csv_export': 'CSV Export',
    'mapping_updated': 'Mapping Updated',
    'profile_created': 'Profile Created',
    'profile_deleted': 'Profile Deleted',
    'profile_switched': 'Profile Switched',
    'profile_set_default': 'Default Profile Set'
  };
  return labels[action] || action;
}

/**
 * Format activity details
 */
function formatActivityDetails(action, data) {
  if (!data || Object.keys(data).length === 0) return '';
  
  const details = [];
  
  switch (action) {
    case 'csv_export':
      if (data.count !== undefined) {
        details.push(`Exported ${data.count} sales`);
      }
      break;
    case 'mapping_updated':
      if (data.profileName) {
        details.push(`Profile: ${data.profileName}`);
      }
      if (data.fieldCount !== undefined) {
        details.push(`${data.fieldCount} fields mapped`);
      }
      break;
    case 'profile_created':
    case 'profile_deleted':
    case 'profile_set_default':
      if (data.profileName) {
        details.push(`Profile: ${data.profileName}`);
      }
      break;
    case 'profile_switched':
      if (data.fromProfile && data.toProfile) {
        details.push(`From: ${data.fromProfile} → To: ${data.toProfile}`);
      }
      break;
  }
  
  return details.join(' • ');
}

/**
 * Log processor activity
 */
async function logProcessorActivity(action, data = {}) {
  try {
    if (!currentUser || !currentUser.uid) return;

    // Use processor profile service if available, otherwise fallback to direct database access
    if (typeof processorProfile !== 'undefined' && processorProfile.logActivity) {
      await processorProfile.logActivity(currentUser.uid, action, data);
    } else {
      // Fallback: direct database access
      const activityRef = database.ref(`processor_profiles/${currentUser.uid}/activity`);
      await activityRef.push({
        action: action,
        data: data,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging is not critical
  }
}

/**
 * Preview CSV with current mappings
 */
function previewCSVMapping() {
  const modal = document.getElementById('csvPreviewModal');
  const content = document.getElementById('csvPreviewContent');
  if (!modal || !content) return;

  if (filteredSales.length === 0) {
    showProcessorMessage('No sales data to preview', 'error');
    return;
  }

  // Collect all unique field names
  const allFieldNames = new Set();
  filteredSales.forEach(sale => {
    allFieldNames.add('Date');
    allFieldNames.add('Customer Name');
    allFieldNames.add('Customer Email');
    allFieldNames.add('Customer Phone');
    allFieldNames.add('Address');
    allFieldNames.add('Postcode');
    allFieldNames.add('Agent Email');
    allFieldNames.add('Plan Number');
    allFieldNames.add('Plan Type');
    allFieldNames.add('Total Cost');
    
    if (sale.dynamicFields) {
      Object.keys(sale.dynamicFields).forEach(key => allFieldNames.add(key));
    }
  });

  const headers = Array.from(allFieldNames);
  
  // Apply field mappings to headers
  const mappedHeaders = headers.map(header => {
    let mappedName = header;
    if (header === 'Customer Name') mappedName = fieldMappings['Name'] || header;
    if (header === 'Customer Email') mappedName = fieldMappings['Email'] || header;
    if (header === 'Customer Phone') mappedName = fieldMappings['Phone Numbers'] || header;
    if (header === 'Address') mappedName = fieldMappings['Adress'] || header;
    if (header === 'Postcode') mappedName = fieldMappings['Postcode'] || header;
    if (header === 'Plan Number') mappedName = fieldMappings['Plan number'] || header;
    if (header === 'Plan Type') mappedName = fieldMappings['Plan'] || header;
    if (header === 'Total Cost') mappedName = fieldMappings['Total Cost'] || header;
    
    if (fieldMappings[header]) {
      mappedName = fieldMappings[header];
    }
    
    return mappedName;
  });

  // Build preview HTML
  let previewHTML = '<div style="margin-bottom: 20px;">';
  previewHTML += `<p style="color: var(--text-secondary); margin-bottom: 12px;">Preview of CSV with ${filteredSales.length} sales (showing first 5 rows):</p>`;
  previewHTML += '<div style="overflow-x: auto; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--border-radius);">';
  previewHTML += '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
  
  // Headers
  previewHTML += '<thead><tr style="background: var(--gray-100);">';
  mappedHeaders.forEach(header => {
    previewHTML += `<th style="padding: 8px; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">${header}</th>`;
  });
  previewHTML += '</tr></thead>';
  
  // Sample rows (first 5)
  previewHTML += '<tbody>';
  filteredSales.slice(0, 5).forEach(sale => {
    previewHTML += '<tr>';
    headers.forEach(header => {
      let value = '';
      
      switch (header) {
        case 'Date':
          value = sale.submittedAt ? new Date(sale.submittedAt).toLocaleDateString('en-GB') : '';
          break;
        case 'Customer Name':
          value = sale.contact?.name || '';
          break;
        case 'Customer Email':
          value = sale.contact?.email || '';
          break;
        case 'Customer Phone':
          value = sale.contact?.phone || '';
          break;
        case 'Address':
          value = sale.contact?.address || '';
          break;
        case 'Postcode':
          value = sale.contact?.postcode || '';
          break;
        case 'Agent Email':
          value = sale.agentEmail || '';
          break;
        case 'Plan Number':
          value = sale.plan?.number || '';
          break;
        case 'Plan Type':
          value = sale.plan?.type || '';
          break;
        case 'Total Cost':
          value = sale.plan?.totalCost || 0;
          break;
        default:
          value = sale.dynamicFields?.[header] || '';
      }
      
      previewHTML += `<td style="padding: 8px; border: 1px solid var(--border-color);">${value || '-'}</td>`;
    });
    previewHTML += '</tr>';
  });
  previewHTML += '</tbody>';
  previewHTML += '</table>';
  previewHTML += '</div>';
  
  if (filteredSales.length > 5) {
    previewHTML += `<p style="color: var(--text-secondary); margin-top: 12px; font-size: 14px;">... and ${filteredSales.length - 5} more rows</p>`;
  }
  
  previewHTML += '</div>';

  content.innerHTML = previewHTML;
  modal.style.display = 'flex';
}

/**
 * Close CSV preview modal
 */
function closeCSVPreview() {
  const modal = document.getElementById('csvPreviewModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Show processor message
 */
function showProcessorMessage(message, type) {
  const processorMessage = document.getElementById('processorMessage');
  const processorMessageContent = document.getElementById('processorMessageContent');
  
  if (processorMessage && processorMessageContent) {
    processorMessageContent.textContent = message;
    processorMessageContent.className = `message ${type}`;
    processorMessage.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      processorMessage.style.display = 'none';
    }, 5000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProcessor);
} else {
  initializeProcessor();
}
