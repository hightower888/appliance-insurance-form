/**
 * Keyboard Shortcuts Service (Phase 3 Additional)
 * Global keyboard shortcuts for common actions
 */

class KeyboardShortcutsService {
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false, // Default enabled
      showHelp: options.showHelp !== false,
      ...options
    };

    this.shortcuts = new Map();
    this.helpDialog = null;
    this.isHelpVisible = false;
    
    // Default shortcuts
    this.registerDefaultShortcuts();
    
    // Setup global listener
    if (this.options.enabled) {
      this.setupGlobalListener();
    }
  }

  /**
   * Register default shortcuts
   */
  registerDefaultShortcuts() {
    // Search (Ctrl+K or Cmd+K)
    this.register('search', {
      key: 'k',
      ctrl: true,
      meta: true, // Cmd on Mac
      description: 'Open search',
      handler: () => {
        const searchInput = document.getElementById('leadsSearch') || document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // New lead (Ctrl+N or Cmd+N)
    this.register('newLead', {
      key: 'n',
      ctrl: true,
      meta: true,
      description: 'Create new lead',
      handler: () => {
        if (typeof showManualEntryForm === 'function') {
          showManualEntryForm();
        }
      }
    });

    // Save (Ctrl+S or Cmd+S)
    this.register('save', {
      key: 's',
      ctrl: true,
      meta: true,
      description: 'Save current changes',
      handler: () => {
        if (typeof saveLead === 'function' && typeof isEditMode !== 'undefined' && isEditMode) {
          saveLead();
        }
      }
    });

    // Close modal (Escape)
    this.register('closeModal', {
      key: 'Escape',
      description: 'Close modal/dialog',
      handler: () => {
        const modals = document.querySelectorAll('.modal[style*="block"]');
        modals.forEach(modal => {
          if (typeof closeLeadDetailModal === 'function' && modal.id === 'leadDetailModal') {
            closeLeadDetailModal();
          } else if (typeof closeUploadModal === 'function' && modal.id === 'uploadLeadsModal') {
            closeUploadModal();
          } else {
            modal.style.display = 'none';
          }
        });
      }
    });

    // Next lead (Arrow Right)
    this.register('nextLead', {
      key: 'ArrowRight',
      description: 'Navigate to next lead',
      condition: () => {
        // Only if on leads tab and modal not open
        return typeof currentTab !== 'undefined' && currentTab === 'leads' && 
               (!document.getElementById('leadDetailModal') || 
                document.getElementById('leadDetailModal').style.display !== 'block');
      },
      handler: () => {
        if (typeof cycleToNextLead === 'function') {
          cycleToNextLead();
        }
      }
    });

    // Previous lead (Arrow Left)
    this.register('previousLead', {
      key: 'ArrowLeft',
      description: 'Navigate to previous lead',
      condition: () => {
        return typeof currentTab !== 'undefined' && currentTab === 'leads' && 
               (!document.getElementById('leadDetailModal') || 
                document.getElementById('leadDetailModal').style.display !== 'block');
      },
      handler: () => {
        if (typeof cycleToPreviousLead === 'function') {
          cycleToPreviousLead();
        }
      }
    });

    // Help (Ctrl+? or Cmd+?)
    this.register('help', {
      key: '?',
      ctrl: true,
      meta: true,
      shift: true,
      description: 'Show keyboard shortcuts help',
      handler: () => {
        this.showHelp();
      }
    });

    // Refresh (Ctrl+R or Cmd+R) - but prevent default page reload
    this.register('refresh', {
      key: 'r',
      ctrl: true,
      meta: true,
      description: 'Refresh data',
      handler: (e) => {
        e.preventDefault();
        if (typeof loadLeads === 'function') {
          loadLeads();
        }
      }
    });
  }

  /**
   * Register a keyboard shortcut
   * @param {string} id - Shortcut ID
   * @param {Object} config - Shortcut configuration
   */
  register(id, config) {
    const shortcut = {
      id,
      key: config.key,
      ctrl: config.ctrl || false,
      meta: config.meta || false,
      shift: config.shift || false,
      alt: config.alt || false,
      description: config.description || '',
      handler: config.handler || (() => {}),
      condition: config.condition || (() => true), // Optional condition function
      ...config
    };

    this.shortcuts.set(id, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   * @param {string} id - Shortcut ID
   */
  unregister(id) {
    this.shortcuts.delete(id);
  }

  /**
   * Setup global keyboard listener
   */
  setupGlobalListener() {
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    // Don't handle if typing in input/textarea/select
    if (e.target.matches('input, textarea, select') && 
        !e.target.matches('input[type="search"], input[type="text"][id*="search"]')) {
      return;
    }

    // Check each registered shortcut
    for (const [id, shortcut] of this.shortcuts) {
      if (this.matchesShortcut(e, shortcut)) {
        // Check condition
        if (shortcut.condition && !shortcut.condition()) {
          continue;
        }

        // Prevent default if needed
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }

        // Execute handler
        try {
          shortcut.handler(e);
        } catch (error) {
          console.error(`KeyboardShortcuts: Error executing shortcut ${id}:`, error);
        }

        // Only handle one shortcut per keypress
        break;
      }
    }
  }

  /**
   * Check if event matches shortcut
   * @param {KeyboardEvent} e - Keyboard event
   * @param {Object} shortcut - Shortcut configuration
   * @returns {boolean} True if matches
   */
  matchesShortcut(e, shortcut) {
    // Check key
    if (e.key !== shortcut.key) {
      return false;
    }

    // Check modifiers
    const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
    const metaMatch = shortcut.meta ? (e.ctrlKey || e.metaKey) : true; // Meta is same as Ctrl for cross-platform
    const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
    const altMatch = shortcut.alt ? e.altKey : !e.altKey;

    return ctrlMatch && metaMatch && shiftMatch && altMatch;
  }

  /**
   * Show help dialog
   */
  showHelp() {
    if (this.isHelpVisible) {
      this.hideHelp();
      return;
    }

    const helpHtml = `
      <div class="keyboard-shortcuts-help" id="keyboardShortcutsHelp">
        <div class="help-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="help-close" onclick="window.keyboardShortcutsService?.hideHelp()">×</button>
        </div>
        <div class="help-content">
          <table class="shortcuts-table">
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from(this.shortcuts.values())
                .filter(s => s.description) // Only show shortcuts with descriptions
                .map(shortcut => `
                  <tr>
                    <td class="shortcut-keys">
                      ${this.formatShortcutKeys(shortcut)}
                    </td>
                    <td>${this.escapeHtml(shortcut.description)}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        <div class="help-footer">
          <button class="btn btn-primary" onclick="window.keyboardShortcutsService?.hideHelp()">Close</button>
        </div>
      </div>
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'keyboard-shortcuts-overlay';
    overlay.innerHTML = helpHtml;
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.hideHelp();
      }
    };

    document.body.appendChild(overlay);
    this.helpDialog = overlay;
    this.isHelpVisible = true;

    // Store reference
    if (typeof window !== 'undefined') {
      window.keyboardShortcutsService = this;
    }
  }

  /**
   * Hide help dialog
   */
  hideHelp() {
    if (this.helpDialog && this.helpDialog.parentNode) {
      this.helpDialog.parentNode.removeChild(this.helpDialog);
      this.helpDialog = null;
      this.isHelpVisible = false;
    }
  }

  /**
   * Format shortcut keys for display
   * @param {Object} shortcut - Shortcut configuration
   * @returns {string} Formatted keys
   */
  formatShortcutKeys(shortcut) {
    const parts = [];
    
    if (shortcut.ctrl || shortcut.meta) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
      parts.push('Shift');
    }
    if (shortcut.alt) {
      parts.push('Alt');
    }
    
    // Format key
    let key = shortcut.key;
    if (key === 'ArrowRight') key = '→';
    else if (key === 'ArrowLeft') key = '←';
    else if (key === 'ArrowUp') key = '↑';
    else if (key === 'ArrowDown') key = '↓';
    else if (key === 'Escape') key = 'Esc';
    else if (key === ' ') key = 'Space';
    else key = key.toUpperCase();
    
    parts.push(key);
    
    return parts.join(' + ');
  }

  /**
   * Enable shortcuts
   */
  enable() {
    this.options.enabled = true;
    this.setupGlobalListener();
  }

  /**
   * Disable shortcuts
   */
  disable() {
    this.options.enabled = false;
    // Note: Can't easily remove event listener, but handlers will check enabled state
  }

  /**
   * Get all registered shortcuts
   * @returns {Array} Array of shortcut objects
   */
  getShortcuts() {
    return Array.from(this.shortcuts.values());
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
const keyboardShortcutsService = new KeyboardShortcutsService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KeyboardShortcutsService, keyboardShortcutsService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.KeyboardShortcutsService = KeyboardShortcutsService;
  window.keyboardShortcutsService = keyboardShortcutsService;
}
