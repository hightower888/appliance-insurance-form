/**
 * CRM System - Core Module
 * Handles customer/lead viewing, editing, and navigation
 */

// Global state
let leads = [];
let customers = [];
let filteredLeads = [];
let filteredCustomers = [];
let currentLeadIndex = 0;
let currentCustomerIndex = 0;
let editingLeadId = null;
let isEditMode = false;

// Pagination state
let currentPage = 1;
let pageSize = 50;
let totalPages = 1;

// Current tab
let currentTab = 'leads';

// Debounce timer for search
let searchDebounceTimer = null;

// Real-time listeners
let salesListener = null;

// Phase 2: Services and Components
// Note: kpiCalculator is created as singleton in kpi-calculator.js, use window.kpiCalculator
// Note: chartService is created as singleton in chart-service.js, use window.chartService
// Note: searchService is created as singleton in search-service.js, use window.searchService
let dashboard = null;
let tableView = null;
let kanbanView = null;
let historyViewer = null;
let auditViewer = null;

// Phase 3: Advanced View Components
let timelineView = null;
let cardView = null;

// Phase 3: Advanced Services and Components
let autoSaveService = null;
let virtualScrollingService = null;
let diffViewer = null;
let reportBuilder = null;

// Phase 3: Additional Features
let keyboardShortcutsService = null;
let savedViews = null;
let recentItems = null;

// Phase 3: Remaining Features
let restoreVersions = null;
let scheduledReports = null;

/**
 * Close lead detail modal
 */
function closeLeadDetailModal() {
  const modal = document.getElementById('leadDetailModal');
  if (modal) {
    modal.style.display = 'none';
  }
  editingLeadId = null;
  isEditMode = false;
}

/**
 * Close upload modal
 */
function closeUploadModal() {
  const modal = document.getElementById('uploadLeadsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Search leads (with debouncing)
 */
function searchLeads() {
  // Clear existing timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  // Debounce search for performance
  searchDebounceTimer = setTimeout(() => {
    const searchInput = document.getElementById('leadsSearch');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
      filteredLeads = [...leads];
    } else {
      // Use SearchService if available, otherwise use default search
      if (window.searchService && typeof window.searchService.search === 'function') {
        const results = window.searchService.search(query, leads);
        filteredLeads = results;
      } else {
        // Fallback to simple search
        filteredLeads = leads.filter(lead => {
          const name = (lead.contact?.name || '').toLowerCase();
          const email = (lead.contact?.email || '').toLowerCase();
          const phone = (lead.contact?.phone || '').toLowerCase();
          const address = (lead.contact?.address || '').toLowerCase();
          const postcode = (lead.contact?.postcode || '').toLowerCase();
          const notes = (lead.notes || '').toLowerCase();
          
          return name.includes(query) || 
                 email.includes(query) || 
                 phone.includes(query) || 
                 address.includes(query) || 
                 postcode.includes(query) ||
                 notes.includes(query);
        });
      }
    }

    currentPage = 1;
    currentLeadIndex = 0;
    updateLeadCyclingControls();
    
    // Use TableView if available, otherwise use default rendering
    if (tableView && typeof tableView.render === 'function') {
      tableView.render(filteredLeads);
    } else {
      renderLeadList();
    }
  }, 300); // 300ms debounce
}

/**
 * Get database reference - ensures database is available
 * @returns {Object} Firebase database reference
 */
function getDatabase() {
  const db = database || window.database;
  if (!db) {
    throw new Error('Database not initialized. Please refresh the page.');
  }
  return db;
}

/**
 * Initialize CRM system
 */
async function initializeCRM() {
  // Check authentication using auth-db.js
  if (typeof checkAuth === 'function') {
    const authenticated = await checkAuth('login.html');
    if (!authenticated) {
      return; // Redirected to login
    }
  }

  // Initialize Enhanced Logger
  if (typeof enhancedLogger !== 'undefined' && database) {
    enhancedLogger.initialize(database);
    console.log('Enhanced Logger initialized for CRM');
  }

  // Initialize Phase 2 Services
  // kpiCalculator is already created as singleton in kpi-calculator.js
  if (typeof window.kpiCalculator !== 'undefined') {
    console.log('KPI Calculator available');
  } else if (typeof KPICalculator !== 'undefined') {
    window.kpiCalculator = new KPICalculator();
    console.log('KPI Calculator initialized');
  }
  
  // chartService is already created as singleton in chart-service.js
  if (typeof window.chartService !== 'undefined') {
    console.log('Chart Service available');
  } else if (typeof ChartService !== 'undefined') {
    window.chartService = new ChartService();
    console.log('Chart Service initialized');
  }
  
  // searchService is already created as singleton in search-service.js
  if (typeof window.searchService !== 'undefined') {
    console.log('Search Service available');
  } else if (typeof SearchService !== 'undefined') {
    window.searchService = new SearchService();
    console.log('Search Service initialized');
  }

  // Initialize State Manager (already loaded from crm-state.js)
  if (typeof crmState !== 'undefined') {
    console.log('State Manager available for CRM');
  } else if (typeof checkRole === 'function') {
    const hasAccess = await checkRole('crm.html');
    if (!hasAccess) {
      return; // Redirected
    }
  }

  // Display user info
  if (typeof getCurrentUser === 'function') {
    try {
      const user = getCurrentUser();
      const userEmail = document.getElementById('userEmail');
      if (userEmail && user) {
        userEmail.textContent = user.email || user.username || 'User';
      }
    } catch (error) {
      console.warn('Error getting current user:', error);
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
  
  // Initialize filter component
  if (typeof initFilterComponent === 'function') {
    initFilterComponent('filterPills', {
      onFilterChange: (filters) => {
        // Filter change handled by existing filterLeads function
        if (typeof filterLeads === 'function') {
          filterLeads();
        }
      }
    });
  }
  
  // Initialize bulk operations
  if (typeof bulkOperations !== 'undefined') {
    bulkOperations.options.onDelete = async (leadId) => {
      // Delete lead from Firebase
      try {
        const db = getDatabase();
        const leadRef = db.ref(`sales/${leadId}`);
        await leadRef.remove();
        
        // Log activity
        if (typeof enhancedLogger !== 'undefined') {
          await enhancedLogger.logFieldChanges('bulk_delete', leadId, null, null, {
            source: 'bulk_operations'
          });
        }
      } catch (error) {
        throw new Error(`Failed to delete lead ${leadId}: ${error.message}`);
      }
    };
  }
  
  // Initialize bulk selection with callbacks
  if (typeof bulkSelection !== 'undefined') {
    bulkSelection.options.onDeleteSelected = async (selectedIds) => {
      if (typeof bulkOperations !== 'undefined') {
        await bulkOperations.deleteSelected(selectedIds);
        // Reload leads after deletion
        await loadLeads();
      }
    };
    
    bulkSelection.options.onExportSelected = async (selectedIds) => {
      if (typeof exportService !== 'undefined') {
        const selectedLeads = filteredLeads.filter(lead => 
          selectedIds.includes(lead.id)
        );
        await exportService.exportToCSV(selectedLeads, {
          selectedIds,
          filename: `leads_export_selected_${new Date().toISOString().split('T')[0]}.csv`
        });
      }
    };
  }
  
  // Initialize Phase 2 Components
  const kpiCalc = window.kpiCalculator || (typeof KPICalculator !== 'undefined' ? new KPICalculator() : null);
  const chartSvc = window.chartService || (typeof ChartService !== 'undefined' ? new ChartService() : null);
  if (typeof Dashboard !== 'undefined' && kpiCalc && chartSvc) {
    const dashboardContainer = document.getElementById('dashboardContainer') || document.getElementById('reportsDashboard');
    if (dashboardContainer) {
      dashboard = new Dashboard({
        container: dashboardContainer,
        kpiCalculator: kpiCalc,
        chartService: chartSvc
      });
      console.log('Dashboard initialized');
    }
  }

  if (typeof TableView !== 'undefined') {
    const tableContainer = document.getElementById('leadsTableContainer') || document.querySelector('.leads-table-container');
    if (tableContainer) {
      tableView = new TableView(tableContainer, [], {
        columns: [
          { field: 'contact.name', label: 'Customer Name', sortable: true },
          { field: 'contact.email', label: 'Email', sortable: true },
          { field: 'contact.phone', label: 'Phone', sortable: true },
          { field: 'leadStatus', label: 'Status', sortable: true },
          { field: 'disposition', label: 'Disposition', sortable: true },
          { field: 'agentEmail', label: 'Agent', sortable: true }
        ],
        enableVirtualScrolling: false, // Can be enabled for large datasets
        stateManager: typeof crmState !== 'undefined' ? crmState : null,
        onRowClick: (item, index) => {
          if (item.id && typeof viewLeadDetails === 'function') {
            viewLeadDetails(item.id);
          }
        }
      });
      console.log('Table View initialized');
    }
  }

  if (typeof KanbanView !== 'undefined') {
    const kanbanContainer = document.getElementById('kanbanContainer');
    if (kanbanContainer) {
      kanbanView = new KanbanView(kanbanContainer, filteredLeads, {
        stateManager: typeof crmState !== 'undefined' ? crmState : null,
        onCardClick: (item, itemId) => {
          if (typeof viewLeadDetails === 'function') {
            viewLeadDetails(itemId);
          }
        }
      });
      console.log('Kanban View initialized');
    }
  }

  if (typeof HistoryViewer !== 'undefined' && typeof enhancedLogger !== 'undefined') {
    const historyContainer = document.getElementById('leadHistoryContainer');
    if (historyContainer) {
      historyViewer = new HistoryViewer({
        container: historyContainer,
        logger: enhancedLogger
      });
      console.log('History Viewer initialized');
    }
  }

  if (typeof AuditViewer !== 'undefined' && typeof enhancedLogger !== 'undefined') {
    const auditContainer = document.getElementById('auditViewerContainer');
    if (auditContainer) {
      auditViewer = new AuditViewer({
        container: auditContainer,
        logger: enhancedLogger
      });
      console.log('Audit Viewer initialized');
    }
  }

  // Load initial data
  await loadLeads();
  
  // Load agents for agent filter after leads are loaded
  if (typeof filterComponentInstance !== 'undefined' && leads.length > 0) {
    // Convert leads to sales format for agent filter
    const salesFormat = leads.map(lead => ({
      agentEmail: lead.agentEmail || ''
    }));
    filterComponentInstance.loadAgents(salesFormat);
  }
  
  // Initialize Phase 4A: Mobile & Performance
  if (typeof TouchInteractions !== 'undefined') {
    const touchInteractions = new TouchInteractions({
      onPullToRefresh: async () => {
        if (typeof loadLeads === 'function') {
          await loadLeads();
        }
      },
      onSwipeLeft: (e) => {
        // Swipe left actions (e.g., next lead)
        if (typeof cycleToNextLead === 'function') {
          cycleToNextLead();
        }
      },
      onSwipeRight: (e) => {
        // Swipe right actions (e.g., previous lead)
        if (typeof cycleToPreviousLead === 'function') {
          cycleToPreviousLead();
        }
      }
    });
    
    // Initialize touch interactions on main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      touchInteractions.init(mainContent);
    }
    
    // Make kanban cards swipeable
    if (kanbanView && typeof kanbanView.render === 'function') {
      // Will be initialized when kanban renders
    }
    
    window.touchInteractions = touchInteractions;
    console.log('Touch Interactions initialized');
  }

  // Mobile navigation is auto-initialized by mobile-navigation.js

  // Initialize Phase 4B: Analytics & Automation
  if (typeof workflowAutomationEngine !== 'undefined') {
    // Workflow automation engine is auto-initialized
    console.log('Workflow Automation Engine initialized');
    
    // Hook workflow triggers into lead updates
    const originalSaveLead = window.saveLead;
    if (originalSaveLead) {
      window.saveLead = async function(...args) {
        const result = await originalSaveLead.apply(this, args);
        // Trigger workflow automation on lead save
        if (workflowAutomationEngine && editingLeadId) {
          const lead = [...leads, ...customers].find(l => l.id === editingLeadId);
          if (lead) {
            await workflowAutomationEngine.processTrigger(lead, 'field_change', {
              newValue: lead.disposition
            });
          }
        }
        return result;
      };
    }

    // Phase 4B: Time-based workflow triggers - check for stale leads periodically
    setInterval(async () => {
      if (workflowAutomationEngine && leads.length > 0) {
        // Check all leads for time-based triggers
        for (const lead of leads) {
          await workflowAutomationEngine.processTrigger(lead, 'time_based', {});
        }
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  // Initialize Push Notifications
  if (typeof PushNotificationService !== 'undefined') {
    const pushNotificationService = new PushNotificationService({
      onNotificationClick: (notification) => {
        // Focus window or navigate
        if (notification.data && notification.data.url) {
          window.location.href = notification.data.url;
        }
      }
    });
    
    pushNotificationService.init().then(success => {
      if (success) {
        console.log('Push Notifications initialized');
      }
    });
    
    window.pushNotificationService = pushNotificationService;
  }
  
  // Set up real-time listeners (optional - can be disabled for performance)
  setupRealTimeListeners();
}

/**
 * Set up real-time Firebase listeners
 */
function setupRealTimeListeners() {
  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    
    // Remove existing listener if any
    if (salesListener) {
      salesRef.off('value', salesListener);
    }
    
    // Set up new listener for real-time updates
    salesListener = (snapshot) => {
      // Only update if we're on the leads or customers tab
      if (currentTab === 'leads') {
        // Reload leads in background (don't show loading)
        loadLeads().catch(error => {
          console.warn('Error in real-time update:', error);
        });
      } else if (currentTab === 'customers') {
        loadCustomers().catch(error => {
          console.warn('Error in real-time update:', error);
        });
      }
    };
    
    salesRef.on('value', salesListener);
    console.log('Real-time listeners set up');
  } catch (error) {
    console.warn('Error setting up real-time listeners:', error);
    // Continue without real-time updates
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Tab switching
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (typeof logout === 'function') {
        await logout();
      } else if (typeof logOut === 'function') {
        await logOut();
      } else {
        // Fallback: clear session and redirect
        sessionStorage.clear();
        window.location.href = '/login.html';
      }
    });
  }

  // Close modal buttons
  const closeLeadModalBtn = document.getElementById('closeLeadModalBtn');
  if (closeLeadModalBtn) {
    closeLeadModalBtn.addEventListener('click', closeLeadDetailModal);
  }

  // Disposition select change
  const dispositionSelect = document.getElementById('dispositionSelect');
  if (dispositionSelect) {
    dispositionSelect.addEventListener('change', () => {
      const value = dispositionSelect.value;
      if (value && typeof setDisposition === 'function') {
        setDisposition();
      }
    });
  }

  // Upload leads button
  const uploadLeadsBtn = document.getElementById('uploadLeadsBtn');
  if (uploadLeadsBtn) {
    uploadLeadsBtn.addEventListener('click', () => {
      const modal = document.getElementById('uploadLeadsModal');
      if (modal) {
        modal.style.display = 'block';
      }
    });
  }

  // Close upload modal
  const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
  if (closeUploadModalBtn) {
    closeUploadModalBtn.addEventListener('click', closeUploadModal);
  }

  // Close modals when clicking outside
  const leadModal = document.getElementById('leadDetailModal');
  const uploadModal = document.getElementById('uploadLeadsModal');
  
  if (leadModal) {
    leadModal.addEventListener('click', (e) => {
      if (e.target === leadModal) {
        closeLeadDetailModal();
      }
    });
  }
  
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) {
        closeUploadModal();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Only handle if modal is not open or if modal is open and it's the lead detail modal
    const leadModal = document.getElementById('leadDetailModal');
    const isModalOpen = leadModal && leadModal.style.display === 'block';
    
    if (currentTab === 'leads' && (!isModalOpen || isModalOpen)) {
      if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        if (typeof cycleToPreviousLead === 'function') {
          cycleToPreviousLead();
        }
      } else if (e.key === 'ArrowRight' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        if (typeof cycleToNextLead === 'function') {
          cycleToNextLead();
        }
      } else if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        closeLeadDetailModal();
      }
    }
  });

  // Customer pagination buttons
  const customersPrevBtn = document.getElementById('customersPrevBtn');
  const customersNextBtn = document.getElementById('customersNextBtn');
  
  if (customersPrevBtn) {
    customersPrevBtn.addEventListener('click', () => {
      if (currentTab === 'customers') {
        previousPage();
      }
    });
  }
  
  if (customersNextBtn) {
    customersNextBtn.addEventListener('click', () => {
      if (currentTab === 'customers') {
        nextPage();
      }
    });
  }
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Show/hide tab content
  const tabContents = document.querySelectorAll('.admin-tab-content');
  tabContents.forEach(content => {
    if (content.id === `${tabName}Tab`) {
      content.style.display = 'block';
    } else {
      content.style.display = 'none';
    }
  });

  // Load data for selected tab
  if (tabName === 'leads') {
    loadLeads();
  } else if (tabName === 'customers') {
    loadCustomers();
  } else if (tabName === 'reports') {
    // Load reports when tab is switched to
    setTimeout(() => {
      if (typeof renderKPIDashboard === 'function') {
        renderKPIDashboard();
      }
      // Also render Dashboard component if available
      if (dashboard && typeof dashboard.render === 'function') {
        dashboard.render();
      }
    }, 100);
  } else if (tabName === 'kanban') {
    // Load kanban view when tab is switched to
    if (kanbanView && typeof kanbanView.render === 'function') {
      kanbanView.render(filteredLeads);
    }
  } else if (tabName === 'dashboard') {
    // Load elite dashboard when tab is switched to
    const dashboardContainer = document.getElementById('dashboardContainer');
    if (dashboardContainer) {
      // Initialize EliteDashboard if not already initialized
      if (!dashboard || !(dashboard instanceof EliteDashboard)) {
        if (typeof EliteDashboard !== 'undefined') {
          dashboard = new EliteDashboard({
            containerId: 'dashboardContainer',
            showKPIs: true,
            showCharts: true,
            showActivityFeed: true,
            showQuickActions: true
          });
        } else {
          console.warn('EliteDashboard not available');
        }
      } else {
        // Refresh existing dashboard
        dashboard.refresh();
      }
    }
  } else if (tabName === 'audit') {
    // Load audit viewer when tab is switched to
    if (auditViewer && typeof auditViewer.render === 'function') {
      auditViewer.render();
    }
  } else if (tabName === 'timeline') {
    // Load timeline view when tab is switched to
    if (timelineView && typeof timelineView.render === 'function') {
      timelineView.update(filteredLeads);
      timelineView.render();
    }
  } else if (tabName === 'cards') {
    // Load card view when tab is switched to
    if (cardView && typeof cardView.render === 'function') {
      cardView.update(filteredLeads);
      cardView.render();
    }
  } else if (tabName === 'reportBuilder') {
    // Load report builder when tab is switched to
    if (reportBuilder && typeof reportBuilder.render === 'function') {
      reportBuilder.render();
    }
  } else if (tabName === 'savedViews') {
    // Load saved views when tab is switched to
    if (savedViews && typeof savedViews.render === 'function') {
      const container = document.getElementById('savedViewsContainer');
      if (container) {
        savedViews.render(container);
      }
    }
  } else if (tabName === 'scheduledReports') {
    // Load scheduled reports when tab is switched to
    if (scheduledReports && typeof scheduledReports.render === 'function') {
      const container = document.getElementById('scheduledReportsContainer');
      if (container) {
        scheduledReports.render(container);
      }
    }
  }
}

/**
 * Get user role helper function
 */
async function getUserRole(uid) {
  try {
    const db = getDatabase();
    const userRef = db.ref(`users/${uid}/role`);
    const snapshot = await userRef.once('value');
    return snapshot.val() || 'agent';
  } catch (error) {
    console.warn('Error getting user role:', error);
    return 'agent'; // Default to agent
  }
}

/**
 * Load leads from Firebase with pagination and caching
 */
async function loadLeads(page = 1) {
  const leadsLoading = document.getElementById('leadsLoading');
  const leadsTable = document.getElementById('leadsTable');
  const leadsEmpty = document.getElementById('leadsEmpty');

  try {
    // Wait for auth state to be ready before database access
    let authUser;
    try {
      authUser = await waitForAuth(5000);
      if (!authUser) {
        console.warn('User not authenticated, cannot load leads');
        if (typeof showCRMMessage === 'function') {
          showCRMMessage('Please log in to view leads', 'error');
        }
        return;
      }
    } catch (authError) {
      console.error('Auth error in loadLeads:', authError);
      if (typeof showCRMMessage === 'function') {
        showCRMMessage('Authentication error. Please refresh the page.', 'error');
      }
      return;
    }
    
    if (leadsLoading) {
      leadsLoading.style.display = 'block';
      leadsLoading.innerHTML = `
        <div style="padding: 20px;">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
          <div style="margin-top: 20px;">
            ${Array(5).fill(0).map(() => '<div class="skeleton skeleton-table-row"></div>').join('')}
          </div>
        </div>
      `;
    }
    if (leadsTable) leadsTable.style.display = 'none';
    if (leadsEmpty) leadsEmpty.style.display = 'none';

    // Initialize QueryOptimizer if not exists
    if (!window.queryOptimizer) {
      window.queryOptimizer = new QueryOptimizer({
        defaultPageSize: pageSize,
        cacheQueries: true,
        cacheTTL: 5 * 60 * 1000 // 5 minutes
      });
    }

    // Check cache first
    const cacheKey = `leads_page_${page}_${authUser.uid}`;
    if (window.cacheManager && window.cacheManager.has(cacheKey)) {
      const cached = window.cacheManager.get(cacheKey);
      leads = cached.items || [];
      filteredLeads = [...leads];
      currentPage = page;
      totalPages = cached.totalPages || 1;
      currentLeadIndex = 0;
      
      if (leadsLoading) leadsLoading.style.display = 'none';
      if (leadsTable) leadsTable.style.display = 'block';
      
      updateLeadCyclingControls();
      updatePaginationControls();
      
      if (tableView && typeof tableView.render === 'function') {
        tableView.render(filteredLeads);
      } else {
        renderLeadList();
      }
      return; // Return from cache - instant!
    }

    const db = getDatabase();
    const salesRef = db.ref('sales');
    
    // Get user role for filtering
    const userRole = await getUserRole(authUser.uid);
    
    // Build optimized query with server-side filtering
    let query = salesRef.orderByChild('timestamp');
    
    // Apply agent filtering at query level if user is agent
    if (userRole === 'agent') {
      // For agents, filter by agentId (requires compound query or client-side filter)
      // Note: Firebase doesn't support multiple orderBy, so we'll filter client-side after limited query
      query = query.limitToLast(1000); // Get recent 1000, then filter client-side
    } else {
      // For admin/processor, can see all but still paginate
      query = query.limitToFirst(pageSize * page);
    }
    
    // Execute query
    const snapshot = await query.once('value');
    
    leads = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleId = childSnapshot.key;
        const saleData = childSnapshot.val();
        
        // Apply agent filtering if needed
        if (userRole === 'agent' && saleData.agentId !== authUser.uid) {
          return; // Skip if not this agent's lead
        }
        
        // Determine if this is a lead (not converted)
        const isLead = !saleData.submittedAt || 
                      saleData.leadStatus === 'new' || 
                      saleData.leadStatus === 'contacted' || 
                      saleData.leadStatus === 'dispositioned' ||
                      (!saleData.leadStatus && !saleData.submittedAt);
        
        if (isLead) {
          leads.push({
            id: saleId,
            ...saleData
          });
        }
      });
    }

    // Sort by timestamp (newest first)
    leads.sort((a, b) => {
      const aTime = a.timestamp || 0;
      const bTime = b.timestamp || 0;
      return bTime - aTime;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLeads = leads.slice(startIndex, endIndex);
    
    filteredLeads = paginatedLeads;
    currentPage = page;
    totalPages = Math.ceil(leads.length / pageSize);
    currentLeadIndex = 0;
    
    // Cache result
    if (window.cacheManager) {
      window.cacheManager.set(cacheKey, {
        items: paginatedLeads,
        totalPages: totalPages,
        totalItems: leads.length
      }, 5 * 60 * 1000);
    }
    
    if (leadsLoading) leadsLoading.style.display = 'none';
    if (leadsTable) leadsTable.style.display = 'block';
    
    updateLeadCyclingControls();
    updatePaginationControls();
    
    // Use TableView if available, otherwise use default rendering
    if (tableView && typeof tableView.render === 'function') {
      tableView.render(filteredLeads);
    } else {
      renderLeadList();
    }
  } catch (error) {
    console.error('Error loading leads:', error);
    if (leadsLoading) {
      leadsLoading.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: #dc2626; margin-bottom: 15px;">Unable to load leads</p>
          <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 15px;">
            ${error.message.includes('permission') 
              ? 'You may need to log in again. Please refresh the page and try again.' 
              : 'Please check your connection and try again.'}
          </p>
          <button class="btn btn-primary" onclick="if(typeof loadLeads === 'function') { loadLeads(${currentPage}); }">Retry</button>
        </div>
      `;
    }
    const errorMsg = error.message.includes('permission') 
      ? 'Permission denied. Please refresh the page and log in again.'
      : 'Error loading leads: ' + error.message;
    showCRMMessage(errorMsg, 'error');
  }
}

/**
 * Load customers (converted leads) from Firebase with pagination and caching
 */
async function loadCustomers(page = 1) {
  const customersLoading = document.getElementById('customersLoading');
  const customersTable = document.getElementById('customersTable');
  const customersEmpty = document.getElementById('customersEmpty');

  try {
    // Wait for auth state to be ready before database access
    let authUser;
    try {
      authUser = await waitForAuth(5000);
      if (!authUser) {
        console.warn('User not authenticated, cannot load customers');
        if (typeof showCRMMessage === 'function') {
          showCRMMessage('Please log in to view customers', 'error');
        }
        return;
      }
    } catch (authError) {
      console.error('Auth error in loadCustomers:', authError);
      if (typeof showCRMMessage === 'function') {
        showCRMMessage('Authentication error. Please refresh the page.', 'error');
      }
      return;
    }
    
    if (customersLoading) {
      customersLoading.style.display = 'block';
      customersLoading.innerHTML = `
        <div style="padding: 20px;">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
          <div class="skeleton skeleton-text" style="width: 60%;"></div>
          <div style="margin-top: 20px;">
            ${Array(5).fill(0).map(() => '<div class="skeleton skeleton-table-row"></div>').join('')}
          </div>
        </div>
      `;
    }
    if (customersTable) customersTable.style.display = 'none';
    if (customersEmpty) customersEmpty.style.display = 'none';

    // Initialize QueryOptimizer if not exists
    if (!window.queryOptimizer) {
      window.queryOptimizer = new QueryOptimizer({
        defaultPageSize: pageSize,
        cacheQueries: true,
        cacheTTL: 5 * 60 * 1000 // 5 minutes
      });
    }

    // Check cache first
    const cacheKey = `customers_page_${page}_${authUser.uid}`;
    if (window.cacheManager && window.cacheManager.has(cacheKey)) {
      const cached = window.cacheManager.get(cacheKey);
      customers = cached.items || [];
      filteredCustomers = [...customers];
      currentPage = page;
      totalPages = cached.totalPages || 1;
      
      if (customersLoading) customersLoading.style.display = 'none';
      if (customersTable) customersTable.style.display = 'block';
      
      updatePaginationControls('customers');
      renderCustomerList();
      return; // Return from cache - instant!
    }

    const db = getDatabase();
    const salesRef = db.ref('sales');
    
    // Get user role for filtering
    const userRole = await getUserRole(authUser.uid);
    
    // Build optimized query
    let query = salesRef.orderByChild('timestamp');
    
    // Apply agent filtering at query level if user is agent
    if (userRole === 'agent') {
      query = query.limitToLast(1000); // Get recent 1000, then filter client-side
    } else {
      query = query.limitToFirst(pageSize * page);
    }
    
    // Execute query
    const snapshot = await query.once('value');
    
    customers = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleId = childSnapshot.key;
        const saleData = childSnapshot.val();
        
        // Apply agent filtering if needed
        if (userRole === 'agent' && saleData.agentId !== authUser.uid) {
          return; // Skip if not this agent's customer
        }
        
        // Determine if this is a customer (converted)
        const isCustomer = saleData.submittedAt || 
                          saleData.leadStatus === 'converted' ||
                          (!saleData.leadStatus && saleData.submittedAt);
        
        if (isCustomer) {
          customers.push({
            id: saleId,
            ...saleData
          });
        }
      });
    }

    // Sort by timestamp (newest first)
    customers.sort((a, b) => {
      const aTime = a.timestamp || 0;
      const bTime = b.timestamp || 0;
      return bTime - aTime;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCustomers = customers.slice(startIndex, endIndex);
    
    filteredCustomers = paginatedCustomers;
    currentPage = page;
    totalPages = Math.ceil(customers.length / pageSize);
    
    // Cache result
    if (window.cacheManager) {
      window.cacheManager.set(cacheKey, {
        items: paginatedCustomers,
        totalPages: totalPages,
        totalItems: customers.length
      }, 5 * 60 * 1000);
    }
    
    if (customersLoading) customersLoading.style.display = 'none';
    if (customersTable) customersTable.style.display = 'block';
    
    updatePaginationControls('customers');
    renderCustomerList();
  } catch (error) {
    console.error('Error loading customers:', error);
    if (customersLoading) {
      customersLoading.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: #dc2626; margin-bottom: 15px;">Unable to load customers</p>
          <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 15px;">
            ${error.message.includes('permission') 
              ? 'You may need to log in again. Please refresh the page and try again.' 
              : 'Please check your connection and try again.'}
          </p>
          <button class="btn btn-primary" onclick="if(typeof loadCustomers === 'function') { loadCustomers(${currentPage}); }">Retry</button>
        </div>
      `;
    }
    const errorMsg = error.message.includes('permission') 
      ? 'Permission denied. Please refresh the page and log in again.'
      : 'Error loading customers: ' + error.message;
    showCRMMessage(errorMsg, 'error');
  }
}

/**
 * Render lead list with pagination
 */
function renderLeadList() {
  const leadsTableBody = document.getElementById('leadsTableBody');
  const leadsEmpty = document.getElementById('leadsEmpty');
  if (!leadsTableBody) return;

  requestAnimationFrame(() => {
    leadsTableBody.innerHTML = '';

    const totalItems = filteredLeads.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageLeads = filteredLeads.slice(startIndex, endIndex);

    if (pageLeads.length === 0) {
      if (leadsEmpty) leadsEmpty.style.display = 'block';
      const leadsTable = document.getElementById('leadsTable');
      if (leadsTable) leadsTable.style.display = 'none';
      return;
    }

    if (leadsEmpty) leadsEmpty.style.display = 'none';

    const fragment = document.createDocumentFragment();
    
    pageLeads.forEach((lead) => {
      const row = document.createElement('tr');
      
      const date = new Date(lead.timestamp || 0);
      const dateStr = date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      
      const name = lead.contact?.name || 'N/A';
      const contact = `${lead.contact?.phone || ''} ${lead.contact?.email || ''}`.trim() || 'N/A';
      
      const status = lead.leadStatus || 'new';
      const statusBadge = getStatusBadge(status);
      
      const disposition = lead.disposition || null;
      const dispositionBadge = getDispositionBadge(disposition);
      
      const source = lead.leadSource || 'unknown';
      const sourceBadge = getSourceBadge(source);

      row.setAttribute('data-lead-id', lead.id);
      row.style.cursor = 'pointer';
      row.onclick = (e) => {
        // Don't trigger if clicking checkbox or button
        if (!e.target.matches('input[type="checkbox"]') && !e.target.matches('button')) {
          viewLeadDetails(lead.id);
        }
      };
      row.style.transition = 'background-color 0.2s';
      row.onmouseenter = () => row.style.backgroundColor = 'var(--bg-secondary)';
      row.onmouseleave = () => row.style.backgroundColor = '';
      
      row.innerHTML = `
        <td>${dateStr}</td>
        <td class="editable-cell" data-field-path="contact.name" data-value="${escapeHtml(name)}">${escapeHtml(name)}</td>
        <td>${escapeHtml(contact)}</td>
        <td>${statusBadge}</td>
        <td>${dispositionBadge}</td>
        <td>${sourceBadge}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); viewLeadDetails('${lead.id}')">View</button>
        </td>
      `;
      
      fragment.appendChild(row);
    });

    leadsTableBody.appendChild(fragment);
    
    // Add bulk selection checkboxes if component is available
    if (typeof bulkSelection !== 'undefined') {
      const table = document.getElementById('leadsTable');
      if (table) {
        bulkSelection.addCheckboxColumn(table, (row) => {
          return row.getAttribute('data-lead-id');
        });
      }
    }
    
    // Setup inline editing for editable cells
    if (typeof inlineEditor !== 'undefined') {
      const editableCells = leadsTableBody.querySelectorAll('.editable-cell');
      editableCells.forEach(cell => {
        cell.style.cursor = 'pointer';
        cell.title = 'Click to edit';
        cell.onclick = (e) => {
          e.stopPropagation();
          const fieldPath = cell.getAttribute('data-field-path');
          const currentValue = cell.getAttribute('data-value') || cell.textContent.trim();
          
          // Get lead ID from row
          const row = cell.closest('tr');
          const leadId = row.getAttribute('data-lead-id');
          
          inlineEditor.makeEditable(cell, {
            fieldPath: fieldPath,
            value: currentValue,
            type: 'text',
            recordId: leadId, // Pass recordId for Auto-Save
            onSave: async (fieldPath, newValue, oldValue) => {
              
              if (leadId) {
                // Update in Firebase
                const db = getDatabase();
                const updates = {};
                updates[`sales/${leadId}/${fieldPath}`] = newValue;
                
                try {
                  await db.ref().update(updates);
                  
                  // Log change with enhanced logger
                  if (typeof enhancedLogger !== 'undefined') {
                    // Get current lead data for before/after comparison
                    const leadRef = db.ref(`sales/${leadId}`);
                    const snapshot = await leadRef.once('value');
                    const currentLead = snapshot.val();
                    
                    const before = {};
                    const after = {};
                    const fieldParts = fieldPath.split('.');
                    let beforeObj = currentLead;
                    let afterObj = { ...currentLead };
                    
                    // Set before value
                    for (let i = 0; i < fieldParts.length - 1; i++) {
                      beforeObj = beforeObj?.[fieldParts[i]];
                    }
                    before[fieldPath] = beforeObj?.[fieldParts[fieldParts.length - 1]] || oldValue;
                    
                    // Set after value
                    let target = afterObj;
                    for (let i = 0; i < fieldParts.length - 1; i++) {
                      if (!target[fieldParts[i]]) target[fieldParts[i]] = {};
                      target = target[fieldParts[i]];
                    }
                    target[fieldParts[fieldParts.length - 1]] = newValue;
                    
                    await enhancedLogger.logFieldChanges(
                      'field_changed',
                      leadId,
                      before,
                      after,
                      {
                        recordType: 'lead',
                        source: 'inline_edit',
                        fieldPath: fieldPath
                      }
                    );
                  }
                  
                  // Update cell
                  cell.setAttribute('data-value', newValue);
                  cell.textContent = newValue;
                  
                  // Update in local state
                  const lead = leads.find(l => l.id === leadId);
                  if (lead) {
                    const fieldParts = fieldPath.split('.');
                    let target = lead;
                    for (let i = 0; i < fieldParts.length - 1; i++) {
                      if (!target[fieldParts[i]]) target[fieldParts[i]] = {};
                      target = target[fieldParts[i]];
                    }
                    target[fieldParts[fieldParts.length - 1]] = newValue;
                  }
                  
                  showCRMMessage('Field updated successfully', 'success');
                } catch (error) {
                  console.error('Error updating field:', error);
                  showCRMMessage('Error updating field: ' + error.message, 'error');
                  throw error;
                }
              }
            }
          });
        };
      });
    }
    
    updatePaginationControls('leads');
  });
}

/**
 * Render customer list with pagination
 */
function renderCustomerList() {
  const customersTableBody = document.getElementById('customersTableBody');
  const customersEmpty = document.getElementById('customersEmpty');
  if (!customersTableBody) return;

  requestAnimationFrame(() => {
    customersTableBody.innerHTML = '';

    const totalItems = filteredCustomers.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageCustomers = filteredCustomers.slice(startIndex, endIndex);

    if (pageCustomers.length === 0) {
      if (customersEmpty) customersEmpty.style.display = 'block';
      const customersTable = document.getElementById('customersTable');
      if (customersTable) customersTable.style.display = 'none';
      return;
    }

    if (customersEmpty) customersEmpty.style.display = 'none';

    const fragment = document.createDocumentFragment();
    
    pageCustomers.forEach((customer) => {
      const row = document.createElement('tr');
      
      const date = new Date(customer.timestamp || customer.submittedAt || 0);
      const dateStr = date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      
      const name = customer.contact?.name || 'N/A';
      const contact = `${customer.contact?.phone || ''} ${customer.contact?.email || ''}`.trim() || 'N/A';
      const plan = customer.plan?.type || 'N/A';

      row.innerHTML = `
        <td>${dateStr}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(contact)}</td>
        <td>${escapeHtml(plan)}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewLeadDetails('${customer.id}')">View</button>
        </td>
      `;
      
      fragment.appendChild(row);
    });

    customersTableBody.appendChild(fragment);
    updatePaginationControls('customers');
  });
}

/**
 * Update pagination controls
 */
function updatePaginationControls(type) {
  const pageInfo = document.getElementById(`${type}PageInfo`);
  const countInfo = document.getElementById(`${type}CountInfo`);
  const prevBtn = document.getElementById(`${type}PrevBtn`);
  const nextBtn = document.getElementById(`${type}NextBtn`);

  const items = type === 'leads' ? filteredLeads : filteredCustomers;
  const total = items.length;
  const startIndex = (currentPage - 1) * pageSize;
  const showing = Math.min(pageSize, total - startIndex);
  const start = total > 0 ? startIndex + 1 : 0;
  const end = Math.min(startIndex + showing, total);

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }

  if (countInfo) {
    countInfo.textContent = total > 0 
      ? `Showing ${start}-${end} of ${total} ${type}`
      : `0 ${type}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1 || totalPages === 0;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
  }
}

/**
 * Previous page
 */
function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    if (currentTab === 'leads') {
      // Use TableView if available, otherwise use default rendering
      if (tableView && typeof tableView.render === 'function') {
        tableView.render(filteredLeads);
      } else {
        renderLeadList();
      }
    } else if (currentTab === 'customers') {
      renderCustomerList();
    }
  }
}

/**
 * Next page
 */
function nextPage() {
  if (currentPage < totalPages) {
    currentPage++;
    if (currentTab === 'leads') {
      renderLeadList();
    } else if (currentTab === 'customers') {
      renderCustomerList();
    }
  }
}

/**
 * View lead details in modal
 */
async function viewLeadDetails(leadId) {
  const modal = document.getElementById('leadDetailModal');
  const content = document.getElementById('leadDetailContent');
  if (!modal || !content) return;

  const lead = [...leads, ...customers].find(l => l.id === leadId);
  if (!lead) {
    showCRMMessage('Lead not found', 'error');
    return;
  }

  editingLeadId = leadId;
  isEditMode = false;

  // Update current lead index for cycling
  const leadIndex = filteredLeads.findIndex(l => l.id === leadId);
  if (leadIndex !== -1) {
    currentLeadIndex = leadIndex;
    updateLeadCyclingControls();
  }

  // Render lead details
  content.innerHTML = renderLeadDetailContent(lead);
  
  // Load history viewer if available
  if (historyViewer && typeof historyViewer.loadHistory === 'function') {
    const historyContainer = document.getElementById('leadHistoryContainer');
    if (!historyContainer) {
      // Create history container if it doesn't exist
      const historyDiv = document.createElement('div');
      historyDiv.id = 'leadHistoryContainer';
      historyDiv.style.marginTop = '20px';
      historyDiv.style.paddingTop = '20px';
      historyDiv.style.borderTop = '1px solid var(--border-color)';
      content.appendChild(historyDiv);
    }
    historyViewer.loadHistory(leadId);
  }

  // Load diff viewer if available
  if (diffViewer && typeof diffViewer.render === 'function') {
    diffViewer.setRecordId(leadId);
    diffViewer.render(leadId);
  }
  
  // Update disposition select value
  const dispositionSelect = document.getElementById('dispositionSelect');
  if (dispositionSelect) {
    dispositionSelect.value = lead.disposition || '';
  }
  
  // Update disposition button visibility
  const pasteToFormBtn = document.getElementById('pasteToFormBtn');
  if (pasteToFormBtn) {
    pasteToFormBtn.style.display = lead.disposition === 'interested' ? 'block' : 'none';
  }

  // Reset edit mode buttons
  const editBtn = document.getElementById('editLeadBtn');
  const saveBtn = document.getElementById('saveLeadBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  
  if (editBtn) editBtn.style.display = 'block';
  if (saveBtn) saveBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = 'none';

  modal.style.display = 'block';
}

/**
 * Update lead cycling controls
 */
function updateLeadCyclingControls() {
  const currentLeadInfo = document.getElementById('currentLeadInfo');
  const prevBtn = document.getElementById('prevLeadBtn');
  const nextBtn = document.getElementById('nextLeadBtn');
  const cyclingControls = document.getElementById('leadCyclingControls');

  if (currentLeadInfo) {
    currentLeadInfo.textContent = `Lead ${currentLeadIndex + 1} of ${filteredLeads.length}`;
  }

  if (prevBtn) {
    prevBtn.disabled = filteredLeads.length <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = filteredLeads.length <= 1;
  }

  if (cyclingControls) {
    cyclingControls.style.display = filteredLeads.length > 0 ? 'flex' : 'none';
  }
}

/**
 * Update pagination controls
 */
function updatePaginationControls(type = 'leads') {
  const isLeads = type === 'leads';
  const containerId = isLeads ? 'leadsPagination' : 'customersPagination';
  const container = document.getElementById(containerId);
  
  if (!container) {
    // Create pagination container if it doesn't exist
    const parentContainer = isLeads 
      ? document.getElementById('leadsTableContainer') || document.getElementById('leadsTable')
      : document.getElementById('customersTableContainer') || document.getElementById('customersTable');
    
    if (parentContainer) {
      const paginationDiv = document.createElement('div');
      paginationDiv.id = containerId;
      paginationDiv.className = 'pagination-controls';
      paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin: 20px 0; padding: 10px;';
      parentContainer.appendChild(paginationDiv);
      updatePaginationControls(type); // Recursive call to render
      return;
    }
  }
  
  if (!container) return;
  
  const page = currentPage;
  const total = totalPages;
  const items = isLeads ? filteredLeads : filteredCustomers;
  const totalItems = isLeads ? (leads.length || items.length) : (customers.length || items.length);
  
  const paginationHTML = `
    <div style="display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap;">
      <button 
        class="btn btn-secondary" 
        ${page === 1 ? 'disabled' : ''} 
        onclick="${isLeads ? 'loadLeads' : 'loadCustomers'}(${page - 1})"
        style="min-width: 100px;"
      >
        ← Previous
      </button>
      <span style="padding: 0 15px; color: var(--text-secondary);">
        Page <strong>${page}</strong> of <strong>${total}</strong>
        ${totalItems > 0 ? ` (${totalItems} total ${isLeads ? 'leads' : 'customers'})` : ''}
      </span>
      <button 
        class="btn btn-secondary" 
        ${page >= total ? 'disabled' : ''} 
        onclick="${isLeads ? 'loadLeads' : 'loadCustomers'}(${page + 1})"
        style="min-width: 100px;"
      >
        Next →
      </button>
    </div>
  `;
  
  container.innerHTML = paginationHTML;
}

/**
 * Show jump to lead dialog
 */
function showJumpToLeadDialog() {
  const leadId = prompt(`Enter Lead ID or Index (1-${filteredLeads.length}):`);
  if (!leadId) return;

  // Try as index first
  const index = parseInt(leadId) - 1;
  if (!isNaN(index) && index >= 0 && index < filteredLeads.length) {
    currentLeadIndex = index;
    const lead = filteredLeads[index];
    if (lead) {
      viewLeadDetails(lead.id);
      return;
    }
  }

  // Try as ID
  const lead = filteredLeads.find(l => l.id === leadId);
  if (lead) {
    const leadIndex = filteredLeads.findIndex(l => l.id === leadId);
    if (leadIndex !== -1) {
      currentLeadIndex = leadIndex;
    }
    viewLeadDetails(lead.id);
  } else {
    showCRMMessage('Lead not found', 'error');
  }
}

/**
 * Render lead detail content
 */
function renderLeadDetailContent(lead) {
  const date = new Date(lead.timestamp || 0);
  const dateStr = date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const readonlyClass = isEditMode ? '' : 'readonly';
  const readonlyAttr = isEditMode ? '' : 'readonly';
  
  return `
    <div class="form-section">
      <h3>Contact Information</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="editContactName" value="${escapeHtml(lead.contact?.name || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="editContactEmail" value="${escapeHtml(lead.contact?.email || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="editContactPhone" value="${escapeHtml(lead.contact?.phone || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
        <div class="form-group">
          <label>Postcode</label>
          <input type="text" id="editContactPostcode" value="${escapeHtml(lead.contact?.postcode || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
      </div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" id="editContactAddress" value="${escapeHtml(lead.contact?.address || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
      </div>
    </div>
    <div class="form-section">
      <h3>Appliances</h3>
      ${lead.appliances && lead.appliances.length > 0 ? `
        <div id="appliancesList" style="margin-top: 15px;">
          ${lead.appliances.map((app, index) => `
            <div class="appliance-item" data-appliance-index="${index}" style="padding: 15px; margin-bottom: 10px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${isEditMode ? `
                <div class="form-row">
                  <div class="form-group" style="flex: 1;">
                    <label>Type</label>
                    <input type="text" id="appliance-type-${index}" value="${escapeHtml(app.type || '')}" class="form-control" placeholder="e.g., Washing Machine">
                  </div>
                  <div class="form-group" style="flex: 1;">
                    <label>Make/Brand</label>
                    <input type="text" id="appliance-make-${index}" value="${escapeHtml(app.make || '')}" class="form-control" placeholder="e.g., Bosch">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group" style="flex: 1;">
                    <label>Model</label>
                    <input type="text" id="appliance-model-${index}" value="${escapeHtml(app.model || '')}" class="form-control" placeholder="e.g., Serie 6">
                  </div>
                  <div class="form-group" style="flex: 1;">
                    <label>Age</label>
                    <select id="appliance-age-${index}" class="form-control">
                      <option value="">Select age</option>
                      <option value="<1" ${app.age === '<1' ? 'selected' : ''}>Less than 1 year</option>
                      <option value="1-2" ${app.age === '1-2' ? 'selected' : ''}>1-2 years</option>
                      <option value="3-5" ${app.age === '3-5' ? 'selected' : ''}>3-5 years</option>
                      <option value="6-10" ${app.age === '6-10' ? 'selected' : ''}>6-10 years</option>
                      <option value="10+" ${app.age === '10+' ? 'selected' : ''}>10+ years</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group" style="flex: 1;">
                    <label>Monthly Cost (£)</label>
                    <input type="number" id="appliance-cost-${index}" value="${parseFloat(app.monthlyCost || 5.99).toFixed(2)}" step="0.01" min="0" class="form-control">
                  </div>
                  <div class="form-group" style="flex: 1; display: flex; align-items: flex-end;">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeApplianceFromLead(${index})" style="width: 100%;">Remove</button>
                  </div>
                </div>
              ` : `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <p style="margin: 0 0 8px 0;"><strong>${escapeHtml(app.type || 'Unknown')}</strong></p>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
                      Make: ${escapeHtml(app.make || 'N/A')} | Model: ${escapeHtml(app.model || 'N/A')} | Age: ${escapeHtml(app.age || 'N/A')}
                    </p>
                    ${app.monthlyCost ? `<p style="margin: 4px 0 0 0; color: var(--text-secondary); font-size: 14px;">Cost: £${parseFloat(app.monthlyCost).toFixed(2)}/month</p>` : ''}
                  </div>
                </div>
              `}
            </div>
          `).join('')}
        </div>
        ${isEditMode ? `
          <button type="button" class="btn btn-primary" onclick="addApplianceToLead()" style="margin-top: 10px;">+ Add Appliance</button>
        ` : ''}
      ` : `
        <p style="color: var(--text-secondary);">No appliances</p>
        ${isEditMode ? `
          <button type="button" class="btn btn-primary" onclick="addApplianceToLead()" style="margin-top: 10px;">+ Add Appliance</button>
        ` : ''}
      `}
    </div>
    <div class="form-section">
      <h3>Plan & Payment</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Plan Number</label>
          <input type="text" id="editPlanNumber" value="${escapeHtml(lead.plan?.number || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
        <div class="form-group">
          <label>Plan Type</label>
          <input type="text" id="editPlanType" value="${escapeHtml(lead.plan?.type || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Total Cost</label>
          <input type="number" id="editTotalCost" value="${parseFloat(lead.plan?.totalCost || 0).toFixed(2)}" step="0.01" min="0" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Sort Code</label>
          <input type="text" id="editSortCode" value="${escapeHtml(lead.payment?.sortCode || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
        <div class="form-group">
          <label>Account Number</label>
          <input type="text" id="editAccountNumber" value="${escapeHtml(lead.payment?.accountNumber || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
        </div>
      </div>
      <div class="form-group">
        <label>DD Date</label>
        <input type="text" id="editDdDate" value="${escapeHtml(lead.payment?.ddDate || '')}" ${readonlyAttr} class="${readonlyClass}" style="${isEditMode ? '' : 'background: #f3f4f6; border: 1px solid #e5e7eb;'}">
      </div>
    </div>
    <div class="form-section">
      <h3>Metadata</h3>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Status:</strong> ${getStatusBadge(lead.leadStatus || 'new')}</p>
      <p><strong>Disposition:</strong> ${getDispositionBadge(lead.disposition)}</p>
      <p><strong>Source:</strong> ${getSourceBadge(lead.leadSource)}</p>
      <p><strong>Agent:</strong> ${escapeHtml(lead.agentEmail || 'N/A')}</p>
      ${lead.notes ? `<p><strong>Notes:</strong> ${escapeHtml(lead.notes)}</p>` : ''}
    </div>
  `;
}

/**
 * Show CRM message
 */
function showCRMMessage(message, type = 'info') {
  const messageContainer = document.getElementById('crmMessage');
  const messageContent = document.getElementById('crmMessageContent');
  
  if (messageContainer && messageContent) {
    messageContent.textContent = message;
    messageContent.className = `message ${type}`;
    messageContainer.style.display = 'block';
    
    setTimeout(() => {
      messageContainer.style.display = 'none';
    }, 5000);
  }
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
  const badges = {
    'new': '<span class="badge badge-info">New</span>',
    'contacted': '<span class="badge badge-warning">Contacted</span>',
    'dispositioned': '<span class="badge badge-primary">Dispositioned</span>',
    'converted': '<span class="badge badge-success">Converted</span>'
  };
  return badges[status] || '<span class="badge">Unknown</span>';
}

/**
 * Get disposition badge HTML
 */
function getDispositionBadge(disposition) {
  if (!disposition) return '<span class="badge">Not Set</span>';
  
  const badges = {
    'no_answer': '<span class="badge badge-warning">No Answer</span>',
    'not_interested': '<span class="badge badge-danger">Not Interested</span>',
    'interested': '<span class="badge badge-success">Interested</span>',
    'call_back': '<span class="badge badge-info">Call Back</span>',
    'other': '<span class="badge">Other</span>'
  };
  return badges[disposition] || '<span class="badge">Unknown</span>';
}

/**
 * Get source badge HTML
 */
function getSourceBadge(source) {
  const badges = {
    'upload': '<span class="badge badge-info">Upload</span>',
    'form': '<span class="badge badge-primary">Form</span>',
    'manual': '<span class="badge badge-secondary">Manual</span>'
  };
  return badges[source] || '<span class="badge">Unknown</span>';
}


/**
 * Clear all filters and reset to show all leads
 */
function clearFilters() {
  // Reset filter dropdowns
  const dispositionFilter = document.getElementById('leadsFilterDisposition');
  const statusFilter = document.getElementById('leadsFilterStatus');
  const scoreFilter = document.getElementById('leadsFilterScore');
  const riskFilter = document.getElementById('leadsFilterRisk');
  const searchInput = document.getElementById('leadsSearch');
  
  if (dispositionFilter) dispositionFilter.value = '';
  if (statusFilter) statusFilter.value = '';
  if (scoreFilter) scoreFilter.value = '';
  if (riskFilter) riskFilter.value = '';
  if (searchInput) searchInput.value = '';
  
  // Clear advanced filters if available
  if (typeof filterComponentInstance !== 'undefined' && filterComponentInstance.clearFilters) {
    filterComponentInstance.clearFilters();
  }
  
  // Re-apply filters (which will show all leads now)
  filterLeads();
  
  // Show message
  if (typeof showCRMMessage === 'function') {
    showCRMMessage('Filters cleared', 'success');
  }
}

// Expose clearFilters to global scope for HTML onclick handlers
window.clearFilters = clearFilters;

/**
 * Filter leads by disposition and status
 */
function filterLeads() {
  const dispositionFilter = document.getElementById('leadsFilterDisposition');
  const statusFilter = document.getElementById('leadsFilterStatus');
  
  const dispositionValue = dispositionFilter?.value || '';
  const statusValue = statusFilter?.value || '';

  // Get advanced filters from filter component
  let advancedFilters = {};
  if (typeof filterComponentInstance !== 'undefined') {
    advancedFilters = filterComponentInstance.getAdvancedFilters();
  }

  filteredLeads = leads.filter(lead => {
    // Disposition filter
    if (dispositionValue) {
      const leadDisposition = lead.disposition || 'none';
      if (leadDisposition !== dispositionValue) {
        return false;
      }
    }
    
    // Status filter
    if (statusValue) {
      const leadStatus = lead.leadStatus || (lead.submittedAt ? 'converted' : 'new');
      if (leadStatus !== statusValue) {
        return false;
      }
    }

    // Agent filter (from advanced filters)
    if (advancedFilters.agent && lead.agentEmail !== advancedFilters.agent) {
      return false;
    }

    // Date range filter (sales creation date)
    if (advancedFilters.dateFrom || advancedFilters.dateTo) {
      const leadDate = lead.timestamp ? new Date(lead.timestamp) : (lead.submittedAt ? new Date(lead.submittedAt) : null);
      if (!leadDate) return false;
      
      if (advancedFilters.dateFrom) {
        const fromDate = new Date(advancedFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (leadDate < fromDate) return false;
      }
      
      if (advancedFilters.dateTo) {
        const toDate = new Date(advancedFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (leadDate > toDate) return false;
      }
    }

    // Plan type filter
    if (advancedFilters.planType && lead.plan?.type !== advancedFilters.planType) {
      return false;
    }

    // Appliance count filter
    if (advancedFilters.applianceCount) {
      const applianceCount = lead.appliances?.length || 0;
      const filterCount = advancedFilters.applianceCount;
      
      if (filterCount === '1' && applianceCount !== 1) return false;
      if (filterCount === '2-3' && (applianceCount < 2 || applianceCount > 3)) return false;
      if (filterCount === '4-5' && (applianceCount < 4 || applianceCount > 5)) return false;
      if (filterCount === '6+' && applianceCount < 6) return false;
    }

    // Boiler cover filter
    if (advancedFilters.boilerCover) {
      const hasBoiler = lead.plan?.type?.includes('Boiler') || false;
      if (advancedFilters.boilerCover === 'yes' && !hasBoiler) return false;
      if (advancedFilters.boilerCover === 'no' && hasBoiler) return false;
    }
    
    return true;
  });

  currentPage = 1;
  currentLeadIndex = 0;
  updateLeadCyclingControls();
  
  // Use TableView if available, otherwise use default rendering
  if (tableView && typeof tableView.render === 'function') {
    tableView.render(filteredLeads);
  } else {
    renderLeadList();
  }
}

/**
 * Search customers
 */
function searchCustomers() {
  const searchInput = document.getElementById('customersSearch');
  if (!searchInput) return;

  const query = searchInput.value.toLowerCase().trim();
  
  if (!query) {
    filteredCustomers = [...customers];
  } else {
    filteredCustomers = customers.filter(customer => {
      const name = (customer.contact?.name || '').toLowerCase();
      const email = (customer.contact?.email || '').toLowerCase();
      const phone = (customer.contact?.phone || '').toLowerCase();
      const address = (customer.contact?.address || '').toLowerCase();
      const postcode = (customer.contact?.postcode || '').toLowerCase();
      
      return name.includes(query) || 
             email.includes(query) || 
             phone.includes(query) || 
             address.includes(query) || 
             postcode.includes(query);
    });
  }

  currentPage = 1;
  renderCustomerList();
}

// Sort state
let currentSortColumn = null;
let currentSortDirection = 'desc';

/**
 * Sort leads
 */
function sortLeads(column) {
  // Toggle sort direction if same column
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = column;
    currentSortDirection = 'desc';
  }

  // Sort filtered leads
  filteredLeads.sort((a, b) => {
    let aValue, bValue;

    switch (column) {
      case 'date':
        aValue = a.timestamp || 0;
        bValue = b.timestamp || 0;
        break;
      case 'name':
        aValue = (a.contact?.name || '').toLowerCase();
        bValue = (b.contact?.name || '').toLowerCase();
        break;
      case 'status':
        aValue = a.leadStatus || 'new';
        bValue = b.leadStatus || 'new';
        break;
      case 'disposition':
        aValue = a.disposition || '';
        bValue = b.disposition || '';
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

  // Update sort indicators
  updateSortIndicators(column);
  
  // Re-render using TableView if available
  if (tableView && typeof tableView.render === 'function') {
    tableView.render(filteredLeads);
  } else {
    renderLeadList();
  }
}

/**
 * Update sort indicators in table header
 */
function updateSortIndicators(activeColumn) {
  const headers = document.querySelectorAll('#leadsTableHeader th');
  headers.forEach(header => {
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
      const onclickAttr = header.getAttribute('onclick');
      if (onclickAttr) {
        const match = onclickAttr.match(/sortLeads\('(\w+)'\)/);
        if (match) {
          const column = match[1];
          if (column === activeColumn) {
            indicator.textContent = currentSortDirection === 'asc' ? '↑' : '↓';
            indicator.style.color = 'var(--primary)';
          } else {
            indicator.textContent = '⇅';
            indicator.style.color = 'var(--text-secondary)';
          }
        }
      }
    }
  });
}

/**
 * Edit lead
 */
function editLead() {
  if (!editingLeadId) return;

  isEditMode = true;
  const lead = [...leads, ...customers].find(l => l.id === editingLeadId);
  if (!lead) return;

  // Re-render modal in edit mode
  const content = document.getElementById('leadDetailContent');
  if (content) {
    content.innerHTML = renderLeadDetailContent(lead);
    
    // Phase 4C: Initialize comments panel
    if (typeof CommentsPanel !== 'undefined' && window.commentsService) {
      const commentsContainerId = `commentsContainer-${lead.id}`;
      if (!document.getElementById(commentsContainerId)) {
        // Add comments container to lead detail content
        const commentsContainer = document.createElement('div');
        commentsContainer.id = commentsContainerId;
        commentsContainer.style.marginTop = '20px';
        content.appendChild(commentsContainer);
        
        // Initialize comments panel
        const commentsPanel = new CommentsPanel(commentsContainerId, lead.id);
        commentsPanel.render();
      }
    }
  }

  // Show/hide buttons
  const editBtn = document.getElementById('editLeadBtn');
  const saveBtn = document.getElementById('saveLeadBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  
  if (editBtn) editBtn.style.display = 'none';
  if (saveBtn) saveBtn.style.display = 'block';
  if (cancelBtn) cancelBtn.style.display = 'block';
}

/**
 * Cancel edit
 */
function cancelEdit() {
  isEditMode = false;
  
  if (editingLeadId) {
    viewLeadDetails(editingLeadId);
  }

  const editBtn = document.getElementById('editLeadBtn');
  const saveBtn = document.getElementById('saveLeadBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  
  if (editBtn) editBtn.style.display = 'block';
  if (saveBtn) saveBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Save lead changes
 */
async function saveLead() {
  if (!editingLeadId) {
    showCRMMessage('No lead selected', 'error');
    return;
  }

  // Validate data
  const name = document.getElementById('editContactName')?.value.trim();
  const email = document.getElementById('editContactEmail')?.value.trim();
  const phone = document.getElementById('editContactPhone')?.value.trim();
  const postcode = document.getElementById('editContactPostcode')?.value.trim();
  const address = document.getElementById('editContactAddress')?.value.trim();

  // Phase 4C: Accessibility - Clear previous errors
  document.querySelectorAll('.error-message').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
  document.querySelectorAll('[aria-invalid="true"]').forEach(el => {
    el.setAttribute('aria-invalid', 'false');
  });

  let hasErrors = false;

  if (!name) {
    const nameError = document.getElementById('editContactName-error');
    const nameInput = document.getElementById('editContactName');
    if (nameError) {
      nameError.textContent = 'Name is required';
      nameError.style.display = 'block';
    }
    if (nameInput) {
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
    }
    hasErrors = true;
  }

  if (email && !validateEmail(email)) {
    const emailError = document.getElementById('editContactEmail-error');
    const emailInput = document.getElementById('editContactEmail');
    if (emailError) {
      emailError.textContent = 'Invalid email format';
      emailError.style.display = 'block';
    }
    if (emailInput) {
      emailInput.setAttribute('aria-invalid', 'true');
      if (!hasErrors) emailInput.focus();
    }
    hasErrors = true;
  }

  if (hasErrors) {
    showCRMMessage('Please fix the errors in the form', 'error');
    return;
  }

  // Validate phone format (basic UK format)
  if (phone && phone.length > 0) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      showCRMMessage('Invalid phone number format', 'error');
      return;
    }
  }

  // Validate postcode format (basic UK format)
  if (postcode && postcode.length > 0) {
    const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!postcodeRegex.test(postcode)) {
      // Warning only, not blocking
      console.warn('Postcode format may be invalid:', postcode);
    }
  }

  try {
    const db = getDatabase();
    const leadRef = db.ref(`sales/${editingLeadId}`);
    
    // Get current data
    const snapshot = await leadRef.once('value');
    const currentData = snapshot.val() || {};

    // Collect appliances if in edit mode
    let updatedAppliances = [];
    if (isEditMode) {
      const appliancesList = document.getElementById('appliancesList');
      if (appliancesList) {
        const applianceItems = appliancesList.querySelectorAll('.appliance-item');
        updatedAppliances = Array.from(applianceItems).map((item, index) => {
          const type = document.getElementById(`appliance-type-${index}`)?.value.trim();
          const make = document.getElementById(`appliance-make-${index}`)?.value.trim();
          const model = document.getElementById(`appliance-model-${index}`)?.value.trim();
          const age = document.getElementById(`appliance-age-${index}`)?.value.trim();
          const cost = parseFloat(document.getElementById(`appliance-cost-${index}`)?.value) || 5.99;
          
          // Only include appliances with at least a type
          if (type) {
            return {
              type: type,
              make: make || '',
              model: model || '',
              age: age || '',
              monthlyCost: cost
            };
          }
          return null;
        }).filter(app => app !== null);
      }
    } else {
      // Preserve existing appliances if not in edit mode
      updatedAppliances = currentData.appliances || [];
    }

    // Collect plan, payment, and notes data if in edit mode
    let planData = currentData.plan || {};
    let paymentData = currentData.payment || {};
    let notes = currentData.notes || '';
    
    if (isEditMode) {
      const planNumber = document.getElementById('editPlanNumber')?.value.trim();
      const planType = document.getElementById('editPlanType')?.value.trim();
      const totalCost = parseFloat(document.getElementById('editTotalCost')?.value) || 0;
      const sortCode = document.getElementById('editSortCode')?.value.trim();
      const accountNumber = document.getElementById('editAccountNumber')?.value.trim();
      const ddDate = document.getElementById('editDdDate')?.value.trim();
      notes = document.getElementById('editNotes')?.value.trim() || '';
      
      planData = {
        number: planNumber || '',
        type: planType || '',
        totalCost: totalCost
      };
      
      paymentData = {
        sortCode: sortCode || '',
        accountNumber: accountNumber || '',
        ddDate: ddDate || ''
      };
    }

    // Update contact information, appliances, plan, and payment
    const updates = {
      contact: {
        name: name,
        email: email || '',
        phone: phone || '',
        postcode: postcode || '',
        address: address || ''
      },
      updatedAt: new Date().toISOString()
    };

    // Update appliances
    if (updatedAppliances.length > 0) {
      updates.appliances = updatedAppliances;
    } else {
      // If no appliances, set to empty array
      updates.appliances = [];
    }

    // Update plan, payment, and notes
    updates.plan = planData;
    updates.payment = paymentData;
    updates.notes = notes;

    await leadRef.update(updates);

    // Log activity
    const editedFields = ['contact', 'appliances'];
    if (isEditMode && (planData.number || planData.type || paymentData.sortCode || paymentData.accountNumber)) {
      editedFields.push('plan', 'payment');
    }
    if (isEditMode && notes !== (currentData.notes || '')) {
      editedFields.push('notes');
    }
    await logActivity('lead_edited', editingLeadId, { fields: editedFields });

    showCRMMessage('Lead updated successfully', 'success');
    
    // Phase 4B: Trigger workflow automation
    if (typeof workflowAutomationEngine !== 'undefined' && editingLeadId) {
      const updatedLead = [...leads, ...customers].find(l => l.id === editingLeadId);
      if (updatedLead) {
        // Trigger on field change (disposition)
        if (updatedLead.disposition) {
          await workflowAutomationEngine.processTrigger(updatedLead, 'field_change', {
            field: 'disposition',
            newValue: updatedLead.disposition,
            oldValue: currentData.disposition
          });
        }

        // Trigger score-based workflows if scoring service available
        if (typeof LeadScoringService !== 'undefined') {
          const scoringService = new LeadScoringService();
          const score = scoringService.scoreLead(updatedLead);
          // Score threshold triggers are evaluated in processTrigger
          await workflowAutomationEngine.processTrigger(updatedLead, 'score_threshold', {
            score: score.totalScore
          });
        }
      }
    }
    
    // Exit edit mode
    cancelEdit();
    
    // Reload data
    await loadLeads();
    if (editingLeadId) {
      viewLeadDetails(editingLeadId);
    }
  } catch (error) {
    console.error('Error saving lead:', error);
    showCRMMessage('Error saving lead: ' + error.message, 'error');
  }
}

/**
 * Validate email
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Paste customer data to form
 */
function pasteToForm() {
  if (!editingLeadId) {
    showCRMMessage('No lead selected', 'error');
    return;
  }

  const lead = [...leads, ...customers].find(l => l.id === editingLeadId);
  if (!lead) {
    showCRMMessage('Lead not found', 'error');
    return;
  }

  // Check disposition
  if (lead.disposition !== 'interested') {
    showCRMMessage('Only leads with "Interested" disposition can be pasted to form', 'error');
    return;
  }

  // Prepare data for form prefill
  const prefillData = {
    contact: lead.contact || {},
    appliances: lead.appliances || [],
    plan: lead.plan || {},
    payment: lead.payment || {},
    notes: lead.notes || '',
    leadId: lead.id
  };

  // Store in localStorage
  try {
    localStorage.setItem('crm_prefill_data', JSON.stringify(prefillData));
    
    // Navigate to form
    window.location.href = '/form?prefill=true';
  } catch (error) {
    console.error('Error storing prefill data:', error);
    showCRMMessage('Error preparing form data: ' + error.message, 'error');
  }
}

/**
 * Log activity to security_logs
 */
async function logActivity(action, leadId, details = {}) {
  try {
    const db = getDatabase();
    const logsRef = db.ref('security_logs');
    
    let currentUser = null;
    if (typeof getCurrentUser === 'function') {
      currentUser = getCurrentUser();
    }

    const logEntry = {
      eventType: action,
      severity: 'info',
      timestamp: new Date().toISOString(),
      userId: currentUser?.uid || null,
      userEmail: currentUser?.email || currentUser?.username || null,
      details: {
        leadId: leadId,
        ...details
      }
    };

    await logsRef.push(logEntry);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging should not break functionality
  }
}

/**
 * Add appliance to lead (in edit mode)
 */
function addApplianceToLead() {
  if (!editingLeadId || !isEditMode) {
    showCRMMessage('Please enable edit mode first', 'error');
    return;
  }

  const lead = [...leads, ...customers].find(l => l.id === editingLeadId);
  if (!lead) return;

  // Initialize appliances array if needed
  if (!lead.appliances) {
    lead.appliances = [];
  }

  // Add new appliance
  lead.appliances.push({
    type: '',
    make: '',
    model: '',
    age: '',
    monthlyCost: 5.99
  });

  // Re-render modal
  const content = document.getElementById('leadDetailContent');
  if (content) {
    content.innerHTML = renderLeadDetailContent(lead);
    
    // Phase 4C: Initialize comments panel
    if (typeof CommentsPanel !== 'undefined' && window.commentsService) {
      const commentsContainerId = `commentsContainer-${lead.id}`;
      if (!document.getElementById(commentsContainerId)) {
        // Add comments container to lead detail content
        const commentsContainer = document.createElement('div');
        commentsContainer.id = commentsContainerId;
        commentsContainer.style.marginTop = '20px';
        content.appendChild(commentsContainer);
        
        // Initialize comments panel
        const commentsPanel = new CommentsPanel(commentsContainerId, lead.id);
        commentsPanel.render();
      }
    }
  }
}

/**
 * Remove appliance from lead (in edit mode)
 */
function removeApplianceFromLead(index) {
  if (!editingLeadId || !isEditMode) {
    return;
  }

  const lead = [...leads, ...customers].find(l => l.id === editingLeadId);
  if (!lead || !lead.appliances) return;

  lead.appliances.splice(index, 1);

  // Re-render modal
  const content = document.getElementById('leadDetailContent');
  if (content) {
    content.innerHTML = renderLeadDetailContent(lead);
    
    // Phase 4C: Initialize comments panel
    if (typeof CommentsPanel !== 'undefined' && window.commentsService) {
      const commentsContainerId = `commentsContainer-${lead.id}`;
      if (!document.getElementById(commentsContainerId)) {
        // Add comments container to lead detail content
        const commentsContainer = document.createElement('div');
        commentsContainer.id = commentsContainerId;
        commentsContainer.style.marginTop = '20px';
        content.appendChild(commentsContainer);
        
        // Initialize comments panel
        const commentsPanel = new CommentsPanel(commentsContainerId, lead.id);
        commentsPanel.render();
      }
    }
  }
}

/**
 * Edit appliance (in edit mode)
 * Note: Appliance editing is now inline when edit mode is enabled
 */
function editAppliance(index) {
  // Appliances are now editable inline when edit mode is enabled
  // This function is kept for backward compatibility
  if (!isEditMode) {
    showCRMMessage('Please enable edit mode first', 'error');
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCRM);
} else {
  initializeCRM();
}
