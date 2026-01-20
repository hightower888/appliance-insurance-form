/**
 * Admin Panel Module
 * Handles user management (CRUD), sales data viewing, and form field management
 */

// Global state
let users = [];
let sales = [];
let filteredSales = [];
let formFields = [];
let editingFieldId = null;
let currentSortColumn = null;
let currentSortDirection = 'desc'; // 'asc' or 'desc'

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

// Pagination state
let currentPage = 1;
let pageSize = 50; // Default page size
let totalPages = 1;

// Column visibility state
let columnVisibility = {
  date: true,
  customer: true,
  agent: true,
  plan: true,
  cost: true,
  actions: true
};

// Load column visibility from localStorage
function loadColumnVisibility() {
  try {
    const saved = localStorage.getItem('adminColumnVisibility');
    if (saved) {
      columnVisibility = { ...columnVisibility, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading column visibility:', error);
  }
}

// Save column visibility to localStorage
function saveColumnVisibility() {
  try {
    localStorage.setItem('adminColumnVisibility', JSON.stringify(columnVisibility));
  } catch (error) {
    console.error('Error saving column visibility:', error);
  }
}

/**
 * Hash password using Web Crypto API (matches auth-db.js)
 */
async function hashPasswordAsync(password) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('Web Crypto API not available');
}

/**
 * Initialize admin panel
 */
async function initializeAdmin() {
  // Check admin access
  if (typeof checkRole === 'function') {
    const isAdmin = await checkRole('appliance_form.html');
    if (!isAdmin) {
      return; // Redirected
    }
  }

  // Load column visibility preferences
  loadColumnVisibility();
  
  // Load users and set up event listeners
  await loadUsers();
  setupEventListeners();
  
  // Load sales first (needed for filter initialization)
  await loadSales();
  
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
  
  // Initialize bulk operations
  if (typeof bulkOperations !== 'undefined') {
    bulkOperations.options.onDelete = async (saleId) => {
      // Delete sale from Firebase
      try {
        const db = getDatabase();
        const saleRef = db.ref(`sales/${saleId}`);
        await saleRef.remove();
        
        // Log activity
        if (typeof enhancedLogger !== 'undefined') {
          await enhancedLogger.logFieldChanges('bulk_delete', saleId, null, null, {
            source: 'bulk_operations'
          });
        }
      } catch (error) {
        throw new Error(`Failed to delete sale ${saleId}: ${error.message}`);
      }
    };
  }
  
  // Initialize bulk selection with callbacks
  if (typeof bulkSelection !== 'undefined') {
    bulkSelection.options.onDeleteSelected = async (selectedIds) => {
      if (typeof bulkOperations !== 'undefined') {
        await bulkOperations.deleteSelected(selectedIds);
        // Reload sales after deletion
        await loadSales();
      }
    };
    
    bulkSelection.options.onExportSelected = async (selectedIds) => {
      if (typeof exportService !== 'undefined') {
        const selectedSales = filteredSales.filter(sale => 
          selectedIds.includes(sale.id || Object.keys(sales).find(key => sales[key] === sale))
        );
        await exportService.exportToCSV(selectedSales, {
          selectedIds,
          filename: `sales_export_selected_${new Date().toISOString().split('T')[0]}.csv`
        });
      }
    };
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Create user button
  const createUserBtn = document.getElementById('createUserBtn');
  const createUserForm = document.getElementById('createUserForm');
  const cancelCreateBtn = document.getElementById('cancelCreateBtn');
  const newUserForm = document.getElementById('newUserForm');

  if (createUserBtn) {
    createUserBtn.addEventListener('click', function() {
      createUserForm.style.display = createUserForm.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', function() {
      createUserForm.style.display = 'none';
      newUserForm.reset();
    });
  }

  if (newUserForm) {
    newUserForm.addEventListener('submit', handleCreateUser);
  }

  // Edit user form
  const editUserForm = document.getElementById('editUserForm');
  const editUserModal = document.getElementById('editUserModal');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (editUserForm) {
    editUserForm.addEventListener('submit', handleEditUser);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', function() {
      editUserModal.style.display = 'none';
      editUserForm.reset();
    });
  }

  // Refresh sales button
  const refreshSalesBtn = document.getElementById('refreshSalesBtn');
  if (refreshSalesBtn) {
    refreshSalesBtn.addEventListener('click', loadSales);
  }

  // Sales search
  const salesSearch = document.getElementById('salesSearch');
  if (salesSearch) {
    salesSearch.addEventListener('input', filterSales);
  }

  // Brand management
  const addBrandForm = document.getElementById('addBrandForm');
  if (addBrandForm) {
    addBrandForm.addEventListener('submit', handleAddBrand);
  }

  const brandSearchInput = document.getElementById('brandSearchInput');
  if (brandSearchInput) {
    brandSearchInput.addEventListener('input', filterBrands);
  }
}

/**
 * Load all users from Firebase
 */
async function loadUsers() {
  const usersLoading = document.getElementById('usersLoading');
  const usersTable = document.getElementById('usersTable');
  const usersTableBody = document.getElementById('usersTableBody');

  try {
    usersLoading.style.display = 'block';
    usersTable.style.display = 'none';

    // Note: Firebase Auth doesn't provide a direct way to list all users
    // We need to store user metadata in Realtime Database
    // For now, we'll fetch from the users node in database
    const db = getDatabase();
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    
    users = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        const userData = childSnapshot.val();
        users.push({
          uid: userId,
          username: userData.username || '',
          email: userData.email || '',
          role: userData.role || 'agent',
          createdAt: userData.createdAt || '',
          status: userData.status || 'active'
        });
      });
    }

    // Also try to get users from Firebase Auth (requires Admin SDK, so we'll use database)
    // For production, you'd use Cloud Functions with Admin SDK

    usersLoading.style.display = 'none';
    usersTable.style.display = 'block';
    renderUsersTable();
  } catch (error) {
    console.error('Error loading users:', error);
    usersLoading.innerHTML = '<p style="color: #dc2626;">Error loading users. Please try again.</p>';
    showAdminMessage('Error loading users: ' + error.message, 'error');
  }
}

/**
 * Render users table
 */
function renderUsersTable() {
  const usersTableBody = document.getElementById('usersTableBody');
  if (!usersTableBody) return;

    usersTableBody.innerHTML = '';

    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 60px; color: var(--text-secondary);">👥 No users found. Click "Create New User" to get started.</td></tr>';
      return;
    }

  users.forEach(user => {
    const row = document.createElement('tr');
    // Sanitize user data to prevent XSS
    const sanitizedUsername = sanitizeHTML(user.username || '');
    const sanitizedEmail = sanitizeHTML(user.email || '');
    const sanitizedUid = sanitizeHTML(user.uid || '');
    const displayName = user.username ? `${sanitizedUsername} (${sanitizedEmail})` : sanitizedEmail || sanitizedUid;
    row.innerHTML = `
      <td><strong>${displayName}</strong></td>
      <td><span class="badge ${user.role === 'admin' ? 'badge-admin' : user.role === 'processor' ? 'badge-processor' : 'badge-agent'}">${user.role.toUpperCase()}</span></td>
      <td><span class="badge ${user.status === 'active' ? 'badge-active' : 'badge-inactive'}">${user.status || 'active'}</span></td>
      <td>
        <button class="btn btn-action btn-primary" onclick="openEditUserModal('${sanitizedUid}')">✏️ Edit</button>
        <button class="btn btn-action btn-danger" onclick="deleteUser('${sanitizedUid}')">🗑️ Delete</button>
      </td>
    `;
    usersTableBody.appendChild(row);
  });
}

/**
 * Handle create user form submission
 */
async function handleCreateUser(e) {
  e.preventDefault();

  const username = document.getElementById('newUserUsername').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const password = document.getElementById('newUserPassword').value;
  const role = document.getElementById('newUserRole').value;

  // Clear errors
  document.getElementById('newUserUsername-error').textContent = '';
  document.getElementById('newUserEmail-error').textContent = '';
  document.getElementById('newUserPassword-error').textContent = '';
  document.getElementById('newUserRole-error').textContent = '';

  // Validate
  if (!username) {
    document.getElementById('newUserUsername-error').textContent = 'Username is required';
    return;
  }

  // Validate username format (must be alphanumeric and underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    document.getElementById('newUserUsername-error').textContent = 'Username can only contain letters, numbers, and underscores';
    return;
  }

  if (!password || password.length < 6) {
    document.getElementById('newUserPassword-error').textContent = 'Password must be at least 6 characters';
    return;
  }

  if (!role) {
    document.getElementById('newUserRole-error').textContent = 'Role is required';
    return;
  }

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('newUserEmail-error').textContent = 'Please enter a valid email address';
    return;
  }

  try {
    // Get current admin user info before creating new user
    const currentAdmin = await getCurrentUser();
    if (!currentAdmin) {
      showAdminMessage('You must be logged in as admin to create users.', 'error');
      return;
    }
    
    // Verify admin role (not just any logged-in user)
    if (currentAdmin.role !== 'admin') {
      showAdminMessage('You must be logged in as admin to create users.', 'error');
      return;
    }
    
    // Save admin credentials for re-authentication
    const adminEmail = currentAdmin.email || currentAdmin.username;
    const adminUid = currentAdmin.uid;
    
    // Check if username already exists in database
    const db = getDatabase();
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    let emailExists = false;
    let usernameExists = false;
    let existingUserData = null;
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        // Check if email exists (if provided)
        if (email && userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
          emailExists = true;
        }
        // Check if username exists
        if (userData.username && userData.username.toLowerCase() === username.toLowerCase()) {
          usernameExists = true;
          existingUserData = userData;
        }
        if (emailExists || usernameExists) {
          return true;
        }
      });
    }
    
    if (emailExists) {
      showAdminMessage('This email is already registered.', 'error');
      return;
    }
    
    if (usernameExists) {
      showAdminMessage('This username is already taken. Please choose a different username.', 'error');
      return;
    }
    
    // Generate unique system email if not provided (for Firebase Auth compatibility)
    // Format: username-{timestamp}@appliance-bot.local to ensure uniqueness
    let systemEmail = email;
    if (!systemEmail) {
      // Generate unique email with timestamp to prevent conflicts
      const timestamp = Date.now();
      systemEmail = `${username}-${timestamp}@appliance-bot.local`;
    }
    
    // Use Cloud Function to create user (keeps admin logged in)
    // This avoids the issue where createUserWithEmailAndPassword signs in as the new user
    const apiUrl = 'https://us-central1-appliance-bot.cloudfunctions.net/createUser';
    
    try {
      // Call Cloud Function to create user
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          role: role,
          adminUid: adminUid
        })
      });

      if (response.ok) {
        const result = await response.json();
        const displayName = username;
        const emailNote = email ? '' : ' (system email generated for authentication)';
        showAdminMessage(`User ${displayName} created successfully!${emailNote}`, 'success');
        document.getElementById('createUserForm').style.display = 'none';
        document.getElementById('newUserForm').reset();
        await loadUsers(); // Reload users list - admin stays logged in!
        return; // Success - admin stays logged in!
      } else {
        // Parse error response
        let errorMessage = 'Failed to create user via API';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `API error: ${response.status} ${response.statusText}`;
        }
        
        // Provide specific error messages
        if (response.status === 403) {
          errorMessage = 'Permission denied: You must be logged in as an admin to create users.';
        } else if (response.status === 400) {
          errorMessage = `Invalid request: ${errorMessage}`;
        } else if (response.status === 404) {
          // Cloud Function not deployed
          throw new Error('CLOUD_FUNCTION_NOT_DEPLOYED');
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (apiError) {
      // Check if Cloud Function is not deployed
      if (apiError.message === 'CLOUD_FUNCTION_NOT_DEPLOYED' || apiError.message.includes('404') || apiError.message.includes('Failed to fetch')) {
        // Cloud Function not available - use fallback method (database-only)
        console.warn('Cloud Function not available, using fallback method (database-only):', apiError);
        showAdminMessage('Cloud Function not deployed. Using fallback method - creating user in database directly.', 'info');
        
        // Fallback: Create user directly in database (auth-db.js compatible)
        // Generate unique user ID from username/timestamp
        const timestamp = Date.now();
        const userId = `user_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Hash password using SHA-256 (same as auth-db.js)
        const passwordHash = await hashPasswordAsync(password);
        
        const userData = {
          username: username,
          role: role,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: adminUid, // Must be UID for database rule to work
          name: username,
          passwordHash: passwordHash // Required for auth-db.js login
        };
        
        if (email) {
          userData.email = email;
        } else {
          userData.email = systemEmail;
          userData.systemEmail = true;
        }
        
        const db = getDatabase();
        try {
          await db.ref(`users/${userId}`).set(userData);
          
          if (typeof securityLogger !== 'undefined' && securityLogger.logAccountCreated) {
            await securityLogger.logAccountCreated(userId, systemEmail || email, role, adminUid || adminEmail);
          }
          
          const displayName = username;
          const emailNote = email ? '' : ' (system email generated for authentication)';
          showAdminMessage(`User ${displayName} created successfully!${emailNote}`, 'success');
          document.getElementById('createUserForm').style.display = 'none';
          document.getElementById('newUserForm').reset();
          
          // Reload users list
          await loadUsers();
          return; // Success - exit early
        } catch (dbError) {
          console.error('Database write error:', dbError);
          console.error('Admin UID:', adminUid);
          console.error('User data being written:', userData);
          
          // Provide specific error messages for common database errors
          if (dbError.code === 'PERMISSION_DENIED' || dbError.message.includes('permission')) {
            // Debug: Check if admin user exists in database
            try {
              const adminRef = db.ref(`users/${adminUid}`);
              const adminSnapshot = await adminRef.once('value');
              const adminData = adminSnapshot.val();
              console.error('Admin user check:', { exists: !!adminData, role: adminData?.role, adminUid });
              
              if (!adminData) {
                throw new Error(`Permission denied: Admin user with UID '${adminUid}' not found in database. Please ensure you are logged in as an admin.`);
              } else if (adminData.role !== 'admin') {
                throw new Error(`Permission denied: User '${adminUid}' does not have admin role (current role: '${adminData.role}').`);
              } else {
                throw new Error('Permission denied: Database rules do not allow user creation. The admin user exists but the rule evaluation failed. Please check database rules configuration.');
              }
            } catch (checkError) {
              throw checkError;
            }
          } else if (dbError.code === 'NETWORK_ERROR' || dbError.message.includes('network')) {
            throw new Error('Network error: Could not connect to database. Please check your internet connection and try again.');
          } else {
            throw new Error(`Database error: ${dbError.message || 'Failed to write user to database'}`);
          }
        }
      } else {
        // Cloud Function error that's not a 404 - re-throw to outer catch
        throw apiError;
      }
    } // End of apiError catch block
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Error creating user: ';
    if (error.message.includes('Permission denied')) {
      userMessage += 'You do not have permission to create users. Please ensure you are logged in as an admin.';
    } else if (error.message.includes('Cloud Function')) {
      userMessage += 'The user creation service is not available. Please contact support or try again later.';
    } else if (error.message.includes('Database error')) {
      userMessage += 'Could not save user to database. Please check your connection and try again.';
    } else if (error.message.includes('Network error')) {
      userMessage += 'Network connection failed. Please check your internet connection.';
    } else {
      userMessage += error.message;
    }
    
    showAdminMessage(userMessage, 'error');
  }
}

/**
 * Open edit user modal
 */
function openEditUserModal(userId) {
  const user = users.find(u => u.uid === userId);
  if (!user) return;

  const editUserModal = document.getElementById('editUserModal');
  const editUserId = document.getElementById('editUserId');
  const editUserUsername = document.getElementById('editUserUsername');
  const editUserEmail = document.getElementById('editUserEmail');
  const editUserRole = document.getElementById('editUserRole');

  editUserId.value = userId;
  editUserUsername.value = user.username || '';
  editUserEmail.value = user.email;
  editUserRole.value = user.role;
  editUserModal.style.display = 'flex';
}

/**
 * Handle edit user form submission
 */
async function handleEditUser(e) {
  e.preventDefault();

  const userId = document.getElementById('editUserId').value;
  const username = document.getElementById('editUserUsername').value.trim();
  const email = document.getElementById('editUserEmail').value.trim();
  const role = document.getElementById('editUserRole').value;

  // Clear errors
  document.getElementById('editUserUsername-error').textContent = '';
  document.getElementById('editUserEmail-error').textContent = '';
  document.getElementById('editUserRole-error').textContent = '';

  // Validate
  if (!email) {
    document.getElementById('editUserEmail-error').textContent = 'Email is required';
    return;
  }

  // Validate username if provided (must be alphanumeric and underscore only)
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    document.getElementById('editUserUsername-error').textContent = 'Username can only contain letters, numbers, and underscores';
    return;
  }

  try {
    // Check if username is already taken by another user
    if (username) {
      const db = getDatabase();
      const usersRef = db.ref('users');
      const snapshot = await usersRef.once('value');
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const userData = childSnapshot.val();
          if (childSnapshot.key !== userId && userData.username && userData.username.toLowerCase() === username.toLowerCase()) {
            document.getElementById('editUserUsername-error').textContent = 'This username is already taken';
            throw new Error('Username already taken');
          }
        });
      }
    }

    // Get current user data to check for role changes
    const currentUser = users.find(u => u.uid === userId);
    const oldRole = currentUser?.role;
    
    // Update user in database
    const updateData = {
      email: email,
      role: role,
      updatedAt: new Date().toISOString()
    };
    
    // Add username if provided, or remove it if empty
    if (username) {
      updateData.username = username;
    } else {
      // Remove username if empty (set to null to delete)
      updateData.username = null;
    }
    
    const db = getDatabase();
    await db.ref(`users/${userId}`).update(updateData);
    
    // Log role change if role was changed
    if (oldRole && oldRole !== role && typeof securityLogger !== 'undefined' && securityLogger.logRoleChanged) {
      const currentAdmin = await getCurrentUser();
      await securityLogger.logRoleChanged(userId, email, oldRole, role, currentAdmin?.uid || currentAdmin?.email);
    }

    showAdminMessage('User updated successfully', 'success');
    document.getElementById('editUserModal').style.display = 'none';
    await loadUsers();
  } catch (error) {
    if (error.message !== 'Username already taken') {
      console.error('Error updating user:', error);
      showAdminMessage('Error updating user: ' + error.message, 'error');
    }
  }
}

/**
 * Delete user
 * Offers both hard delete (remove from database) and soft delete (deactivate)
 */
async function deleteUser(userId) {
  const user = users.find(u => u.uid === userId);
  if (!user) {
    showAdminMessage('User not found', 'error');
    return;
  }

  // Check if deleting last admin
  if (user.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin' && u.status === 'active').length;
    if (adminCount <= 1) {
      showAdminMessage('Cannot delete the last admin user', 'error');
      return;
    }
  }

  // Ask user for delete type
  const deleteType = confirm(
    'Delete User:\n\n' +
    'Click OK for HARD DELETE (permanently remove from database)\n' +
    'Click Cancel for SOFT DELETE (deactivate user)\n\n' +
    'Note: Hard delete removes user from database but not from Firebase Auth.\n' +
    'To fully delete from Firebase Auth, use Admin SDK or backend function.'
  );

  try {
    const userEmail = user?.email;
    const currentAdmin = await getCurrentUser();
    
    if (deleteType) {
      // HARD DELETE: Remove from database
      const db = getDatabase();
      await db.ref(`users/${userId}`).remove();
      
      // Log account deletion
      if (typeof securityLogger !== 'undefined' && securityLogger.logAccountDeleted) {
        await securityLogger.logAccountDeleted(userId, userEmail, currentAdmin?.uid || currentAdmin?.email);
      }
      
      showAdminMessage('User permanently deleted from database', 'success');
    } else {
      // SOFT DELETE: Deactivate user
      const db = getDatabase();
      await db.ref(`users/${userId}`).update({
        status: 'inactive',
        deletedAt: new Date().toISOString()
      });
      
      // Log account deletion
      if (typeof securityLogger !== 'undefined' && securityLogger.logAccountDeleted) {
        await securityLogger.logAccountDeleted(userId, userEmail, currentAdmin?.uid || currentAdmin?.email);
      }
      
      showAdminMessage('User deactivated successfully', 'success');
    }
    
    await loadUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    showAdminMessage('Error deleting user: ' + error.message, 'error');
  }
}

/**
 * Load sales data (optimized for large datasets)
 */
async function loadSales() {
  const salesLoading = document.getElementById('salesLoading');
  const salesTable = document.getElementById('salesTable');
  const salesTableBody = document.getElementById('salesTableBody');

  try {
    salesLoading.style.display = 'block';
    salesTable.style.display = 'none';

    // checkRole() already ran in initializeAdmin(), so auth should be ready
    // Check if Firebase Auth user exists, try to sign in anonymously if needed
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
        console.log('Anonymous auth signed in, accessing sales data');
      } catch (error) {
        console.warn('Could not sign in anonymously, attempting database access anyway:', error);
        // Continue anyway - may work if auth already exists
      }
    }
    
    if (!authUser) {
      // Fallback: Check if Firebase Auth user exists
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const auth = firebase.auth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          // Try to sign in anonymously as fallback
          try {
            await auth.signInAnonymously();
            console.log('Anonymous auth signed in as fallback');
          } catch (error) {
            console.warn('Could not sign in anonymously:', error);
          }
        }
      }
    }

    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    sales = [];
    if (snapshot.exists()) {
      // Use forEach for better performance with large datasets
      snapshot.forEach((childSnapshot) => {
        const saleId = childSnapshot.key;
        const saleData = childSnapshot.val();
        sales.push({
          id: saleId,
          ...saleData
        });
      });
    }

    // Sort by timestamp (newest first) - optimized sort
    sales.sort((a, b) => {
      const aTime = a.timestamp || 0;
      const bTime = b.timestamp || 0;
      return bTime - aTime;
    });
    
    // Populate agent filter dropdown (deferred to avoid blocking)
    requestAnimationFrame(() => {
      populateAgentFilter();
    });

    salesLoading.style.display = 'none';
    salesTable.style.display = 'block';
    filteredSales = [...sales]; // Use spread for shallow copy (faster than deep clone)
    renderSalesTable();
  } catch (error) {
    console.error('Error loading sales:', error);
    salesLoading.innerHTML = '<p style="color: #dc2626;">Error loading sales. Please try again.</p>';
    showAdminMessage('Error loading sales: ' + error.message, 'error');
  }
}

// Debounce timer for search/filter operations
let filterDebounceTimer = null;

/**
 * Render sales table with pagination (optimized for large datasets)
 */
function renderSalesTable() {
  const salesTableBody = document.getElementById('salesTableBody');
  if (!salesTableBody) return;

  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    salesTableBody.innerHTML = '';

    // Calculate pagination
    const totalItems = filteredSales.length;
    totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    
    // Ensure currentPage is within valid range
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }

    // Get items for current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSales = filteredSales.slice(startIndex, endIndex);

    // Update count display
    const salesCount = document.getElementById('salesCount');
    const salesTotal = document.getElementById('salesTotal');
    if (salesCount) {
      const showingStart = totalItems > 0 ? startIndex + 1 : 0;
      const showingEnd = Math.min(endIndex, totalItems);
      salesCount.textContent = `${showingStart}-${showingEnd}`;
    }
    if (salesTotal) salesTotal.textContent = totalItems;

    if (paginatedSales.length === 0) {
      salesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 60px; color: var(--text-secondary);">📊 No sales data found. Submit a form to see sales here.</td></tr>';
      updatePaginationControls();
      return;
    }

    // Use DocumentFragment for batch DOM updates (performance optimization)
    const fragment = document.createDocumentFragment();

    paginatedSales.forEach(sale => {
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
      fragment.appendChild(row);
    });

    // Append all rows at once (single DOM operation)
    salesTableBody.appendChild(fragment);

  // Update pagination controls
  updatePaginationControls();
  
  // Apply column visibility
  applyColumnVisibility();
  });
}

/**
 * Apply column visibility to table
 */
function applyColumnVisibility() {
  const table = document.getElementById('salesDataTable');
  if (!table) return;
  
  const headers = table.querySelectorAll('thead th');
  const rows = table.querySelectorAll('tbody tr');
  
  // Column order: date, customer, agent, plan, cost, actions
  const columnKeys = ['date', 'customer', 'agent', 'plan', 'cost', 'actions'];
  
  headers.forEach((header, index) => {
    if (index < columnKeys.length) {
      const columnKey = columnKeys[index];
      const isVisible = columnVisibility[columnKey] !== false;
      header.style.display = isVisible ? '' : 'none';
      
      // Hide corresponding cells in all rows
      rows.forEach(row => {
        const cell = row.cells[index];
        if (cell) {
          cell.style.display = isVisible ? '' : 'none';
        }
      });
    }
  });
}

/**
 * Toggle column visibility menu
 */
function toggleColumnVisibilityMenu() {
  const menu = document.getElementById('columnVisibilityMenu');
  if (!menu) return;
  
  if (menu.style.display === 'none' || !menu.style.display) {
    menu.style.display = 'flex';
    populateColumnVisibilityMenu();
  } else {
    menu.style.display = 'none';
  }
}

/**
 * Close column visibility menu
 */
function closeColumnVisibilityMenu() {
  const menu = document.getElementById('columnVisibilityMenu');
  if (menu) {
    menu.style.display = 'none';
  }
}

/**
 * Populate column visibility menu
 */
function populateColumnVisibilityMenu() {
  const list = document.getElementById('columnVisibilityList');
  if (!list) return;
  
  list.innerHTML = '';
  
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'customer', label: 'Customer' },
    { key: 'agent', label: 'Agent' },
    { key: 'plan', label: 'Plan' },
    { key: 'cost', label: 'Total Cost' },
    { key: 'actions', label: 'Actions' }
  ];
  
  columns.forEach(column => {
    const item = document.createElement('label');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '10px';
    item.style.cursor = 'pointer';
    item.style.padding = '8px';
    item.style.borderRadius = '4px';
    item.style.transition = 'background 0.2s';
    
    item.onmouseover = () => item.style.background = 'var(--bg-tertiary)';
    item.onmouseout = () => item.style.background = '';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = columnVisibility[column.key] !== false;
    checkbox.onchange = () => {
      columnVisibility[column.key] = checkbox.checked;
      saveColumnVisibility();
      applyColumnVisibility();
    };
    
    const label = document.createElement('span');
    label.textContent = column.label;
    label.style.userSelect = 'none';
    
    item.appendChild(checkbox);
    item.appendChild(label);
    list.appendChild(item);
  });
}

/**
 * Reset column visibility to default (all visible)
 */
function resetColumnVisibility() {
  columnVisibility = {
    date: true,
    customer: true,
    agent: true,
    plan: true,
    cost: true,
    actions: true
  };
  saveColumnVisibility();
  populateColumnVisibilityMenu();
  applyColumnVisibility();
}

/**
 * Update pagination controls
 */
function updatePaginationControls() {
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationControls = document.getElementById('paginationControls');
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  
  if (paginationInfo) {
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if (paginationControls) {
    // Enable/disable buttons
    const firstBtn = document.getElementById('paginationFirst');
    const prevBtn = document.getElementById('paginationPrev');
    const nextBtn = document.getElementById('paginationNext');
    const lastBtn = document.getElementById('paginationLast');

    if (firstBtn) {
      firstBtn.disabled = currentPage === 1;
      firstBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    }
    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
      prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
    }
    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';
    }
    if (lastBtn) {
      lastBtn.disabled = currentPage === totalPages;
      lastBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';
    }

    // Update page number buttons
    const pageNumbers = document.getElementById('paginationPageNumbers');
    if (pageNumbers) {
      pageNumbers.innerHTML = '';
      
      // Show up to 5 page numbers around current page
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      // Adjust if we're near the start or end
      if (endPage - startPage < 4) {
        if (startPage === 1) {
          endPage = Math.min(5, totalPages);
        } else if (endPage === totalPages) {
          startPage = Math.max(1, totalPages - 4);
        }
      }

      // Add first page if not in range
      if (startPage > 1) {
        const btn = document.createElement('button');
        btn.className = 'pagination-page-btn';
        btn.textContent = '1';
        btn.onclick = () => goToPage(1);
        pageNumbers.appendChild(btn);
        if (startPage > 2) {
          const ellipsis = document.createElement('span');
          ellipsis.textContent = '...';
          ellipsis.style.padding = '0 5px';
          pageNumbers.appendChild(ellipsis);
        }
      }

      // Add page number buttons
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'pagination-page-btn';
        btn.textContent = i.toString();
        if (i === currentPage) {
          btn.classList.add('active');
        }
        btn.onclick = () => goToPage(i);
        pageNumbers.appendChild(btn);
      }

      // Add last page if not in range
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const ellipsis = document.createElement('span');
          ellipsis.textContent = '...';
          ellipsis.style.padding = '0 5px';
          pageNumbers.appendChild(ellipsis);
        }
        const btn = document.createElement('button');
        btn.className = 'pagination-page-btn';
        btn.textContent = totalPages.toString();
        btn.onclick = () => goToPage(totalPages);
        pageNumbers.appendChild(btn);
      }
    }
  }

  if (pageSizeSelect) {
    pageSizeSelect.value = pageSize.toString();
  }
}

/**
 * Go to specific page
 */
function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderSalesTable();
  // Scroll to top of table
  const salesTable = document.getElementById('salesTable');
  if (salesTable) {
    salesTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Change page size
 */
function changePageSize(newSize) {
  pageSize = parseInt(newSize);
  currentPage = 1; // Reset to first page
  renderSalesTable();
}

/**
 * Filter sales (also resets pagination) - Optimized with debouncing
 */
function filterSales() {
  // Clear existing debounce timer
  if (filterDebounceTimer) {
    clearTimeout(filterDebounceTimer);
  }

  // Debounce filter operation for better performance with large datasets
  filterDebounceTimer = setTimeout(() => {
    const searchTerm = document.getElementById('salesSearch')?.value.toLowerCase() || '';
    const agentFilter = document.getElementById('salesFilterAgent')?.value || '';
    const planFilter = document.getElementById('salesFilterPlan')?.value || '';

    // Use more efficient filtering for large datasets
    filteredSales = sales.filter(sale => {
      // Global search across all fields
      let matchesSearch = true;
      if (searchTerm) {
        // Optimize: only stringify if we need to search
        const searchableText = JSON.stringify(sale).toLowerCase();
        matchesSearch = searchableText.includes(searchTerm);
      }

      // Agent filter
      const matchesAgent = !agentFilter || sale.agentEmail === agentFilter;

      // Plan filter
      const matchesPlan = !planFilter || sale.plan?.type === planFilter;

      return matchesSearch && matchesAgent && matchesPlan;
    });

    // Reset to first page when filtering
    currentPage = 1;
    renderSalesTable();
  }, 300); // 300ms debounce delay
}

/**
 * Load form fields from database
 */
async function loadFormFields() {
  const fieldsLoading = document.getElementById('fieldsLoading');
  const fieldsTable = document.getElementById('fieldsTable');
  const fieldsTableBody = document.getElementById('fieldsTableBody');

  try {
    fieldsLoading.style.display = 'block';
    fieldsTable.style.display = 'none';

    // Load fields using field-config service
    if (typeof fieldConfig !== 'undefined' && fieldConfig.getAllFields) {
      formFields = await fieldConfig.getAllFields();
    } else {
      // Fallback: direct database access
      const db = getDatabase();
      const fieldsRef = db.ref('form_fields');
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
      formFields.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    fieldsLoading.style.display = 'none';
    fieldsTable.style.display = 'block';
    renderFieldsTable();
  } catch (error) {
    console.error('Error loading form fields:', error);
    fieldsLoading.innerHTML = '<p style="color: #dc2626;">Error loading form fields. Please try again.</p>';
    showAdminMessage('Error loading form fields: ' + error.message, 'error');
  }
}

/**
 * Render form fields table
 */
function renderFieldsTable() {
  const fieldsTableBody = document.getElementById('fieldsTableBody');
  if (!fieldsTableBody) return;

  fieldsTableBody.innerHTML = '';

  if (formFields.length === 0) {
    fieldsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 60px; color: var(--text-secondary);">📝 No form fields found. Click "Add New Field" to get started.</td></tr>';
    return;
  }

  formFields.forEach(field => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${field.order || 999}</strong></td>
      <td><code style="background: var(--gray-100); padding: 4px 8px; border-radius: 4px;">${field.fieldName}</code></td>
      <td><strong>${field.fieldLabel}</strong></td>
      <td><span class="badge badge-agent">${field.fieldType}</span></td>
      <td>${field.section || 'General'}</td>
      <td>
        <label class="toggle-switch">
          <input type="checkbox" ${field.required ? 'checked' : ''} onchange="toggleFieldRequired('${field.fieldId}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
        <span style="margin-left: 8px;">${field.required ? '<span class="badge badge-active">Required</span>' : '<span class="badge badge-inactive">Optional</span>'}</span>
      </td>
      <td>
        <button class="btn btn-action btn-secondary" onclick="moveFieldUp('${field.fieldId}')" title="Move Up">⬆️</button>
        <button class="btn btn-action btn-secondary" onclick="moveFieldDown('${field.fieldId}')" title="Move Down">⬇️</button>
        <button class="btn btn-action btn-primary" onclick="editField('${field.fieldId}')">✏️ Edit</button>
        <button class="btn btn-action btn-danger" onclick="deleteFormField('${field.fieldId}')">🗑️ Delete</button>
      </td>
    `;
    fieldsTableBody.appendChild(row);
  });
}

/**
 * Update field form visibility based on field type
 */
function updateFieldFormVisibility() {
  const fieldType = document.getElementById('fieldType')?.value;
  const validationOptions = document.getElementById('validationOptions');
  const fieldOptions = document.getElementById('fieldOptions');

  if (validationOptions) {
    validationOptions.style.display = (fieldType === 'text' || fieldType === 'email' || fieldType === 'tel' || fieldType === 'number') ? 'block' : 'none';
  }

  if (fieldOptions) {
    fieldOptions.style.display = (fieldType === 'select' || fieldType === 'radio') ? 'block' : 'none';
  }
}

/**
 * Add option for select/radio fields
 */
function addFieldOption() {
  const optionsList = document.getElementById('optionsList');
  if (!optionsList) return;

  const optionDiv = document.createElement('div');
  optionDiv.className = 'form-row';
  optionDiv.style.marginBottom = '10px';
  optionDiv.innerHTML = `
    <div class="form-group" style="flex: 1;">
      <input type="text" class="option-value" placeholder="Value (e.g., option1)" style="width: 100%;">
    </div>
    <div class="form-group" style="flex: 2;">
      <input type="text" class="option-label" placeholder="Label (e.g., Option 1)" style="width: 100%;">
    </div>
    <div class="form-group">
      <button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">🗑️</button>
    </div>
  `;
  optionsList.appendChild(optionDiv);
}

/**
 * Handle field form submission
 */
async function handleFieldFormSubmit(e) {
  e.preventDefault();

  const fieldName = document.getElementById('fieldName').value.trim();
  const fieldLabel = document.getElementById('fieldLabel').value.trim();
  const fieldType = document.getElementById('fieldType').value;
  const fieldSection = document.getElementById('fieldSection').value.trim() || 'General';
  const fieldOrder = parseInt(document.getElementById('fieldOrder').value) || 999;
  const fieldRequired = document.getElementById('fieldRequired').checked;
  const fieldDefaultValue = document.getElementById('fieldDefaultValue').value.trim();
  const fieldHelpText = document.getElementById('fieldHelpText').value.trim();

  // Validation
  if (!fieldName || !fieldLabel || !fieldType) {
    showAdminMessage('Please fill in all required fields', 'error');
    return;
  }

  // Collect validation rules
  const validation = {};
  const minLength = document.getElementById('validationMinLength').value;
  const maxLength = document.getElementById('validationMaxLength').value;
  const pattern = document.getElementById('validationPattern').value.trim();

  if (minLength) validation.minLength = parseInt(minLength);
  if (maxLength) validation.maxLength = parseInt(maxLength);
  if (pattern) validation.pattern = pattern;

  // Collect options for select/radio
  if (fieldType === 'select' || fieldType === 'radio') {
    const options = [];
    const optionInputs = document.querySelectorAll('#optionsList .option-value');
    optionInputs.forEach((input, index) => {
      const value = input.value.trim();
      const labelInput = input.parentElement.nextElementSibling.querySelector('.option-label');
      const label = labelInput.value.trim() || value;
      if (value) {
        options.push({ value, label });
      }
    });
    if (options.length > 0) {
      validation.options = options;
    }
  }

  try {
    const fieldData = {
      fieldId: fieldName,
      fieldName: fieldName,
      fieldLabel: fieldLabel,
      fieldType: fieldType,
      required: fieldRequired,
      order: fieldOrder,
      section: fieldSection,
      validation: validation,
      defaultValue: fieldDefaultValue,
      helpText: fieldHelpText
    };

    if (editingFieldId) {
      // Update existing field
      if (typeof fieldConfig !== 'undefined' && fieldConfig.updateField) {
        await fieldConfig.updateField(editingFieldId, fieldData);
      } else {
        // Fallback: direct database update
        const db = getDatabase();
        await db.ref(`form_fields/${editingFieldId}`).update(fieldData);
      }
      showAdminMessage('Field updated successfully', 'success');
    } else {
      // Create new field
      if (typeof fieldConfig !== 'undefined' && fieldConfig.createField) {
        await fieldConfig.createField(fieldData);
      } else {
        // Fallback: direct database write
        const db = getDatabase();
        await db.ref(`form_fields/${fieldName}`).set(fieldData);
      }
      showAdminMessage('Field created successfully', 'success');
    }

    // Reset form and reload
    document.getElementById('fieldForm').style.display = 'none';
    newFieldForm.reset();
    editingFieldId = null;
    await loadFormFields();
  } catch (error) {
    console.error('Error saving field:', error);
    showAdminMessage('Error saving field: ' + error.message, 'error');
  }
}

/**
 * Edit field
 */
async function editField(fieldId) {
  try {
    let field;
    if (typeof fieldConfig !== 'undefined' && fieldConfig.getField) {
      field = await fieldConfig.getField(fieldId);
    } else {
      // Fallback: direct database access
      const db = getDatabase();
      const snapshot = await db.ref(`form_fields/${fieldId}`).once('value');
      if (!snapshot.exists()) {
        showAdminMessage('Field not found', 'error');
        return;
      }
      field = { fieldId, ...snapshot.val() };
    }

    if (!field) {
      showAdminMessage('Field not found', 'error');
      return;
    }

    editingFieldId = fieldId;
    document.getElementById('fieldFormTitle').textContent = 'Edit Field';
    document.getElementById('fieldName').value = field.fieldName;
    document.getElementById('fieldName').disabled = true; // Can't change field name
    document.getElementById('fieldLabel').value = field.fieldLabel;
    document.getElementById('fieldType').value = field.fieldType;
    document.getElementById('fieldSection').value = field.section || 'General';
    document.getElementById('fieldOrder').value = field.order || 999;
    document.getElementById('fieldRequired').checked = field.required || false;
    document.getElementById('fieldDefaultValue').value = field.defaultValue || '';
    document.getElementById('fieldHelpText').value = field.helpText || '';

    // Set validation options
    if (field.validation) {
      if (field.validation.minLength) document.getElementById('validationMinLength').value = field.validation.minLength;
      if (field.validation.maxLength) document.getElementById('validationMaxLength').value = field.validation.maxLength;
      if (field.validation.pattern) document.getElementById('validationPattern').value = field.validation.pattern;
    }

    // Set options for select/radio
    if ((field.fieldType === 'select' || field.fieldType === 'radio') && field.validation?.options) {
      const optionsList = document.getElementById('optionsList');
      optionsList.innerHTML = '';
      field.validation.options.forEach(option => {
        addFieldOption();
        const optionDivs = optionsList.querySelectorAll('.option-value');
        const labelDivs = optionsList.querySelectorAll('.option-label');
        if (optionDivs.length > 0) {
          optionDivs[optionDivs.length - 1].value = option.value;
          labelDivs[labelDivs.length - 1].value = option.label;
        }
      });
    }

    updateFieldFormVisibility();
    document.getElementById('fieldForm').style.display = 'block';
  } catch (error) {
    console.error('Error loading field for edit:', error);
    showAdminMessage('Error loading field: ' + error.message, 'error');
  }
}

/**
 * Delete form field
 */
async function deleteFormField(fieldId) {
  if (!confirm('Are you sure you want to delete this field? Existing submissions will be preserved, but the field will no longer appear in new forms.')) {
    return;
  }

  try {
    if (typeof fieldConfig !== 'undefined' && fieldConfig.deleteField) {
      await fieldConfig.deleteField(fieldId);
    } else {
      // Fallback: direct database delete
      const db = getDatabase();
      await db.ref(`form_fields/${fieldId}`).remove();
    }
    showAdminMessage('Field deleted successfully', 'success');
    await loadFormFields();
  } catch (error) {
    console.error('Error deleting field:', error);
    showAdminMessage('Error deleting field: ' + error.message, 'error');
  }
}

/**
 * Toggle field required status
 */
async function toggleFieldRequired(fieldId, isRequired) {
  try {
    const field = formFields.find(f => f.fieldId === fieldId);
    if (!field) {
      showAdminMessage('Field not found', 'error');
      return;
    }

    const updatedData = { required: isRequired };
    
    if (typeof fieldConfig !== 'undefined' && fieldConfig.updateField) {
      await fieldConfig.updateField(fieldId, updatedData);
    } else {
      // Fallback: direct database update
      const db = getDatabase();
      await db.ref(`form_fields/${fieldId}`).update(updatedData);
    }
    
    showAdminMessage(`Field marked as ${isRequired ? 'required' : 'optional'}`, 'success');
    await loadFormFields();
  } catch (error) {
    console.error('Error toggling field required status:', error);
    showAdminMessage('Error updating field: ' + error.message, 'error');
  }
}

/**
 * Move field up in order
 */
async function moveFieldUp(fieldId) {
  try {
    const field = formFields.find(f => f.fieldId === fieldId);
    if (!field) return;

    const currentOrder = field.order || 999;
    const previousField = formFields
      .filter(f => (f.order || 999) < currentOrder)
      .sort((a, b) => (b.order || 999) - (a.order || 999))[0];

    if (previousField) {
      const previousOrder = previousField.order || 999;
      // Swap orders
      const db = getDatabase();
      await db.ref(`form_fields/${fieldId}`).update({ order: previousOrder });
      await db.ref(`form_fields/${previousField.fieldId}`).update({ order: currentOrder });
      showAdminMessage('Field order updated', 'success');
      await loadFormFields();
    }
  } catch (error) {
    console.error('Error moving field up:', error);
    showAdminMessage('Error updating field order: ' + error.message, 'error');
  }
}

/**
 * Move field down in order
 */
async function moveFieldDown(fieldId) {
  try {
    const field = formFields.find(f => f.fieldId === fieldId);
    if (!field) return;

    const currentOrder = field.order || 999;
    const nextField = formFields
      .filter(f => (f.order || 999) > currentOrder)
      .sort((a, b) => (a.order || 999) - (b.order || 999))[0];

    if (nextField) {
      const nextOrder = nextField.order || 999;
      // Swap orders
      const db = getDatabase();
      await db.ref(`form_fields/${fieldId}`).update({ order: nextOrder });
      await db.ref(`form_fields/${nextField.fieldId}`).update({ order: currentOrder });
      showAdminMessage('Field order updated', 'success');
      await loadFormFields();
    }
  } catch (error) {
    console.error('Error moving field down:', error);
    showAdminMessage('Error updating field order: ' + error.message, 'error');
  }
}

/**
 * Filter sales by search term and filters
 * (Function is defined earlier in the file)
 */

/**
 * Populate agent filter dropdown
 */
function populateAgentFilter() {
  const agentFilter = document.getElementById('salesFilterAgent');
  if (!agentFilter) return;

  const agents = [...new Set(sales.map(sale => sale.agentEmail).filter(Boolean))].sort();
  
  // Clear existing options except "All Agents"
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
    // Toggle direction if clicking same column
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

  // Build details HTML
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

  // Metadata Section
  detailsHTML += '<div class="details-section">';
  detailsHTML += '<h4 style="margin: 0 0 16px 0; color: var(--primary); font-size: 18px;">ℹ️ Metadata</h4>';
  detailsHTML += '<div style="display: grid; gap: 12px;">';
  detailsHTML += `<div><strong>Agent:</strong> ${sale.agentEmail || 'N/A'}</div>`;
  detailsHTML += `<div><strong>Submitted:</strong> ${sale.submittedAt ? new Date(sale.submittedAt).toLocaleString('en-GB') : 'N/A'}</div>`;
  detailsHTML += `<div><strong>Sale ID:</strong> <code style="background: var(--gray-100); padding: 4px 8px; border-radius: 4px;">${sale.id}</code></div>`;
  detailsHTML += '</div></div>';

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
 * Export sales to CSV (Enhanced with 160+ fields)
 */
async function exportSalesToCSV() {
  if (filteredSales.length === 0) {
    showAdminMessage('No sales data to export', 'error');
    return;
  }

  // Show export options modal with deduplication option
  const deduplicate = await showExportOptionsModal();
  if (deduplicate === null) return; // User cancelled

  // Use enhanced export service if available
  if (typeof exportService !== 'undefined') {
    try {
      // Get selected items if bulk selection is active
      const selectedIds = typeof bulkSelection !== 'undefined' ? bulkSelection.getSelected() : null;
      
      // Get duplicate detection service if deduplication is enabled
      const duplicateService = deduplicate && typeof duplicateDetectionService !== 'undefined' 
        ? duplicateDetectionService 
        : null;
      
      if (duplicateService && typeof database !== 'undefined') {
        duplicateService.initialize(database);
      }
      
      const result = await exportService.exportToCSV(filteredSales, {
        selectedIds: selectedIds && selectedIds.length > 0 ? selectedIds : null,
        filterFn: null, // Already filtered
        deduplicate: deduplicate,
        duplicateService: duplicateService,
        filename: `sales_export_${new Date().toISOString().split('T')[0]}.csv`
      });
      
      let message = `Exported ${result.recordCount} sales to CSV (160+ fields)`;
      if (result.deduplication && result.deduplication.duplicatesRemoved > 0) {
        message += `. Removed ${result.deduplication.duplicatesRemoved} duplicate${result.deduplication.duplicatesRemoved === 1 ? '' : 's'}`;
      }
      showAdminMessage(message, 'success');
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
    // Add standard fields
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
    
    // Add dynamic fields
    if (sale.dynamicFields) {
      Object.keys(sale.dynamicFields).forEach(key => allFieldNames.add(key));
    }
  });

  const headers = Array.from(allFieldNames);
  const rows = [headers.join(',')];

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
  
  showAdminMessage(`Exported ${filteredSales.length} sales to CSV`, 'success');
}

/**
 * Show import sales modal
 */
function showImportSalesModal() {
  const modal = document.getElementById('importSalesModal');
  if (modal) {
    modal.style.display = 'flex';
    // Reset file input
    const fileInput = document.getElementById('importSalesFileInput');
    if (fileInput) {
      fileInput.value = '';
    }
    // Hide progress
    const progress = document.getElementById('importSalesProgress');
    if (progress) {
      progress.style.display = 'none';
    }
  }
}

/**
 * Close import sales modal
 */
function closeImportSalesModal() {
  const modal = document.getElementById('importSalesModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Import sales from file
 */
async function importSalesFromFile() {
  const fileInput = document.getElementById('importSalesFileInput');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showAdminMessage('Please select a file', 'error');
    return;
  }

  const file = fileInput.files[0];
  
  // Use enhanced import service if available
  if (typeof importService !== 'undefined' && typeof database !== 'undefined') {
    try {
      // Initialize import service
      importService.initialize(database);
      
      // Get current user
      let currentUser = null;
      if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
      }
      
      // Show progress
      const progress = document.getElementById('importSalesProgress');
      const progressFill = document.getElementById('importSalesProgressFill');
      const progressText = document.getElementById('importSalesProgressText');
      if (progress) {
        progress.style.display = 'block';
      }
      
      // Import from file
      const result = await importService.importFromFile(file, {
        user: currentUser,
        importToDatabase: true,
        onProgress: (current, total, record) => {
          if (progressFill) {
            progressFill.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;
          }
          if (progressText) {
            progressText.textContent = `Importing ${current} of ${total} records...`;
          }
        }
      });
      
      // Hide progress
      if (progress) {
        progress.style.display = 'none';
      }
      
      // Show results
      if (result.errorCount > 0) {
        const errorReport = importService.generateErrorReport(result.failed);
        showAdminMessage(`Imported ${result.successCount} records, ${result.errorCount} errors. Check console for details.`, 'error');
        console.error('Import Errors:', errorReport);
      } else {
        showAdminMessage(`Successfully imported ${result.successCount} records`, 'success');
      }
      
      // Close modal
      closeImportSalesModal();
      
      // Reload sales
      await loadSales();
      
      return;
    } catch (error) {
      console.error('Error with enhanced import service:', error);
      showAdminMessage('Error importing sales: ' + error.message, 'error');
      return;
    }
  }

  // Fallback message
  showAdminMessage('Import service not available. Please use CRM leads upload.', 'error');
}

/**
 * Show export options modal
 * @returns {Promise<boolean|null>} Deduplicate option or null if cancelled
 */
function showExportOptionsModal() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Export Options</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove(); window.exportOptionsResolve(null);">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>
              <input type="checkbox" id="exportDeduplicate" checked>
              Remove duplicates before export
            </label>
            <small class="form-hint">Duplicates are identified by phone number and email address.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); window.exportOptionsResolve(null);">Cancel</button>
          <button class="btn btn-primary" onclick="
            const deduplicate = document.getElementById('exportDeduplicate').checked;
            this.closest('.modal').remove();
            window.exportOptionsResolve(deduplicate);
          ">Export</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    window.exportOptionsResolve = resolve;
  });
}

/**
 * Initialize SMS tab
 */
function initializeSMSTab() {
  const container = document.getElementById('smsUIContainer');
  if (!container || window.smsUIInstance) return;
  
  if (typeof SMSUI === 'undefined') {
    console.warn('SMSUI component not available');
    return;
  }
  
  // Initialize SMS service if available
  if (typeof smsService !== 'undefined' && typeof database !== 'undefined') {
    // Note: SMS service requires API credentials - configure in production
    // smsService.initialize({
    //   apiKey: 'your-api-key',
    //   apiSecret: 'your-api-secret',
    //   provider: 'twilio',
    //   fromNumber: '+1234567890',
    //   database: database
    // });
  }
  
  window.smsUIInstance = new SMSUI(container, {
    sales: filteredSales || [],
    onSend: async (phone, message) => {
      if (typeof smsService !== 'undefined') {
        try {
          await smsService.sendSMS(phone, message);
          showAdminMessage('SMS sent successfully', 'success');
        } catch (error) {
          showAdminMessage('Error sending SMS: ' + error.message, 'error');
        }
      }
    },
    onBulkSend: async (recipients, message) => {
      if (typeof smsService !== 'undefined') {
        try {
          const result = await smsService.sendBulkSMS(recipients, message, {
            onProgress: (current, total) => {
              // Progress handled by component
            }
          });
          showAdminMessage(`Sent ${result.success.length} SMS messages${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`, result.failed.length > 0 ? 'error' : 'success');
        } catch (error) {
          showAdminMessage('Error sending bulk SMS: ' + error.message, 'error');
        }
      }
    }
  });
  
  window.smsUIInstance.render();
}

/**
 * Initialize Documents tab
 */
function initializeDocumentsTab() {
  const container = document.getElementById('documentTemplateUIContainer');
  if (!container || window.documentTemplateUIInstance) return;
  
  if (typeof DocumentTemplateUI === 'undefined') {
    console.warn('DocumentTemplateUI component not available');
    return;
  }
  
  // Initialize document service if available
  if (typeof documentService !== 'undefined' && typeof database !== 'undefined') {
    documentService.initialize({
      database: database,
      storage: null, // Firebase Storage would go here
      pdfGenerator: typeof pdfGenerator !== 'undefined' ? pdfGenerator : null
    });
    
    // Initialize PDF generator
    if (typeof pdfGenerator !== 'undefined') {
      pdfGenerator.initialize();
    }
  }
  
  window.documentTemplateUIInstance = new DocumentTemplateUI(container, {
    onGenerate: async (templateId, data) => {
      if (typeof documentService !== 'undefined') {
        try {
          const result = await documentService.generateDocument(templateId, data, 'pdf');
          if (result.content && typeof pdfGenerator !== 'undefined') {
            pdfGenerator.downloadPDF(result.content, `${result.templateName}_${Date.now()}.pdf`);
            showAdminMessage('Document generated successfully', 'success');
          }
        } catch (error) {
          showAdminMessage('Error generating document: ' + error.message, 'error');
        }
      }
    }
  });
  
  window.documentTemplateUIInstance.render();
}

/**
 * Show admin message
 */
function showAdminMessage(message, type) {
  const adminMessage = document.getElementById('adminMessage');
  const adminMessageContent = document.getElementById('adminMessageContent');
  
  if (adminMessage && adminMessageContent) {
    adminMessageContent.textContent = message;
    adminMessageContent.className = `message ${type}`;
    adminMessage.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      adminMessage.style.display = 'none';
    }, 5000);
  }
}

/**
 * Load and display security logs
 */
async function loadSecurityLogs() {
  const securityLogsLoading = document.getElementById('securityLogsLoading');
  const securityLogsList = document.getElementById('securityLogsList');
  const securityLogsEmpty = document.getElementById('securityLogsEmpty');
  
  if (!securityLogsLoading || !securityLogsList || !securityLogsEmpty) return;
  
  try {
    securityLogsLoading.style.display = 'block';
    securityLogsList.style.display = 'none';
    securityLogsEmpty.style.display = 'none';
    
    const db = getDatabase();
    const securityLogsRef = db.ref('security_logs');
    const snapshot = await securityLogsRef.orderByChild('timestamp').limitToLast(100).once('value');
    
    securityLogsLoading.style.display = 'none';
    
    if (!snapshot.exists() || snapshot.numChildren() === 0) {
      securityLogsEmpty.style.display = 'block';
      return;
    }
    
    const logs = [];
    snapshot.forEach((childSnapshot) => {
      const log = childSnapshot.val();
      logs.push({
        id: childSnapshot.key,
        ...log
      });
    });
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    // Render logs
    securityLogsList.innerHTML = '';
    logs.forEach(log => {
      const logItem = document.createElement('div');
      logItem.className = 'security-log-item';
      
      const severityColor = log.severity === 'critical' ? '#dc2626' : log.severity === 'warning' ? '#f59e0b' : '#3b82f6';
      const severityIcon = log.severity === 'critical' ? '🔴' : log.severity === 'warning' ? '🟡' : '🔵';
      const eventIcon = getSecurityEventIcon(log.eventType);
      const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB') : 'Unknown time';
      
      logItem.style.cssText = `
        background: var(--bg-secondary);
        padding: 16px;
        border-radius: var(--border-radius);
        margin-bottom: 12px;
        border-left: 4px solid ${severityColor};
      `;
      
      let detailsHTML = '';
      if (log.details) {
        const detailItems = [];
        if (log.details.identifier) detailItems.push(`Identifier: ${log.details.identifier}`);
        if (log.details.attemptCount !== undefined) detailItems.push(`Attempts: ${log.details.attemptCount}`);
        if (log.details.remainingAttempts !== undefined) detailItems.push(`Remaining: ${log.details.remainingAttempts}`);
        if (log.details.reason) detailItems.push(`Reason: ${log.details.reason}`);
        if (log.details.oldRole && log.details.newRole) detailItems.push(`${log.details.oldRole} → ${log.details.newRole}`);
        if (log.details.route) detailItems.push(`Route: ${log.details.route}`);
        if (log.details.createdBy) detailItems.push(`By: ${log.details.createdBy}`);
        if (log.details.deletedBy) detailItems.push(`By: ${log.details.deletedBy}`);
        if (log.details.changedBy) detailItems.push(`By: ${log.details.changedBy}`);
        if (detailItems.length > 0) {
          detailsHTML = `<div style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">${detailItems.join(' • ')}</div>`;
        }
      }
      
      logItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 20px;">${eventIcon}</span>
              <strong style="color: var(--text-primary);">${getSecurityEventLabel(log.eventType)}</strong>
              <span style="font-size: 16px;">${severityIcon}</span>
              <span style="background: ${severityColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${log.severity || 'info'}</span>
            </div>
            ${log.userEmail ? `<div style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">User: ${log.userEmail}${log.username ? ` (${log.username})` : ''}</div>` : ''}
            ${detailsHTML}
          </div>
          <div style="color: var(--text-secondary); font-size: 12px; white-space: nowrap;">
            ${timestamp}
          </div>
        </div>
      `;
      
      securityLogsList.appendChild(logItem);
    });
    
    securityLogsList.style.display = 'block';
  } catch (error) {
    console.error('Error loading security logs:', error);
    securityLogsLoading.style.display = 'none';
    securityLogsEmpty.style.display = 'block';
    securityLogsEmpty.innerHTML = `
      <p style="font-size: 18px; margin-bottom: 8px; color: var(--error);">Error loading security logs</p>
      <p>${error.message}</p>
    `;
  }
}

/**
 * Get icon for security event type
 */
function getSecurityEventIcon(eventType) {
  const icons = {
    'login_success': '✅',
    'login_failed': '❌',
    'login_locked': '🔒',
    'logout': '🚪',
    'brute_force_detected': '⚠️',
    'unauthorized_access': '🚫',
    'password_change': '🔑',
    'account_created': '➕',
    'account_deleted': '🗑️',
    'role_changed': '🔄',
    'session_expired': '⏰'
  };
  return icons[eventType] || '📋';
}

/**
 * Get label for security event type
 */
function getSecurityEventLabel(eventType) {
  const labels = {
    'login_success': 'Login Success',
    'login_failed': 'Login Failed',
    'login_locked': 'Account Locked',
    'logout': 'User Logout',
    'brute_force_detected': 'Brute Force Detected',
    'unauthorized_access': 'Unauthorized Access',
    'password_change': 'Password Changed',
    'account_created': 'Account Created',
    'account_deleted': 'Account Deleted',
    'role_changed': 'Role Changed',
    'session_expired': 'Session Expired'
  };
  return labels[eventType] || eventType;
}

/**
 * Brand Management Functions
 */

// Global state for brands
let brands = [];
let filteredBrands = [];

/**
 * Load brands from Firebase
 */
async function loadBrands() {
  const brandsLoading = document.getElementById('brandsLoading');
  const brandsList = document.getElementById('brandsList');
  const brandsEmpty = document.getElementById('brandsEmpty');
  const brandCount = document.getElementById('brandCount');

  try {
    if (brandsLoading) brandsLoading.style.display = 'block';
    if (brandsList) brandsList.style.display = 'none';
    if (brandsEmpty) brandsEmpty.style.display = 'none';

    // checkRole() already ran in initializeAdmin(), so auth should be ready
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
      } catch (error) {
        console.warn('Could not sign in anonymously:', error);
      }
    }

    const db = getDatabase();
    const brandsRef = db.ref('brands');
    const snapshot = await brandsRef.once('value');

    brands = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const brandId = childSnapshot.key;
        const brandData = childSnapshot.val();
        brands.push({
          id: brandId,
          name: typeof brandData === 'string' ? brandData : (brandData.name || ''),
          createdAt: brandData.createdAt || '',
          order: brandData.order || 999
        });
      });
    }

    // Sort by name
    brands.sort((a, b) => a.name.localeCompare(b.name));
    filteredBrands = [...brands];

    if (brandsLoading) brandsLoading.style.display = 'none';
    if (brandsList) {
      brandsList.style.display = 'grid';
      renderBrandsList();
    }
    if (brandCount) {
      brandCount.textContent = `${brands.length} brand${brands.length !== 1 ? 's' : ''}`;
    }
    if (brands.length === 0 && brandsEmpty) {
      brandsEmpty.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading brands:', error);
    if (brandsLoading) brandsLoading.style.display = 'none';
    if (brandsEmpty) {
      brandsEmpty.style.display = 'block';
      brandsEmpty.innerHTML = `
        <p style="color: #dc2626; font-size: 18px; margin-bottom: 8px;">Error loading brands</p>
        <p>${error.message}</p>
      `;
    }
    showAdminMessage('Error loading brands: ' + error.message, 'error');
  }
}

/**
 * Render brands list
 */
function renderBrandsList() {
  const brandsList = document.getElementById('brandsList');
  if (!brandsList) return;

  brandsList.innerHTML = '';

  if (filteredBrands.length === 0) {
    brandsList.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">No brands match your search.</div>';
    return;
  }

  filteredBrands.forEach(brand => {
    const brandCard = document.createElement('div');
    brandCard.className = 'brand-card';
    brandCard.style.cssText = `
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    `;
    brandCard.onmouseover = function() {
      this.style.borderColor = '#3b82f6';
      this.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
    };
    brandCard.onmouseout = function() {
      this.style.borderColor = '#e5e7eb';
      this.style.boxShadow = 'none';
    };

    const brandName = document.createElement('div');
    brandName.style.cssText = 'font-weight: 600; font-size: 16px; color: var(--text-primary);';
    brandName.textContent = brand.name;

    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px;';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = '✏️ Edit';
    editBtn.style.cssText = 'padding: 6px 12px; font-size: 14px;';
    editBtn.onclick = () => editBrand(brand);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.style.cssText = 'padding: 6px 12px; font-size: 14px;';
    deleteBtn.onclick = () => deleteBrand(brand.id, brand.name);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    brandCard.appendChild(brandName);
    brandCard.appendChild(actions);
    brandsList.appendChild(brandCard);
  });
}

/**
 * Filter brands by search input
 */
function filterBrands() {
  const searchInput = document.getElementById('brandSearchInput');
  if (!searchInput) return;

  const searchTerm = searchInput.value.trim().toLowerCase();
  
  if (searchTerm === '') {
    filteredBrands = [...brands];
  } else {
    filteredBrands = brands.filter(brand =>
      brand.name.toLowerCase().includes(searchTerm)
    );
  }

  renderBrandsList();
}

/**
 * Handle add brand form submission
 */
async function handleAddBrand(e) {
  e.preventDefault();
  
  const brandNameInput = document.getElementById('newBrandName');
  const brandFormMessage = document.getElementById('brandFormMessage');
  
  if (!brandNameInput) return;

  const brandName = brandNameInput.value.trim();

  if (!brandName) {
    showBrandFormMessage('Brand name is required', 'error');
    return;
  }

  // Check for duplicates (case-insensitive)
  const duplicate = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
  if (duplicate) {
    showBrandFormMessage('Brand already exists', 'error');
    return;
  }

  try {
    // checkRole() already ran in initializeAdmin(), so auth should be ready
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
      } catch (error) {
        console.warn('Could not sign in anonymously:', error);
      }
    }

    const db = getDatabase();
    const brandsRef = db.ref('brands');
    
    // Create new brand entry
    const newBrandRef = brandsRef.push();
    await newBrandRef.set({
      name: brandName,
      createdAt: Date.now(),
      order: brands.length + 1
    });

    showBrandFormMessage('Brand added successfully!', 'success');
    brandNameInput.value = '';
    
    // Reload brands list
    await loadBrands();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      if (brandFormMessage) {
        brandFormMessage.style.display = 'none';
      }
    }, 3000);
  } catch (error) {
    console.error('Error adding brand:', error);
    showBrandFormMessage('Error adding brand: ' + error.message, 'error');
  }
}

/**
 * Edit brand
 */
function editBrand(brand) {
  const newName = prompt(`Edit brand name:`, brand.name);
  
  if (newName === null) {
    return; // User cancelled
  }

  const trimmedName = newName.trim();
  
  if (!trimmedName) {
    showAdminMessage('Brand name cannot be empty', 'error');
    return;
  }

  // Check for duplicates (excluding current brand)
  const duplicate = brands.find(b => b.id !== brand.id && b.name.toLowerCase() === trimmedName.toLowerCase());
  if (duplicate) {
    showAdminMessage('Brand name already exists', 'error');
    return;
  }

  updateBrand(brand.id, trimmedName);
}

/**
 * Update brand in Firebase
 */
async function updateBrand(brandId, newName) {
  try {
    // checkRole() already ran in initializeAdmin(), so auth should be ready
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
      } catch (error) {
        console.warn('Could not sign in anonymously:', error);
      }
    }

    const db = getDatabase();
    const brandRef = db.ref(`brands/${brandId}`);
    
    // Get existing data
    const snapshot = await brandRef.once('value');
    const existingData = snapshot.val();
    
    // Update name while preserving other fields
    await brandRef.update({
      name: newName,
      updatedAt: Date.now()
    });

    showAdminMessage('Brand updated successfully!', 'success');
    await loadBrands();
  } catch (error) {
    console.error('Error updating brand:', error);
    showAdminMessage('Error updating brand: ' + error.message, 'error');
  }
}

/**
 * Delete brand
 */
async function deleteBrand(brandId, brandName) {
  if (!confirm(`Are you sure you want to delete "${brandName}"?\n\nThis will remove the brand from the autocomplete dropdown.`)) {
    return;
  }

  try {
    // checkRole() already ran in initializeAdmin(), so auth should be ready
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
      } catch (error) {
        console.warn('Could not sign in anonymously:', error);
      }
    }

    const db = getDatabase();
    const brandRef = db.ref(`brands/${brandId}`);
    await brandRef.remove();

    showAdminMessage('Brand deleted successfully!', 'success');
    await loadBrands();
  } catch (error) {
    console.error('Error deleting brand:', error);
    showAdminMessage('Error deleting brand: ' + error.message, 'error');
  }
}

/**
 * Show brand form message
 */
function showBrandFormMessage(message, type = 'info') {
  const brandFormMessage = document.getElementById('brandFormMessage');
  if (!brandFormMessage) return;

  brandFormMessage.textContent = message;
  brandFormMessage.className = `message ${type}`;
  brandFormMessage.style.display = 'block';

  // Set color based on type
  switch (type) {
    case 'success':
      brandFormMessage.style.color = '#28a745';
      brandFormMessage.style.background = '#d4edda';
      brandFormMessage.style.border = '1px solid #c3e6cb';
      break;
    case 'error':
      brandFormMessage.style.color = '#dc3545';
      brandFormMessage.style.background = '#f8d7da';
      brandFormMessage.style.border = '1px solid #f5c6cb';
      break;
    default:
      brandFormMessage.style.color = '#007bff';
      brandFormMessage.style.background = '#d1ecf1';
      brandFormMessage.style.border = '1px solid #bee5eb';
  }
}

// Expose functions to global scope for HTML onclick handlers
if (typeof window !== 'undefined') {
  window.loadSales = loadSales;
  window.loadFormFields = loadFormFields;
  if (typeof loadSecurityLogs !== 'undefined') {
    window.loadSecurityLogs = loadSecurityLogs;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
  initializeAdmin();
}
