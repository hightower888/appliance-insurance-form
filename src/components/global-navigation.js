/**
 * Global Navigation Component
 * Elite UI/UX Redesign - Phase 2
 * Provides consistent navigation across all pages
 */

class GlobalNavigation {
  constructor() {
    this.currentPath = window.location.pathname;
    this.navItems = [
      { id: 'crm', label: 'CRM', icon: 'bar-chart-3', path: '/crm' },
      { id: 'admin', label: 'Admin', icon: 'shield', path: '/admin' },
      { id: 'form', label: 'Form', icon: 'file-text', path: '/form' },
      { id: 'processor', label: 'Processor', icon: 'settings', path: '/processor' },
      { id: 'home', label: 'Home', icon: 'home', path: '/' }
    ];
    this.userEmail = '';
    this.init();
  }

  /**
   * Initialize global navigation
   */
  init() {
    this.createNavigation();
    this.attachEventListeners();
    this.loadUserInfo();
    this.updateActiveState();
  }

  /**
   * Create navigation HTML structure
   */
  createNavigation() {
    const navHTML = `
      <nav class="global-nav" role="navigation" aria-label="Main navigation">
        <div class="global-nav-container">
          <!-- Left: Logo and Main Nav -->
          <div class="global-nav-left">
            <a href="/" class="global-nav-logo" aria-label="Appliance Cover Home">
              <i data-lucide="shield-check" style="width: 24px; height: 24px;"></i>
              <span class="global-nav-brand">Appliance Cover</span>
            </a>
            
            <!-- Main Navigation Items -->
            <div class="global-nav-items">
              ${this.navItems.map(item => `
                <a href="${item.path}" 
                   class="global-nav-item ${this.isActive(item.path) ? 'active' : ''}" 
                   data-nav-id="${item.id}"
                   aria-label="${item.label}">
                  <i data-lucide="${item.icon}" style="width: 18px; height: 18px;"></i>
                  <span class="global-nav-item-label">${item.label}</span>
                </a>
              `).join('')}
            </div>
          </div>

          <!-- Right: User Actions -->
          <div class="global-nav-right">
            <!-- Notification Bell (Placeholder for future) -->
            <button class="global-nav-icon-btn" aria-label="Notifications" title="Notifications" style="display: none;">
              <i data-lucide="bell" style="width: 20px; height: 20px;"></i>
              <span class="global-nav-badge" style="display: none;">0</span>
            </button>

            <!-- Settings Icon (Placeholder for future) -->
            <button class="global-nav-icon-btn" aria-label="Settings" title="Settings" style="display: none;">
              <i data-lucide="settings" style="width: 20px; height: 20px;"></i>
            </button>

            <!-- User Menu -->
            <div class="global-nav-user-menu">
              <button class="global-nav-user-btn" id="userMenuBtn" aria-label="User menu" aria-expanded="false">
                <div class="global-nav-user-avatar">
                  <i data-lucide="user" style="width: 20px; height: 20px;"></i>
                </div>
                <span class="global-nav-user-email" id="globalNavUserEmail">User</span>
                <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
              </button>
              
              <!-- User Dropdown Menu -->
              <div class="global-nav-user-dropdown" id="userDropdown" style="display: none;">
                <div class="global-nav-user-dropdown-header">
                  <div class="global-nav-user-dropdown-email" id="dropdownUserEmail">User</div>
                  <div class="global-nav-user-dropdown-role" id="dropdownUserRole">Role</div>
                </div>
                <div class="global-nav-user-dropdown-divider"></div>
                <a href="#" class="global-nav-user-dropdown-item" id="profileLink" style="display: none;">
                  <i data-lucide="user" style="width: 16px; height: 16px;"></i>
                  <span>Profile</span>
                </a>
                <a href="#" class="global-nav-user-dropdown-item" id="settingsLink" style="display: none;">
                  <i data-lucide="settings" style="width: 16px; height: 16px;"></i>
                  <span>Settings</span>
                </a>
                <div class="global-nav-user-dropdown-divider"></div>
                <button class="global-nav-user-dropdown-item" id="globalNavLogoutBtn">
                  <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <!-- Mobile Menu Toggle -->
            <button class="global-nav-mobile-toggle" id="mobileMenuToggle" aria-label="Toggle mobile menu" aria-expanded="false">
              <i data-lucide="menu" style="width: 24px; height: 24px;"></i>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div class="global-nav-mobile" id="mobileNav" style="display: none;">
          <div class="global-nav-mobile-items">
            ${this.navItems.map(item => `
              <a href="${item.path}" 
                 class="global-nav-mobile-item ${this.isActive(item.path) ? 'active' : ''}" 
                 data-nav-id="${item.id}">
                <i data-lucide="${item.icon}" style="width: 20px; height: 20px;"></i>
                <span>${item.label}</span>
              </a>
            `).join('')}
          </div>
        </div>
      </nav>
    `;

    // Insert at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Check if path is active
   */
  isActive(path) {
    if (path === '/') {
      return this.currentPath === '/' || this.currentPath === '/login.html';
    }
    return this.currentPath.includes(path);
  }

  /**
   * Update active state based on current path
   */
  updateActiveState() {
    const navItems = document.querySelectorAll('.global-nav-item, .global-nav-mobile-item');
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (this.isActive(href)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Load user information
   */
  loadUserInfo() {
    // Try to get user email from existing userInfo elements
    const existingUserEmail = document.getElementById('userEmail');
    if (existingUserEmail) {
      this.userEmail = existingUserEmail.textContent.trim();
    }

    // Update navigation user display
    const navUserEmail = document.getElementById('globalNavUserEmail');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    
    if (navUserEmail) {
      navUserEmail.textContent = this.userEmail || 'User';
    }
    if (dropdownUserEmail) {
      dropdownUserEmail.textContent = this.userEmail || 'User';
    }

    // Hide user menu on login page
    if (this.currentPath === '/' || this.currentPath === '/login.html') {
      const userMenu = document.querySelector('.global-nav-user-menu');
      if (userMenu) {
        userMenu.style.display = 'none';
      }
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // User menu toggle
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = userMenuBtn.getAttribute('aria-expanded') === 'true';
        userDropdown.style.display = isExpanded ? 'none' : 'block';
        userMenuBtn.setAttribute('aria-expanded', !isExpanded);
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.style.display = 'none';
          userMenuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('globalNavLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Use existing logout functionality if available
        const existingLogoutBtn = document.getElementById('logoutBtn');
        if (existingLogoutBtn) {
          existingLogoutBtn.click();
        } else {
          // Fallback logout
          window.location.href = '/';
        }
      });
    }

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    if (mobileToggle && mobileNav) {
      mobileToggle.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileNav.style.display = isExpanded ? 'none' : 'block';
        mobileToggle.setAttribute('aria-expanded', !isExpanded);
      });
    }

    // Close mobile menu when clicking a link
    const mobileItems = document.querySelectorAll('.global-nav-mobile-item');
    mobileItems.forEach(item => {
      item.addEventListener('click', () => {
        if (mobileNav) {
          mobileNav.style.display = 'none';
          if (mobileToggle) {
            mobileToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }

  /**
   * Update user email (called from external code)
   */
  updateUserEmail(email) {
    this.userEmail = email;
    const navUserEmail = document.getElementById('globalNavUserEmail');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    
    if (navUserEmail) {
      navUserEmail.textContent = email || 'User';
    }
    if (dropdownUserEmail) {
      dropdownUserEmail.textContent = email || 'User';
    }
  }
}

// Initialize global navigation when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.globalNav = new GlobalNavigation();
  });
} else {
  window.globalNav = new GlobalNavigation();
}
