/**
 * Kanban View Component (TASK-2.12.1)
 * Kanban board view with drag-and-drop functionality
 */

class KanbanView extends ViewController {
  constructor(container, data = [], options = {}) {
    super('kanban', container, data, options);
    
    this.statusField = options.statusField || 'leadStatus';
    this.columns = options.columns || this.getDefaultColumns();
    this.onCardMove = options.onCardMove || null;
    this.onCardClick = options.onCardClick || null;
    this.cardRenderer = options.cardRenderer || null;
    this.draggedCard = null;
    this.dragOverColumn = null;
  }

  /**
   * Get default columns based on status field
   * @returns {Array} Column configurations
   */
  getDefaultColumns() {
    if (this.statusField === 'leadStatus') {
      return [
        { id: 'new', label: 'New', status: 'new' },
        { id: 'contacted', label: 'Contacted', status: 'contacted' },
        { id: 'dispositioned', label: 'Dispositioned', status: 'dispositioned' },
        { id: 'converted', label: 'Converted', status: 'converted' }
      ];
    } else if (this.statusField === 'disposition') {
      return [
        { id: 'interested', label: 'Interested', status: 'interested' },
        { id: 'call_back', label: 'Call Back', status: 'call_back' },
        { id: 'not_interested', label: 'Not Interested', status: 'not_interested' },
        { id: 'no_answer', label: 'No Answer', status: 'no_answer' },
        { id: 'other', label: 'Other', status: 'other' }
      ];
    }
    return [];
  }

  /**
   * Render the kanban view
   */
  render() {
    if (!this.container) return;

    const filteredData = this.applyFilters(this.data);
    const groupedData = this.groupByStatus(filteredData);

    this.container.innerHTML = `
      <div class="kanban-view-container">
        <div class="kanban-view-header">
          <h3>Kanban Board</h3>
          <div class="kanban-view-actions">
            <button class="btn btn-sm btn-secondary" id="refreshKanban">Refresh</button>
          </div>
        </div>
        
        <div class="kanban-board">
          ${this.columns.map(col => this.renderColumn(col, groupedData[col.id] || [])).join('')}
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.isRendered = true;
  }

  /**
   * Group data by status
   * @param {Array} data - Data to group
   * @returns {Object} Grouped data by column ID
   */
  groupByStatus(data) {
    const grouped = {};
    
    this.columns.forEach(col => {
      grouped[col.id] = [];
    });

    data.forEach(item => {
      const status = this.getNestedValue(item, this.statusField);
      const column = this.columns.find(col => col.status === status || col.id === status);
      
      if (column) {
        grouped[column.id].push(item);
      } else {
        // Add to first column if no match
        if (this.columns.length > 0) {
          grouped[this.columns[0].id].push(item);
        }
      }
    });

    return grouped;
  }

  /**
   * Render kanban column
   * @param {Object} column - Column configuration
   * @param {Array} items - Items in this column
   * @returns {string} HTML string
   */
  renderColumn(column, items) {
    return `
      <div class="kanban-column" 
           data-column-id="${column.id}"
           ondrop="event.preventDefault(); this.closest('.kanban-view-container').__kanbanView?.handleDrop(event, '${column.id}')"
           ondragover="event.preventDefault(); this.closest('.kanban-view-container').__kanbanView?.handleDragOver(event, '${column.id}')"
           ondragleave="this.closest('.kanban-view-container').__kanbanView?.handleDragLeave(event, '${column.id}')">
        <div class="kanban-column-header">
          <h4>${column.label}</h4>
          <span class="kanban-column-count">${items.length}</span>
        </div>
        <div class="kanban-column-content" id="kanban-column-${column.id}">
          ${items.map(item => this.renderCard(item)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render kanban card
   * @param {Object} item - Data item
   * @returns {string} HTML string
   */
  renderCard(item) {
    if (this.cardRenderer) {
      return this.cardRenderer(item);
    }

    // Default card renderer
    const id = item.id || 'unknown';
    const name = this.getNestedValue(item, 'contact.name') || 'Unknown';
    const contact = this.getNestedValue(item, 'contact.phone') || this.getNestedValue(item, 'contact.email') || '';
    const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '';

    return `
      <div class="kanban-card" 
           draggable="true"
           data-item-id="${id}"
           ondragstart="this.closest('.kanban-view-container').__kanbanView?.handleDragStart(event, '${id}')"
           onclick="this.closest('.kanban-view-container').__kanbanView?.handleCardClick('${id}')">
        <div class="kanban-card-header">
          <h5>${this.escapeHtml(name)}</h5>
        </div>
        <div class="kanban-card-body">
          <p class="kanban-card-contact">${this.escapeHtml(contact)}</p>
          ${date ? `<p class="kanban-card-date">${date}</p>` : ''}
        </div>
      </div>
    `;
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

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Store reference for event handlers
    if (this.container) {
      const container = this.container.querySelector('.kanban-view-container');
      if (container) {
        container.__kanbanView = this;
      }
    }

    // Refresh
    const refreshBtn = this.container.querySelector('#refreshKanban');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.render();
      });
    }
  }

  /**
   * Handle drag start
   * @param {Event} event - Drag event
   * @param {string} itemId - Item ID
   */
  handleDragStart(event, itemId) {
    this.draggedCard = itemId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.outerHTML);
    event.target.style.opacity = '0.5';
  }

  /**
   * Handle drag over
   * @param {Event} event - Drag event
   * @param {string} columnId - Column ID
   */
  handleDragOver(event, columnId) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const column = event.currentTarget;
    if (!column.classList.contains('drag-over')) {
      column.classList.add('drag-over');
    }
    
    this.dragOverColumn = columnId;
  }

  /**
   * Handle drag leave
   * @param {Event} event - Drag event
   * @param {string} columnId - Column ID
   */
  handleDragLeave(event, columnId) {
    const column = event.currentTarget;
    column.classList.remove('drag-over');
    this.dragOverColumn = null;
  }

  /**
   * Handle drop
   * @param {Event} event - Drop event
   * @param {string} columnId - Column ID
   */
  handleDrop(event, columnId) {
    event.preventDefault();
    
    const column = event.currentTarget;
    column.classList.remove('drag-over');
    
    if (!this.draggedCard) return;

    const item = this.data.find(d => d.id === this.draggedCard);
    if (!item) return;

    const targetColumn = this.columns.find(col => col.id === columnId);
    if (!targetColumn) return;

    const oldStatus = this.getNestedValue(item, this.statusField);
    const newStatus = targetColumn.status || targetColumn.id;

    // Update item status
    this.setNestedValue(item, this.statusField, newStatus);

    // Callback
    if (this.onCardMove) {
      this.onCardMove(this.draggedCard, oldStatus, newStatus, item);
    }

    // Update state manager
    if (typeof crmState !== 'undefined') {
      crmState.setState('filters', { ...crmState.getState('filters') });
    }

    // Re-render
    this.render();

    // Reset
    this.draggedCard = null;
    this.dragOverColumn = null;
  }

  /**
   * Handle card click
   * @param {string} itemId - Item ID
   */
  handleCardClick(itemId) {
    if (this.onCardClick) {
      const item = this.data.find(d => d.id === itemId);
      if (item) {
        this.onCardClick(item, itemId);
      }
    }
  }

  /**
   * Set nested value
   * @param {Object} obj - Object to set value in
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
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
   * Set status field
   * @param {string} field - Field path for status
   */
  setStatusField(field) {
    this.statusField = field;
    this.render();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KanbanView };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.KanbanView = KanbanView;
}
