/**
 * Timeline View Component (Phase 3)
 * Chronological timeline view for displaying leads/customers
 */

class TimelineView extends ViewController {
  constructor(container, data = [], options = {}) {
    super('timeline', container, data, options);
    
    this.dateField = options.dateField || 'timestamp';
    this.groupBy = options.groupBy || 'day'; // 'day', 'week', 'month'
    this.onItemClick = options.onItemClick || null;
    this.itemRenderer = options.itemRenderer || null;
  }

  /**
   * Render the timeline view
   */
  render() {
    if (!this.container) return;

    const filteredData = this.applyFilters(this.data);
    const sortedData = this.applySorting(filteredData);
    const groupedData = this.groupByDate(sortedData);

    if (sortedData.length === 0) {
      this.showEmpty('No items to display');
      return;
    }

    this.container.innerHTML = `
      <div class="timeline-view-container">
        <div class="timeline-view-header">
          <h3>Timeline View</h3>
          <div class="timeline-view-actions">
            <select id="timelineGroupBy" class="admin-filter">
              <option value="day" ${this.groupBy === 'day' ? 'selected' : ''}>Group by Day</option>
              <option value="week" ${this.groupBy === 'week' ? 'selected' : ''}>Group by Week</option>
              <option value="month" ${this.groupBy === 'month' ? 'selected' : ''}>Group by Month</option>
            </select>
            <button class="btn btn-sm btn-secondary" id="refreshTimeline">Refresh</button>
          </div>
        </div>
        
        <div class="timeline-content">
          ${this.renderTimelineGroups(groupedData)}
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.isRendered = true;
  }

  /**
   * Group data by date
   * @param {Array} data - Data to group
   * @returns {Object} Grouped data by date
   */
  groupByDate(data) {
    const grouped = {};

    data.forEach(item => {
      const dateValue = this.getNestedValue(item, this.dateField);
      if (!dateValue) return;

      const date = new Date(dateValue);
      let groupKey;

      if (this.groupBy === 'day') {
        groupKey = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
      } else if (this.groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = `Week of ${weekStart.toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}`;
      } else if (this.groupBy === 'month') {
        groupKey = date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
      } else {
        groupKey = date.toLocaleDateString('en-GB');
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    });

    return grouped;
  }

  /**
   * Render timeline groups
   * @param {Object} groupedData - Grouped data
   * @returns {string} HTML string
   */
  renderTimelineGroups(groupedData) {
    const groupKeys = Object.keys(groupedData).sort((a, b) => {
      // Sort groups chronologically (newest first)
      return new Date(b) - new Date(a);
    });

    return groupKeys.map(groupKey => {
      const items = groupedData[groupKey];
      return this.renderTimelineGroup(groupKey, items);
    }).join('');
  }

  /**
   * Render a timeline group
   * @param {string} groupKey - Group label
   * @param {Array} items - Items in this group
   * @returns {string} HTML string
   */
  renderTimelineGroup(groupKey, items) {
    return `
      <div class="timeline-group">
        <div class="timeline-group-header">
          <h4>${this.escapeHtml(groupKey)}</h4>
          <span class="timeline-group-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="timeline-group-items">
          ${items.map(item => this.renderTimelineItem(item)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render a timeline item
   * @param {Object} item - Data item
   * @returns {string} HTML string
   */
  renderTimelineItem(item) {
    if (this.itemRenderer) {
      return this.itemRenderer(item);
    }

    // Default timeline item renderer
    const id = item.id || 'unknown';
    const name = this.getNestedValue(item, 'contact.name') || 'Unknown';
    const contact = this.getNestedValue(item, 'contact.phone') || this.getNestedValue(item, 'contact.email') || '';
    const status = item.leadStatus || 'new';
    const disposition = item.disposition || null;
    const date = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    
    const statusBadge = this.getStatusBadge(status);
    const dispositionBadge = disposition ? this.getDispositionBadge(disposition) : '';

    return `
      <div class="timeline-item" 
           data-item-id="${id}"
           onclick="this.closest('.timeline-view-container').__timelineView?.handleItemClick('${id}')">
        <div class="timeline-item-time">${this.escapeHtml(date)}</div>
        <div class="timeline-item-content">
          <div class="timeline-item-header">
            <h5>${this.escapeHtml(name)}</h5>
            ${statusBadge}
            ${dispositionBadge}
          </div>
          <div class="timeline-item-body">
            <p class="timeline-item-contact">${this.escapeHtml(contact)}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get status badge HTML
   * @param {string} status - Status value
   * @returns {string} Badge HTML
   */
  getStatusBadge(status) {
    const badges = {
      'new': '<span class="badge badge-primary">New</span>',
      'contacted': '<span class="badge badge-info">Contacted</span>',
      'dispositioned': '<span class="badge badge-warning">Dispositioned</span>',
      'converted': '<span class="badge badge-success">Converted</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
  }

  /**
   * Get disposition badge HTML
   * @param {string} disposition - Disposition value
   * @returns {string} Badge HTML
   */
  getDispositionBadge(disposition) {
    const badges = {
      'interested': '<span class="badge badge-success">Interested</span>',
      'call_back': '<span class="badge badge-info">Call Back</span>',
      'not_interested': '<span class="badge badge-danger">Not Interested</span>',
      'no_answer': '<span class="badge badge-secondary">No Answer</span>',
      'other': '<span class="badge">Other</span>'
    };
    return badges[disposition] || `<span class="badge">${disposition}</span>`;
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
      const container = this.container.querySelector('.timeline-view-container');
      if (container) {
        container.__timelineView = this;
      }
    }

    // Group by selector
    const groupBySelect = this.container.querySelector('#timelineGroupBy');
    if (groupBySelect) {
      groupBySelect.addEventListener('change', (e) => {
        this.groupBy = e.target.value;
        this.render();
      });
    }

    // Refresh
    const refreshBtn = this.container.querySelector('#refreshTimeline');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.render();
      });
    }
  }

  /**
   * Handle item click
   * @param {string} itemId - Item ID
   */
  handleItemClick(itemId) {
    if (this.onItemClick) {
      const item = this.data.find(d => d.id === itemId);
      if (item) {
        this.onItemClick(item, itemId);
      }
    }
  }

  /**
   * Set date field
   * @param {string} field - Field path for date
   */
  setDateField(field) {
    this.dateField = field;
    this.render();
  }

  /**
   * Set group by option
   * @param {string} groupBy - Group by option ('day', 'week', 'month')
   */
  setGroupBy(groupBy) {
    this.groupBy = groupBy;
    this.render();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimelineView };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.TimelineView = TimelineView;
}
