/**
 * Command Palette Component
 * Phase 3: Command Palette (Cmd+K)
 * Quick navigation and actions via keyboard
 */

class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredCommands = [];
    this.recentCommands = this.loadRecentCommands();
    this.commands = this.buildCommandRegistry();
    this.init();
  }

  /**
   * Initialize command palette
   */
  init() {
    this.createPalette();
    this.attachKeyboardListeners();
  }

  /**
   * Build command registry
   */
  buildCommandRegistry() {
    return [
      // Navigation Commands
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        description: 'Open dashboard overview',
        category: 'Navigation',
        icon: 'layout-dashboard',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('dashboard');
          } else {
            window.location.href = '/crm#dashboard';
          }
        }
      },
      {
        id: 'nav-leads',
        label: 'Go to Leads',
        description: 'View and manage leads',
        category: 'Navigation',
        icon: 'users',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('leads');
          } else {
            window.location.href = '/crm#leads';
          }
        }
      },
      {
        id: 'nav-customers',
        label: 'Go to Customers',
        description: 'View and manage customers',
        category: 'Navigation',
        icon: 'user-check',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('customers');
          } else {
            window.location.href = '/crm#customers';
          }
        }
      },
      {
        id: 'nav-reports',
        label: 'Go to Reports',
        description: 'View reports and analytics',
        category: 'Navigation',
        icon: 'trending-up',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('reports');
          } else {
            window.location.href = '/crm#reports';
          }
        }
      },
      {
        id: 'nav-admin',
        label: 'Go to Admin',
        description: 'Open admin panel',
        category: 'Navigation',
        icon: 'shield',
        action: () => {
          window.location.href = '/admin';
        }
      },
      {
        id: 'nav-form',
        label: 'Go to Form',
        description: 'Open appliance form',
        category: 'Navigation',
        icon: 'file-text',
        action: () => {
          window.location.href = '/form';
        }
      },
      {
        id: 'nav-processor',
        label: 'Go to Processor',
        description: 'Open processor dashboard',
        category: 'Navigation',
        icon: 'settings',
        action: () => {
          window.location.href = '/processor';
        }
      },
      // Action Commands
      {
        id: 'action-new-lead',
        label: 'New Lead',
        description: 'Create a new lead',
        category: 'Actions',
        icon: 'user-plus',
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
        id: 'action-upload-leads',
        label: 'Upload Leads',
        description: 'Upload leads from file',
        category: 'Actions',
        icon: 'upload',
        action: () => {
          const uploadBtn = document.getElementById('uploadLeadsBtn');
          if (uploadBtn) {
            uploadBtn.click();
          }
        }
      },
      {
        id: 'action-export',
        label: 'Export Data',
        description: 'Export current data',
        category: 'Actions',
        icon: 'download',
        action: () => {
          if (typeof exportReports === 'function') {
            exportReports();
          }
        }
      },
      {
        id: 'action-refresh',
        label: 'Refresh',
        description: 'Refresh current view',
        category: 'Actions',
        icon: 'refresh-cw',
        action: () => {
          if (typeof loadLeads === 'function') {
            loadLeads();
          } else if (typeof loadCustomers === 'function') {
            loadCustomers();
          } else {
            window.location.reload();
          }
        }
      },
      // Search Commands
      {
        id: 'search-leads',
        label: 'Search Leads',
        description: 'Search through leads',
        category: 'Search',
        icon: 'search',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('leads');
            setTimeout(() => {
              const searchInput = document.getElementById('leadsSearch');
              if (searchInput) {
                searchInput.focus();
              }
            }, 100);
          }
        }
      },
      {
        id: 'search-customers',
        label: 'Search Customers',
        description: 'Search through customers',
        category: 'Search',
        icon: 'search',
        action: () => {
          if (typeof switchTab === 'function') {
            switchTab('customers');
            setTimeout(() => {
              const searchInput = document.getElementById('customersSearch');
              if (searchInput) {
                searchInput.focus();
              }
            }, 100);
          }
        }
      }
    ];
  }

  /**
   * Create command palette HTML
   */
  createPalette() {
    const paletteHTML = `
      <div class="command-palette-overlay" id="commandPaletteOverlay" style="display: none;">
        <div class="command-palette-modal" id="commandPaletteModal">
          <div class="command-palette-header">
            <div class="command-palette-search-wrapper">
              <i data-lucide="search" style="width: 20px; height: 20px; color: var(--text-tertiary);"></i>
              <input 
                type="text" 
                id="commandPaletteInput" 
                class="command-palette-input" 
                placeholder="Type a command or search..."
                autocomplete="off"
                spellcheck="false"
              />
            </div>
            <div class="command-palette-shortcut">
              <kbd>⌘</kbd><kbd>K</kbd>
            </div>
          </div>
          <div class="command-palette-body" id="commandPaletteBody">
            <!-- Commands will be rendered here -->
          </div>
          <div class="command-palette-footer">
            <div class="command-palette-hint">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Select</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', paletteHTML);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Attach input event listener
    const input = document.getElementById('commandPaletteInput');
    if (input) {
      input.addEventListener('input', (e) => {
        this.filterCommands(e.target.value);
      });

      input.addEventListener('keydown', (e) => {
        this.handleInputKeydown(e);
      });
    }

    // Close on overlay click
    const overlay = document.getElementById('commandPaletteOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }
  }

  /**
   * Filter commands based on search query
   */
  filterCommands(query = '') {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      // Show recent commands first, then all commands
      this.filteredCommands = [
        ...this.recentCommands.map(id => this.commands.find(cmd => cmd.id === id)).filter(Boolean),
        ...this.commands.filter(cmd => !this.recentCommands.includes(cmd.id))
      ];
    } else {
      // Filter by label or description
      this.filteredCommands = this.commands.filter(cmd => {
        const labelMatch = cmd.label.toLowerCase().includes(normalizedQuery);
        const descMatch = cmd.description.toLowerCase().includes(normalizedQuery);
        const categoryMatch = cmd.category.toLowerCase().includes(normalizedQuery);
        return labelMatch || descMatch || categoryMatch;
      });
    }

    this.selectedIndex = 0;
    this.renderCommands();
  }

  /**
   * Render filtered commands
   */
  renderCommands() {
    const body = document.getElementById('commandPaletteBody');
    if (!body) return;

    if (this.filteredCommands.length === 0) {
      body.innerHTML = `
        <div class="command-palette-empty">
          <i data-lucide="search-x" style="width: 48px; height: 48px; color: var(--text-tertiary);"></i>
          <p>No commands found</p>
        </div>
      `;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
      return;
    }

    // Group by category
    const grouped = {};
    this.filteredCommands.forEach(cmd => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });

    let html = '';
    Object.keys(grouped).forEach(category => {
      html += `<div class="command-palette-category">${category}</div>`;
      grouped[category].forEach((cmd, index) => {
        const globalIndex = this.filteredCommands.indexOf(cmd);
        const isSelected = globalIndex === this.selectedIndex;
        html += `
          <div class="command-palette-item ${isSelected ? 'selected' : ''}" 
               data-index="${globalIndex}" 
               data-command-id="${cmd.id}">
            <div class="command-palette-item-icon">
              <i data-lucide="${cmd.icon}" style="width: 18px; height: 18px;"></i>
            </div>
            <div class="command-palette-item-content">
              <div class="command-palette-item-label">${cmd.label}</div>
              <div class="command-palette-item-description">${cmd.description}</div>
            </div>
            ${this.recentCommands.includes(cmd.id) ? '<div class="command-palette-item-badge">Recent</div>' : ''}
          </div>
        `;
      });
    });

    body.innerHTML = html;

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Scroll selected item into view
    const selectedItem = body.querySelector('.command-palette-item.selected');
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Handle keyboard input
   */
  handleInputKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
        this.renderCommands();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.renderCommands();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.filteredCommands[this.selectedIndex]) {
          this.executeCommand(this.filteredCommands[this.selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  /**
   * Execute selected command
   */
  executeCommand(command) {
    if (!command || !command.action) return;

    // Add to recent commands
    this.addToRecent(command.id);

    // Execute action
    try {
      command.action();
    } catch (error) {
      console.error('Error executing command:', error);
    }

    // Close palette
    this.close();
  }

  /**
   * Add command to recent list
   */
  addToRecent(commandId) {
    // Remove if already exists
    this.recentCommands = this.recentCommands.filter(id => id !== commandId);
    // Add to front
    this.recentCommands.unshift(commandId);
    // Keep only last 5
    this.recentCommands = this.recentCommands.slice(0, 5);
    // Save to localStorage
    this.saveRecentCommands();
  }

  /**
   * Load recent commands from localStorage
   */
  loadRecentCommands() {
    try {
      const stored = localStorage.getItem('commandPaletteRecent');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save recent commands to localStorage
   */
  saveRecentCommands() {
    try {
      localStorage.setItem('commandPaletteRecent', JSON.stringify(this.recentCommands));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Open command palette
   */
  open() {
    const overlay = document.getElementById('commandPaletteOverlay');
    const input = document.getElementById('commandPaletteInput');
    
    if (overlay && input) {
      this.isOpen = true;
      overlay.style.display = 'flex';
      input.value = '';
      input.focus();
      this.filterCommands('');
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close command palette
   */
  close() {
    const overlay = document.getElementById('commandPaletteOverlay');
    const input = document.getElementById('commandPaletteInput');
    
    if (overlay && input) {
      this.isOpen = false;
      overlay.style.display = 'none';
      input.value = '';
      this.selectedIndex = 0;
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  /**
   * Toggle command palette
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Attach keyboard listeners
   */
  attachKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      
      // Escape to close
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }
}

// Initialize command palette when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.commandPalette = new CommandPalette();
  });
} else {
  window.commandPalette = new CommandPalette();
}
