/**
 * Table View Component (TASK-2.11.1)
 * Table view implementation extending ViewController
 */

class TableView extends ViewController {
  constructor(container, data = [], options = {}) {
    super('table', container, data, options);
    
    this.columns = options.columns || [];
    this.editableFields = options.editableFields || [];
    this.onRowClick = options.onRowClick || null;
    this.onCellEdit = options.onCellEdit || null;
    this.enableVirtualScrolling = options.enableVirtualScrolling || false;
    this.virtualScrollingService = null;
    
    // Initialize virtual scrolling if enabled
    if (this.enableVirtualScrolling && typeof VirtualScrollingService !== 'undefined') {
      this.initVirtualScrolling();
    }
  }
  
  /**
   * Initialize virtual scrolling
   */
  initVirtualScrolling() {
    if (!this.container) return;
    
    // Create scrollable container
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'table-view-virtual-scroll';
    scrollContainer.style.height = '600px';
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.style.position = 'relative';
    
    this.virtualScrollingService = new VirtualScrollingService(scrollContainer, {
      itemHeight: 50, // Approximate row height
      buffer: 5,
      renderItem: (item, index) => {
        return this.renderTableRow(item, index);
      }
    });
  }

  /**
   * Render the table view
   */
  render() {
    if (!this.container) return;

    const filteredData = this.applyFilters(this.data);
    const sortedData = this.applySorting(filteredData);
    const { paginatedData, totalPages, currentPage, totalItems } = this.applyPagination(sortedData);

    this.container.innerHTML = `
      <div class="table-view-container">
        <div class="table-view-header">
          <div class="table-view-info">
            <span>Showing ${paginatedData.length} of ${totalItems} items</span>
          </div>
          <div class="table-view-actions">
            <button class="btn btn-sm btn-secondary" id="refreshTable">Refresh</button>
          </div>
        </div>
        
        <div class="table-view-content">
          ${this.renderTable(paginatedData)}
        </div>
        
        ${this.renderPagination(totalPages, currentPage, totalItems)}
      </div>
    `;

    this.setupEventListeners();
    this.isRendered = true;
  }

  /**
   * Render table
   * @param {Array} data - Data to render
   * @returns {string} HTML string
   */
  renderTable(data) {
    if (data.length === 0) {
      return this.showEmpty('No data available');
    }

    // Check if mobile view (window width < 768px)
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Render mobile card view
      return this.renderMobileCards(data);
    }

    // Desktop table view
    return `
      <div class="table-wrapper" style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              ${this.columns.map(col => this.renderHeaderCell(col)).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => this.renderRow(item, index)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render mobile card view
   * @param {Array} data - Data to render
   * @returns {string} HTML string
   */
  renderMobileCards(data) {
    return `
      <div class="table-mobile-cards">
        ${data.map((item, index) => {
          const rowId = item.id || `row-${index}`;
          const onClick = this.onRowClick ? `onclick="this.closest('.table-view-container').__tableView?.handleRowClick('${rowId}')"` : '';
          
          return `
            <div class="table-mobile-card" ${onClick} style="cursor: ${this.onRowClick ? 'pointer' : 'default'};">
              <div class="table-mobile-card-header">
                ${this.getPrimaryFieldValue(item)}
              </div>
              ${this.columns.slice(0, 4).map(col => {
                const field = col.field;
                const value = this.getNestedValue(item, field);
                const displayValue = col.formatter ? col.formatter(value, item) : this.formatValue(value);
                return `
                  <div class="table-mobile-card-row">
                    <span class="table-mobile-card-label">${col.label || field}:</span>
                    <span class="table-mobile-card-value">${this.escapeHtml(String(displayValue || ''))}</span>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Get primary field value for mobile card header
   * @param {Object} item - Data item
   * @returns {string} Primary value
   */
  getPrimaryFieldValue(item) {
    // Try to find name or first column value
    for (const col of this.columns) {
      const field = col.field;
      const value = this.getNestedValue(item, field);
      if (value && (field.includes('name') || field.includes('Name'))) {
        return this.escapeHtml(String(value));
      }
    }
    // Fallback to first column
    if (this.columns.length > 0) {
      const value = this.getNestedValue(item, this.columns[0].field);
      return this.escapeHtml(String(value || 'Item'));
    }
    return 'Item';
  }

  /**
   * Render header cell
   * @param {Object} column - Column configuration
   * @returns {string} HTML string
   */
  renderHeaderCell(column) {
    const sortable = column.sortable !== false;
    const sortClass = sortable ? 'sortable' : '';
    const sortIndicator = this.getSortIndicator(column.field);
    
    return `
      <th class="${sortClass}" 
          ${sortable ? `onclick="this.closest('.table-view-container').__tableView?.sortBy('${column.field}')"` : ''}
          style="${sortable ? 'cursor: pointer; user-select: none;' : ''}">
        ${column.label || column.field}
        ${sortIndicator}
      </th>
    `;
  }

  /**
   * Get sort indicator
   * @param {string} field - Field name
   * @returns {string} HTML string
   */
  getSortIndicator(field) {
    if (this.options.sort.field === field) {
      return this.options.sort.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return ' ⇅';
  }

  /**
   * Render table row
   * @param {Object} item - Data item
   * @param {number} index - Row index
   * @returns {string} HTML string
   */
  renderRow(item, index) {
    const rowId = item.id || `row-${index}`;
    const onClick = this.onRowClick ? `onclick="this.closest('.table-view-container').__tableView?.handleRowClick('${rowId}')"` : '';
    
    return `
      <tr data-row-id="${rowId}" ${onClick} style="cursor: ${this.onRowClick ? 'pointer' : 'default'};">
        ${this.columns.map(col => this.renderCell(item, col)).join('')}
      </tr>
    `;
  }

  /**
   * Render table cell
   * @param {Object} item - Data item
   * @param {Object} column - Column configuration
   * @returns {string} HTML string
   */
  renderCell(item, column) {
    const field = column.field;
    const value = this.getNestedValue(item, field);
    const formattedValue = column.formatter ? column.formatter(value, item) : this.formatValue(value);
    const isEditable = this.editableFields.includes(field);
    const editableClass = isEditable ? 'editable-cell' : '';
    const dataAttrs = isEditable ? `data-field-path="${field}" data-value="${this.escapeHtml(String(value || ''))}"` : '';

    return `
      <td class="${editableClass}" ${dataAttrs}>
        ${formattedValue}
      </td>
    `;
  }

  /**
   * Format value for display
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (value === null || value === undefined) {
      return '<em>—</em>';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return this.escapeHtml(String(value));
  }

  /**
   * Escape HTML
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Render pagination
   * @param {number} totalPages - Total pages
   * @param {number} currentPage - Current page
   * @param {number} totalItems - Total items
   * @returns {string} HTML string
   */
  renderPagination(totalPages, currentPage, totalItems) {
    if (totalPages <= 1) return '';

    return `
      <div class="table-view-pagination">
        <button class="btn btn-sm btn-secondary" 
                id="tablePrevBtn" 
                ${currentPage === 1 ? 'disabled' : ''}>
          ← Previous
        </button>
        <span class="pagination-info">
          Page ${currentPage} of ${totalPages} (${totalItems} items)
        </span>
        <button class="btn btn-sm btn-secondary" 
                id="tableNextBtn" 
                ${currentPage === totalPages ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    `;
  }

  /**
   * Handle row click
   * @param {number} index - Row index
   */
  handleRowClick(index) {
    if (this.onRowClick && typeof this.onRowClick === 'function') {
      const filteredData = this.applyFilters(this.data);
      const sortedData = this.applySorting(filteredData);
      const item = sortedData[index];
      if (item) {
        this.onRowClick(item, index);
      }
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Store reference for event handlers
    const container = this.container.querySelector('.table-view-container');
    if (container) {
      container.__tableView = this;
    }
    // Store reference for event handlers
    if (this.container) {
      const container = this.container.querySelector('.table-view-container');
      if (container) {
        container.__tableView = this;
      }
    }

    // Pagination
    const prevBtn = this.container.querySelector('#tablePrevBtn');
    const nextBtn = this.container.querySelector('#tableNextBtn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.options.currentPage > 1) {
          this.options.currentPage--;
          this.render();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const { totalPages } = this.applyPagination(this.applySorting(this.applyFilters(this.data)));
        if (this.options.currentPage < totalPages) {
          this.options.currentPage++;
          this.render();
        }
      });
    }

    // Refresh
    const refreshBtn = this.container.querySelector('#refreshTable');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.render();
      });
    }

    // Inline editing (if inline editor is available)
    if (typeof inlineEditor !== 'undefined') {
      const editableCells = this.container.querySelectorAll('.editable-cell');
      editableCells.forEach(cell => {
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          const fieldPath = cell.getAttribute('data-field-path');
          const value = cell.getAttribute('data-value');
          
          if (this.onCellEdit) {
            inlineEditor.makeEditable(cell, {
              fieldPath: fieldPath,
              value: value,
              type: 'text',
              onSave: (fieldPath, newValue, oldValue) => {
                this.onCellEdit(fieldPath, newValue, oldValue, cell);
              }
            });
          }
        });
      });
    }
  }

  /**
   * Sort by field
   * @param {string} field - Field to sort by
   */
  sortBy(field) {
    if (this.options.sort.field === field) {
      // Toggle direction
      this.options.sort.direction = this.options.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.options.sort.field = field;
      this.options.sort.direction = 'asc';
    }

    // Update state manager
    if (typeof crmState !== 'undefined') {
      crmState.setState('sort', { ...this.options.sort });
    }

    this.render();
  }

  /**
   * Handle row click
   * @param {string} rowId - Row ID
   */
  handleRowClick(rowId) {
    if (this.onRowClick) {
      const item = this.data.find(d => (d.id || `row-${this.data.indexOf(d)}`) === rowId);
      if (item) {
        this.onRowClick(item, rowId);
      }
    }
  }

  /**
   * Set columns
   * @param {Array} columns - Column configurations
   */
  setColumns(columns) {
    this.columns = columns;
    this.render();
  }

  /**
   * Set editable fields
   * @param {Array} fields - Field paths that are editable
   */
  setEditableFields(fields) {
    this.editableFields = fields;
    this.render();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TableView };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.TableView = TableView;
}
