/**
 * Sidebar Component
 * Persistent sidebar navigation for CRM
 */

class Sidebar {
  constructor(containerId = 'sidebar', options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Sidebar: Container with id "${containerId}" not found`);
      return;
    }

    this.options = {
      collapsed: false,
      collapsible: true,
      items: [],
      ...options
    };

    this.isInitialized = false;
    this.currentRoute = window.location.pathname;

    // Get initial state from state manager if available
    if (typeof crmState !== 'undefined') {
      this.options.collapsed = crmState.getState('sidebarCollapsed') || false;
    }

    this.init();
  }

  /**
   * Initialize sidebar
   */
  init() {
    if (this.isInitialized) return;

    this.render();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  /**
   * Render sidebar
   */
  render() {
    if (!this.container) return;

    const collapsed = this.options.collapsed;
    const items = this.getNavigationItems();

    this.container.innerHTML = `
      <div class="sidebar-header ${collapsed ? 'collapsed' : ''}">
        <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
          <span class="sidebar-toggle-icon">${collapsed ? '→' : '←'}</span>
        </button>
        ${!collapsed ? '<h2 class="sidebar-title">Navigation</h2>' : ''}
      </div>
      <nav class="sidebar-nav ${collapsed ? 'collapsed' : ''}" role="navigation">
        <ul class="sidebar-menu">
          ${items.map(item => this.renderMenuItem(item)).join('')}
        </ul>
      </nav>
    `;

    // Update container class
    this.container.className = `sidebar ${collapsed ? 'sidebar-collapsed' : ''}`;
  }

  /**
   * Get navigation items (TASK-1.5.1: Enhanced with view navigation)
   * @returns {Array} Navigation items
   */
  getNavigationItems() {
    // Get current view from state manager if available
    let currentView = 'table';
    if (typeof crmState !== 'undefined') {
      currentView = crmState.getCurrentView();
    }

    // Default navigation items
    const defaultItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '📊',
        route: '/crm',
        active: this.currentRoute === '/crm' || this.currentRoute === '/CRM'
      },
      {
        id: 'leads',
        label: 'Leads',
        icon: '📋',
        route: '/crm#leads',
        active: this.currentRoute.includes('/crm') && window.location.hash === '#leads'
      },
      {
        id: 'customers',
        label: 'Customers',
        icon: '👥',
        route: '/crm#customers',
        active: this.currentRoute.includes('/crm') && window.location.hash === '#customers'
      },
      // TASK-1.5.1: Add view navigation items
      {
        id: 'view-table',
        label: 'Table View',
        icon: '📋',
        view: 'table',
        active: currentView === 'table',
        type: 'view'
      },
      {
        id: 'view-kanban',
        label: 'Kanban View',
        icon: '📊',
        view: 'kanban',
        active: currentView === 'kanban',
        type: 'view'
      },
      {
        id: 'view-timeline',
        label: 'Timeline View',
        icon: '📅',
        view: 'timeline',
        active: currentView === 'timeline',
        type: 'view'
      },
      {
        id: 'view-card',
        label: 'Card View',
        icon: '🃏',
        view: 'card',
        active: currentView === 'card',
        type: 'view'
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: '📈',
        route: '/crm#reports',
        active: this.currentRoute.includes('/crm') && window.location.hash === '#reports'
      },
      {
        id: 'audit',
        label: 'Audit Logs',
        icon: '📝',
        route: '/crm#audit',
        active: this.currentRoute.includes('/crm') && window.location.hash === '#audit'
      },
      {
        type: 'divider'
      },
      {
        id: 'form',
        label: 'Insurance Form',
        icon: '📝',
        route: '/form',
        external: false
      },
      {
        id: 'admin',
        label: 'Admin Panel',
        icon: '👑',
        route: '/admin',
        external: false
      },
      {
        id: 'processor',
        label: 'Processor',
        icon: '⚙️',
        route: '/processor',
        external: false
      }
    ];

    // Merge with custom items if provided
    return this.options.items.length > 0 ? this.options.items : defaultItems;
  }

  /**
   * Render menu item
   * @param {Object} item - Menu item
   * @returns {string} HTML string
   */
  renderMenuItem(item) {
    if (item.type === 'divider') {
      return '<li class="sidebar-divider"></li>';
    }

    // TASK-1.5.1: Handle view items with active state indicators
    if (item.type === 'view') {
      const collapsed = this.options.collapsed;
      const active = item.active ? 'active' : '';
      return `
        <li class="sidebar-menu-item ${active}">
          <a href="#" 
             class="sidebar-menu-link view-link ${active}" 
             data-view="${item.view}" 
             data-route="#"
             ${item.id ? `data-item-id="${item.id}"` : ''}>
            <span class="sidebar-menu-icon">${item.icon || '•'}</span>
            ${!collapsed ? `<span class="sidebar-menu-label">${item.label}</span>` : ''}
            ${item.active ? '<span class="active-indicator"></span>' : ''}
          </a>
        </li>
      `;
    }

    const collapsed = this.options.collapsed;
    const active = item.active ? 'active' : '';
    const external = item.external ? 'target="_blank" rel="noopener noreferrer"' : '';
    
    return `
      <li class="sidebar-menu-item ${active}">
        <a href="${item.route}" 
           class="sidebar-menu-link ${active}" 
           data-route="${item.route}"
           ${external}
           ${item.id ? `data-item-id="${item.id}"` : ''}>
          <span class="sidebar-menu-icon">${item.icon || '•'}</span>
          ${!collapsed ? `<span class="sidebar-menu-label">${item.label}</span>` : ''}
          ${item.active ? '<span class="active-indicator"></span>' : ''}
        </a>
      </li>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle button
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Menu item clicks
    const menuLinks = this.container.querySelectorAll('.sidebar-menu-link');
    menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const route = link.getAttribute('data-route');
        
        // Handle hash-based navigation (tabs)
        if (route.includes('#')) {
          e.preventDefault();
          const [path, hash] = route.split('#');
          if (path === window.location.pathname || path === '') {
            // Same page, just change hash
            window.location.hash = hash;
            this.updateActiveState();
            
            // Trigger tab switch if on CRM page
            if (typeof switchTab === 'function') {
              switchTab(hash);
            }
          } else {
            // Different page
            window.location.href = route;
          }
        } else {
          // TASK-1.5.1: Handle view switching
          if (item.type === 'view' && item.view) {
            e.preventDefault();
            // Update state manager
            if (typeof crmState !== 'undefined') {
              crmState.setView(item.view);
            }
            // Update active state
            this.updateActiveState();
            // Trigger view change event
            window.dispatchEvent(new CustomEvent('view-changed', { detail: { view: item.view } }));
          } else {
            // Regular navigation
            // Let default behavior handle it
          }
        }
      });
    });

    // Handle hash changes for active state
    window.addEventListener('hashchange', () => {
      this.updateActiveState();
    });

    // Handle window resize for mobile
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Toggle sidebar collapsed state
   */
  toggle() {
    this.options.collapsed = !this.options.collapsed;
    
    // Update state manager
    if (typeof crmState !== 'undefined') {
      crmState.setState('sidebarCollapsed', this.options.collapsed);
    }
    
    this.render();
    this.setupEventListeners();
    
    // Trigger resize event for layout adjustments
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Collapse sidebar
   */
  collapse() {
    if (!this.options.collapsed) {
      this.toggle();
    }
  }

  /**
   * Expand sidebar
   */
  expand() {
    if (this.options.collapsed) {
      this.toggle();
    }
  }

  /**
   * Update active state based on current route
   */
  updateActiveState() {
    const menuLinks = this.container.querySelectorAll('.sidebar-menu-link');
    const currentHash = window.location.hash || '#leads';
    
    menuLinks.forEach(link => {
      const route = link.getAttribute('data-route');
      link.classList.remove('active');
      
      if (route && route.includes('#')) {
        const [, hash] = route.split('#');
        if (hash === currentHash.replace('#', '')) {
          link.classList.add('active');
        }
      } else if (route === window.location.pathname) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Auto-collapse on mobile
    if (window.innerWidth < 768 && !this.options.collapsed) {
      // Don't auto-collapse, let user control it
      // this.collapse();
    }
  }

  /**
   * Add navigation item
   * @param {Object} item - Menu item to add
   */
  addItem(item) {
    this.options.items.push(item);
    this.render();
    this.setupEventListeners();
  }

  /**
   * Remove navigation item
   * @param {string} itemId - ID of item to remove
   */
  removeItem(itemId) {
    this.options.items = this.options.items.filter(item => item.id !== itemId);
    this.render();
    this.setupEventListeners();
  }

  /**
   * Update navigation items
   * @param {Array} items - New navigation items
   */
  updateItems(items) {
    this.options.items = items;
    this.render();
    this.setupEventListeners();
  }

  /**
   * Destroy sidebar
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isInitialized = false;
  }
}

// Create singleton instance (will be initialized when DOM is ready)
let sidebarInstance = null;

/**
 * Initialize sidebar when DOM is ready
 */
function initSidebar() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!sidebarInstance) {
        sidebarInstance = new Sidebar('sidebar');
      }
    });
  } else {
    if (!sidebarInstance) {
      sidebarInstance = new Sidebar('sidebar');
    }
  }
}

// Auto-initialize
initSidebar();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Sidebar, sidebarInstance };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.Sidebar = Sidebar;
  window.sidebarInstance = sidebarInstance;
  window.initSidebar = initSidebar;
}
