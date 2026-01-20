/**
 * Bulk Selection Component
 * Select multiple records for bulk operations
 */

class BulkSelection {
  constructor(options = {}) {
    this.options = {
      containerSelector: null,
      rowSelector: 'tr',
      checkboxSelector: '.bulk-select-checkbox',
      selectAllSelector: '.bulk-select-all',
      onSelectionChange: null,
      ...options
    };

    this.selectedItems = new Set();
    this.isInitialized = false;

    // Get initial selection from state manager if available
    if (typeof crmState !== 'undefined') {
      const stateSelection = crmState.getState('selectedItems');
      if (Array.isArray(stateSelection)) {
        this.selectedItems = new Set(stateSelection);
      }
    }

    this.init();
  }

  /**
   * Initialize bulk selection
   */
  init() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.updateUI();
    this.isInitialized = true;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Select all checkbox
    const selectAll = document.querySelector(this.options.selectAllSelector);
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectAll();
        } else {
          this.deselectAll();
        }
      });
    }

    // Individual checkboxes
    document.addEventListener('change', (e) => {
      if (e.target.matches && e.target.matches(this.options.checkboxSelector)) {
        const itemId = e.target.getAttribute('data-item-id');
        if (itemId) {
          if (e.target.checked) {
            this.select(itemId);
          } else {
            this.deselect(itemId);
          }
        }
      }
    });
  }

  /**
   * Select an item
   * @param {string} itemId - Item ID to select
   */
  select(itemId) {
    this.selectedItems.add(itemId);
    this.updateState();
    this.updateUI();
    this.notifySelectionChange();
  }

  /**
   * Deselect an item
   * @param {string} itemId - Item ID to deselect
   */
  deselect(itemId) {
    this.selectedItems.delete(itemId);
    this.updateState();
    this.updateUI();
    this.notifySelectionChange();
  }

  /**
   * Toggle item selection
   * @param {string} itemId - Item ID to toggle
   */
  toggle(itemId) {
    if (this.selectedItems.has(itemId)) {
      this.deselect(itemId);
    } else {
      this.select(itemId);
    }
  }

  /**
   * Select all items
   */
  selectAll() {
    const checkboxes = document.querySelectorAll(this.options.checkboxSelector);
    checkboxes.forEach(checkbox => {
      const itemId = checkbox.getAttribute('data-item-id');
      if (itemId) {
        this.selectedItems.add(itemId);
        checkbox.checked = true;
      }
    });
    this.updateState();
    this.updateUI();
    this.notifySelectionChange();
  }

  /**
   * Deselect all items
   */
  deselectAll() {
    this.selectedItems.clear();
    const checkboxes = document.querySelectorAll(this.options.checkboxSelector);
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    this.updateState();
    this.updateUI();
    this.notifySelectionChange();
  }

  /**
   * Check if item is selected
   * @param {string} itemId - Item ID to check
   * @returns {boolean}
   */
  isSelected(itemId) {
    return this.selectedItems.has(itemId);
  }

  /**
   * Get selected items
   * @returns {Array} Array of selected item IDs
   */
  getSelected() {
    return Array.from(this.selectedItems);
  }

  /**
   * Get selected count
   * @returns {number}
   */
  getSelectedCount() {
    return this.selectedItems.size;
  }

  /**
   * Update state manager
   */
  updateState() {
    if (typeof crmState !== 'undefined') {
      crmState.setState('selectedItems', this.getSelected());
    }
  }

  /**
   * Update UI
   */
  updateUI() {
    // Update select all checkbox
    const selectAll = document.querySelector(this.options.selectAllSelector);
    if (selectAll) {
      const checkboxes = document.querySelectorAll(this.options.checkboxSelector);
      const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
      selectAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
      selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
    }

    // Update individual checkboxes
    const checkboxes = document.querySelectorAll(this.options.checkboxSelector);
    checkboxes.forEach(checkbox => {
      const itemId = checkbox.getAttribute('data-item-id');
      if (itemId) {
        checkbox.checked = this.selectedItems.has(itemId);
      }
    });

    // Update selection counter if exists
    const counter = document.getElementById('bulkSelectionCounter');
    if (counter) {
      const count = this.getSelectedCount();
      counter.textContent = count > 0 ? `${count} selected` : '';
      counter.style.display = count > 0 ? 'inline' : 'none';
    }

    // Update toolbar
    this.updateToolbar();
  }

  /**
   * Create bulk actions toolbar
   */
  createBulkActionsToolbar() {
    // Check if toolbar already exists
    if (document.getElementById('bulkActionsToolbar')) {
      return;
    }

    // Find container (usually near the table or filter area)
    const container = this.options.containerSelector 
      ? document.querySelector(this.options.containerSelector)
      : document.querySelector('.admin-tab-content') || document.querySelector('.main-content') || document.body;

    if (!container) return;

    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'bulkActionsToolbar';
    toolbar.className = 'bulk-actions-toolbar';
    toolbar.style.display = 'none';
    toolbar.innerHTML = `
      <div class="bulk-actions-info">
        <span class="bulk-actions-count" id="bulkActionsCount">0 selected</span>
      </div>
      <div class="bulk-actions-buttons">
        <button class="btn btn-secondary btn-sm" id="bulkActionsExportBtn" title="Export selected items">
          📥 Export Selected
        </button>
        <button class="btn btn-danger btn-sm" id="bulkActionsDeleteBtn" title="Delete selected items">
          🗑️ Delete Selected
        </button>
        <button class="btn btn-outline btn-sm" id="bulkActionsClearBtn" title="Clear selection">
          Clear Selection
        </button>
      </div>
    `;

    // Insert toolbar (before table or at top of container)
    const table = container.querySelector('table');
    if (table) {
      table.parentNode.insertBefore(toolbar, table);
    } else {
      container.insertBefore(toolbar, container.firstChild);
    }

    // Setup toolbar listeners
    this.setupToolbarListeners();
  }

  /**
   * Setup toolbar event listeners
   */
  setupToolbarListeners() {
    // Export selected button
    const exportBtn = document.getElementById('bulkActionsExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const selected = this.getSelected();
        if (selected.length > 0 && this.options.onExportSelected) {
          this.options.onExportSelected(selected);
        }
      });
    }

    // Delete selected button
    const deleteBtn = document.getElementById('bulkActionsDeleteBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const selected = this.getSelected();
        if (selected.length > 0 && this.options.onDeleteSelected) {
          this.options.onDeleteSelected(selected);
        }
      });
    }

    // Clear selection button
    const clearBtn = document.getElementById('bulkActionsClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clear();
      });
    }
  }

  /**
   * Update toolbar
   */
  updateToolbar() {
    const toolbar = document.getElementById('bulkActionsToolbar');
    const countEl = document.getElementById('bulkActionsCount');
    const count = this.getSelectedCount();

    if (toolbar) {
      toolbar.style.display = count > 0 ? 'flex' : 'none';
    }

    if (countEl) {
      countEl.textContent = `${count} item${count === 1 ? '' : 's'} selected`;
    }
  }

  /**
   * Notify selection change
   */
  notifySelectionChange() {
    if (this.options.onSelectionChange && typeof this.options.onSelectionChange === 'function') {
      this.options.onSelectionChange(this.getSelected(), this.getSelectedCount());
    }
  }

  /**
   * Add checkbox column to table
   * @param {HTMLElement} table - Table element
   * @param {Function} getIdFn - Function to get ID from row data
   */
  addCheckboxColumn(table, getIdFn) {
    if (!table) return;

    // Add checkbox to header
    const header = table.querySelector('thead tr');
    if (header) {
      const th = document.createElement('th');
      th.style.width = '40px';
      th.innerHTML = `
        <input type="checkbox" class="bulk-select-all" id="bulkSelectAll" 
               title="Select all">
      `;
      header.insertBefore(th, header.firstChild);
    }

    // Add checkbox to each row
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
      const td = document.createElement('td');
      td.style.width = '40px';
      td.style.textAlign = 'center';
      
      // Get item ID from row
      let itemId = null;
      if (getIdFn && typeof getIdFn === 'function') {
        itemId = getIdFn(row, index);
      } else {
        // Try to get from data attribute
        itemId = row.getAttribute('data-id') || row.getAttribute('data-lead-id') || row.getAttribute('data-customer-id');
      }

      if (itemId) {
        td.innerHTML = `
          <input type="checkbox" class="bulk-select-checkbox" 
                 data-item-id="${itemId}"
                 ${this.isSelected(itemId) ? 'checked' : ''}>
        `;
        row.insertBefore(td, row.firstChild);
      }
    });

    this.setupEventListeners();
    this.updateUI();
  }

  /**
   * Clear selection
   */
  clear() {
    this.deselectAll();
  }

  /**
   * Set selected items
   * @param {Array} itemIds - Array of item IDs to select
   */
  setSelected(itemIds) {
    this.selectedItems = new Set(itemIds);
    this.updateState();
    this.updateUI();
    this.notifySelectionChange();
  }
}

// Create singleton instance
const bulkSelection = new BulkSelection({
  selectAllSelector: '#bulkSelectAll',
  checkboxSelector: '.bulk-select-checkbox',
  onSelectionChange: (selected, count) => {
    // Update state manager
    if (typeof crmState !== 'undefined') {
      crmState.setState('selectedItems', selected);
    }
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BulkSelection, bulkSelection };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.bulkSelection = bulkSelection;
  window.BulkSelection = BulkSelection;
}
