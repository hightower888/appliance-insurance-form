/**
 * Mobile Navigation Component (Phase 4A)
 * Mobile-optimized navigation with bottom nav bar and mobile menu
 */

class MobileNavigation {
  constructor(options = {}) {
    this.options = {
      container: options.container || document.body,
      bottomNavItems: options.bottomNavItems || [],
      onItemClick: options.onItemClick || null,
      ...options
    };

    this.isMobile = this.detectMobile();
    this.isOpen = false;
    this.bottomNav = null;
    this.mobileMenu = null;
  }

  /**
   * Detect if device is mobile
   * @returns {boolean} True if mobile
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  /**
   * Initialize mobile navigation
   */
  init() {
    if (!this.isMobile) return;

    this.createBottomNavigation();
    this.createMobileMenu();
    this.setupEventListeners();
    this.updateActiveState();
  }

  /**
   * Create bottom navigation bar
   */
  createBottomNavigation() {
    // Remove existing if present
    const existing = document.querySelector('.mobile-bottom-nav');
    if (existing) {
      existing.remove();
    }

    // Default navigation items if not provided
    const items = this.options.bottomNavItems.length > 0 
      ? this.options.bottomNavItems
      : this.getDefaultNavItems();

    this.bottomNav = document.createElement('nav');
    this.bottomNav.className = 'mobile-bottom-nav';
    this.bottomNav.innerHTML = items.map(item => `
      <button class="mobile-bottom-nav-item ${item.active ? 'active' : ''}" 
              data-tab="${item.tab || item.id}"
              onclick="if(typeof window.mobileNavigation !== 'undefined') { window.mobileNavigation.handleNavClick('${item.tab || item.id}'); }">
        <span class="mobile-bottom-nav-item-icon">${item.icon || '📋'}</span>
        <span class="mobile-bottom-nav-item-label">${this.escapeHtml(item.label || item.name)}</span>
      </button>
    `).join('');

    this.options.container.appendChild(this.bottomNav);
  }

  /**
   * Get default navigation items
   * @returns {Array} Default nav items
   */
  getDefaultNavItems() {
    return [
      { id: 'leads', tab: 'leads', label: 'Leads', icon: '📋', active: true },
      { id: 'customers', tab: 'customers', label: 'Customers', icon: '👥', active: false },
      { id: 'reports', tab: 'reports', label: 'Reports', icon: '📈', active: false },
      { id: 'dashboard', tab: 'dashboard', label: 'Dashboard', icon: '📊', active: false }
    ];
  }

  /**
   * Create mobile menu (hamburger menu)
   */
  createMobileMenu() {
    // Create menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '☰';
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.onclick = () => this.toggleMobileMenu();

    // Add to header if exists
    const header = document.querySelector('.header');
    if (header) {
      const headerContent = header.querySelector('.user-info-header');
      if (headerContent) {
        headerContent.insertBefore(menuButton, headerContent.firstChild);
      }
    }

    // Enhance sidebar for mobile
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.add('mobile-sidebar');
      
      // Add overlay
      const overlay = document.createElement('div');
      overlay.className = 'mobile-sidebar-overlay';
      overlay.onclick = () => this.closeMobileMenu();
      document.body.appendChild(overlay);
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    this.isOpen = !this.isOpen;
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-sidebar-overlay');

    if (sidebar) {
      if (this.isOpen) {
        sidebar.classList.add('open');
        if (overlay) overlay.style.display = 'block';
      } else {
        sidebar.classList.remove('open');
        if (overlay) overlay.style.display = 'none';
      }
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.isOpen = false;
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-sidebar-overlay');

    if (sidebar) {
      sidebar.classList.remove('open');
    }
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Handle navigation item click
   * @param {string} tabId - Tab ID
   */
  handleNavClick(tabId) {
    // Update active state
    this.updateActiveState(tabId);

    // Call callback
    if (this.options.onItemClick) {
      this.options.onItemClick(tabId);
    } else {
      // Default: switch tab if function exists
      if (typeof switchTab === 'function') {
        switchTab(tabId);
      }
    }

    // Haptic feedback
    if (typeof TouchInteractions !== 'undefined' && window.touchInteractions) {
      window.touchInteractions.hapticFeedback('light');
    }
  }

  /**
   * Update active navigation state
   * @param {string} activeTabId - Active tab ID
   */
  updateActiveState(activeTabId = null) {
    if (!this.bottomNav) return;

    // Get current active tab if not provided
    if (!activeTabId) {
      if (typeof currentTab !== 'undefined') {
        activeTabId = currentTab;
      } else {
        const activeItem = this.bottomNav.querySelector('.mobile-bottom-nav-item.active');
        if (activeItem) {
          activeTabId = activeItem.dataset.tab;
        }
      }
    }

    // Update all items
    const items = this.bottomNav.querySelectorAll('.mobile-bottom-nav-item');
    items.forEach(item => {
      if (item.dataset.tab === activeTabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Window resize - update mobile state
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();
        
        if (wasMobile !== this.isMobile) {
          // Mobile state changed
          if (this.isMobile) {
            this.init();
          } else {
            this.destroy();
          }
        }
      }, 250);
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !e.target.closest('.sidebar') && 
          !e.target.closest('.mobile-menu-button')) {
        this.closeMobileMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Destroy mobile navigation
   */
  destroy() {
    if (this.bottomNav && this.bottomNav.parentNode) {
      this.bottomNav.parentNode.removeChild(this.bottomNav);
    }

    const overlay = document.querySelector('.mobile-sidebar-overlay');
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    const menuButton = document.querySelector('.mobile-menu-button');
    if (menuButton && menuButton.parentNode) {
      menuButton.parentNode.removeChild(menuButton);
    }
  }

  /**
   * Escape HTML
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Create singleton instance
const mobileNavigation = new MobileNavigation({
  onItemClick: (tabId) => {
    if (typeof switchTab === 'function') {
      switchTab(tabId);
    }
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MobileNavigation, mobileNavigation };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.MobileNavigation = MobileNavigation;
  window.mobileNavigation = mobileNavigation;
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileNavigation.init();
    });
  } else {
    mobileNavigation.init();
  }
}
