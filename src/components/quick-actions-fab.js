/**
 * Quick Actions FAB Component
 * Phase 3: Quick Actions (FAB)
 * Floating action button with context-aware actions
 */

class QuickActionsFAB {
  constructor(options = {}) {
    this.options = {
      position: options.position || 'bottom-right',
      primaryAction: options.primaryAction || 'new-lead',
      ...options
    };
    
    this.isExpanded = false;
    this.actions = this.getActions();
    this.init();
  }

  /**
   * Get context-aware actions
   */
  getActions() {
    const currentPath = window.location.pathname;
    const currentTab = this.getCurrentTab();

    // Base actions available everywhere
    const baseActions = [
      {
        id: 'new-lead',
        label: 'New Lead',
        icon: 'user-plus',
        color: 'blue',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('leads');
            setTimeout(() => {
              const newLeadBtn = document.querySelector('[aria-label="Add new lead"]');
              if (newLeadBtn) newLeadBtn.click();
            }, 100);
          }
        }
      },
      {
        id: 'upload-leads',
        label: 'Upload Leads',
        icon: 'upload',
        color: 'blue',
        action: () => {
          const uploadBtn = document.getElementById('uploadLeadsBtn');
          if (uploadBtn) {
            uploadBtn.click();
          }
        }
      },
      {
        id: 'export',
        label: 'Export Data',
        icon: 'download',
        color: 'success',
        action: () => {
          if (typeof exportReports === 'function') {
            exportReports();
          }
        }
      }
    ];

    // Context-specific actions
    if (currentPath.includes('/crm')) {
      if (currentTab === 'leads') {
        return [
          ...baseActions,
          {
            id: 'filter-leads',
            label: 'Filter Leads',
            icon: 'filter',
            color: 'warning',
            action: () => {
              const filterInput = document.getElementById('leadsFilterDisposition');
              if (filterInput) {
                filterInput.focus();
              }
            }
          },
          {
            id: 'refresh-leads',
            label: 'Refresh',
            icon: 'refresh-cw',
            color: 'secondary',
            action: () => {
              if (typeof loadLeads === 'function') {
                loadLeads();
              }
            }
          }
        ];
      } else if (currentTab === 'customers') {
        return [
          ...baseActions,
          {
            id: 'refresh-customers',
            label: 'Refresh',
            icon: 'refresh-cw',
            color: 'secondary',
            action: () => {
              if (typeof loadCustomers === 'function') {
                loadCustomers();
              }
            }
          }
        ];
      } else if (currentTab === 'dashboard') {
        return [
          {
            id: 'refresh-dashboard',
            label: 'Refresh Dashboard',
            icon: 'refresh-cw',
            color: 'blue',
            action: () => {
              if (window.eliteDashboard && typeof window.eliteDashboard.refresh === 'function') {
                window.eliteDashboard.refresh();
              }
            }
          },
          ...baseActions
        ];
      }
    }

    return baseActions;
  }

  /**
   * Get current active tab
   */
  getCurrentTab() {
    const activeTab = document.querySelector('.admin-tab.active');
    if (activeTab) {
      return activeTab.getAttribute('data-tab');
    }
    return null;
  }

  /**
   * Initialize FAB
   */
  init() {
    this.createFAB();
    this.attachEventListeners();
  }

  /**
   * Create FAB HTML
   */
  createFAB() {
    const fabHTML = `
      <div class="quick-actions-fab ${this.options.position}" id="quickActionsFAB">
        <div class="fab-menu" id="fabMenu" style="display: none;">
          ${this.actions.map((action, index) => `
            <button class="fab-menu-item fab-menu-item-${action.color}" 
                    data-action-id="${action.id}"
                    style="animation-delay: ${index * 50}ms;">
              <i data-lucide="${action.icon}" style="width: 20px; height: 20px;"></i>
              <span class="fab-menu-item-label">${action.label}</span>
            </button>
          `).join('')}
        </div>
        <button class="fab-button" id="fabButton" aria-label="Quick actions">
          <i data-lucide="plus" id="fabIcon" style="width: 24px; height: 24px;"></i>
        </button>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', fabHTML);

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const fabButton = document.getElementById('fabButton');
    const fabMenu = document.getElementById('fabMenu');
    const menuItems = document.querySelectorAll('.fab-menu-item');

    if (fabButton) {
      fabButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isExpanded && !e.target.closest('#quickActionsFAB')) {
        this.close();
      }
    });

    // Handle menu item clicks
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionId = item.getAttribute('data-action-id');
        const action = this.actions.find(a => a.id === actionId);
        if (action && action.action) {
          action.action();
          this.close();
        }
      });
    });
  }

  /**
   * Toggle FAB menu
   */
  toggle() {
    if (this.isExpanded) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open FAB menu
   */
  open() {
    const fabMenu = document.getElementById('fabMenu');
    const fabIcon = document.getElementById('fabIcon');
    const fabButton = document.getElementById('fabButton');

    if (fabMenu && fabIcon && fabButton) {
      this.isExpanded = true;
      fabMenu.style.display = 'flex';
      fabButton.classList.add('expanded');
      
      // Rotate icon
      fabIcon.setAttribute('data-lucide', 'x');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  /**
   * Close FAB menu
   */
  close() {
    const fabMenu = document.getElementById('fabMenu');
    const fabIcon = document.getElementById('fabIcon');
    const fabButton = document.getElementById('fabButton');

    if (fabMenu && fabIcon && fabButton) {
      this.isExpanded = false;
      fabMenu.style.display = 'none';
      fabButton.classList.remove('expanded');
      
      // Rotate icon back
      fabIcon.setAttribute('data-lucide', 'plus');
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  /**
   * Update actions based on context
   */
  updateActions() {
    this.actions = this.getActions();
    const fabMenu = document.getElementById('fabMenu');
    if (fabMenu) {
      fabMenu.innerHTML = this.actions.map((action, index) => `
        <button class="fab-menu-item fab-menu-item-${action.color}" 
                data-action-id="${action.id}"
                style="animation-delay: ${index * 50}ms;">
          <i data-lucide="${action.icon}" style="width: 20px; height: 20px;"></i>
          <span class="fab-menu-item-label">${action.label}</span>
        </button>
      `).join('');
      
      // Reattach event listeners
      this.attachEventListeners();
      
      // Reinitialize icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }
}

// Initialize FAB when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.quickActionsFAB = new QuickActionsFAB();
  });
} else {
  window.quickActionsFAB = new QuickActionsFAB();
}
