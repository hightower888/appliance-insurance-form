/**
 * List Widget Component
 * Displays data lists (recent items, top performers, etc.)
 */

class ListWidget extends DashboardWidget {
  /**
   * @param {Object} config - Widget configuration
   */
  constructor(config = {}) {
    super({
      ...config,
      type: 'list'
    });
    
    this.listType = config.options?.listType || 'recent'; // recent, top, custom
    this.limit = config.options?.limit || 10;
    this.showAvatar = config.options?.showAvatar !== false;
    this.showTimestamp = config.options?.showTimestamp !== false;
  }

  /**
   * Initialize widget
   */
  async onInit() {
    // Initialize widget service if available
    if (typeof widgetService !== 'undefined') {
      widgetService.initialize(this.database);
    }
  }

  /**
   * Fetch list data
   * @returns {Promise<Array>} List data
   */
  async fetchData() {
    if (typeof widgetService === 'undefined') {
      throw new Error('WidgetService not available');
    }

    const filters = this.options.filters || {};
    const items = await widgetService.fetchListData({
      listType: this.listType,
      limit: this.limit,
      filters: filters
    });

    return items;
  }

  /**
   * Render widget
   */
  render() {
    if (!this.container) {
      console.warn('ListWidget: Container not set');
      return;
    }

    this.container.innerHTML = this.getHTML();
    this.isRendered = true;

    // Setup event listeners
    this.setupEventListeners();

    // Load data if not already loaded
    if (!this.data && !this.loading) {
      this.refresh();
    } else if (this.data) {
      this.updateDisplay();
    }
  }

  /**
   * Update display with current data
   */
  updateDisplay() {
    if (!this.isRendered || !this.data) return;

    const contentEl = this.container.querySelector('.widget-content');
    if (contentEl) {
      contentEl.innerHTML = this.getContentHTML();
    }
  }

  /**
   * Widget-specific update
   * @param {Array} newData - New list data
   */
  async onUpdate(newData) {
    this.updateDisplay();
  }

  /**
   * Get widget content HTML
   * @returns {string} Content HTML
   */
  getContentHTML() {
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No items available</p>';
    }

    const itemsHTML = this.data.map((item, index) => {
      return this.renderListItem(item, index);
    }).join('');

    return `
      <div class="list-widget-content">
        <ul class="list-widget-items">
          ${itemsHTML}
        </ul>
      </div>
    `;
  }

  /**
   * Render a single list item
   * @param {Object} item - Item data
   * @param {number} index - Item index
   * @returns {string} Item HTML
   */
  renderListItem(item, index) {
    // Determine item display based on data structure
    const name = item.contact?.name || item.name || `Item ${index + 1}`;
    const email = item.contact?.email || item.email || '';
    const phone = item.contact?.phone || item.phone || '';
    const timestamp = item.timestamp || item.createdAt || item.submittedAt;
    
    // Format timestamp
    let timeHTML = '';
    if (this.showTimestamp && timestamp) {
      const date = new Date(timestamp);
      const timeStr = date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      timeHTML = `<span class="list-item-time">${this.escapeHtml(timeStr)}</span>`;
    }

    // Avatar/icon
    const avatarHTML = this.showAvatar 
      ? `<div class="list-item-avatar">${this.getInitials(name)}</div>`
      : `<div class="list-item-icon">${index + 1}</div>`;

    // Status badge if available
    let statusHTML = '';
    if (item.leadStatus) {
      const statusClass = item.leadStatus === 'converted' ? 'badge-success' :
                         item.leadStatus === 'new' ? 'badge-info' :
                         'badge-warning';
      statusHTML = `<span class="badge ${statusClass}">${this.escapeHtml(item.leadStatus)}</span>`;
    }

    return `
      <li class="list-item" data-item-id="${item.id || index}">
        ${avatarHTML}
        <div class="list-item-content">
          <div class="list-item-header">
            <span class="list-item-name">${this.escapeHtml(name)}</span>
            ${statusHTML}
          </div>
          <div class="list-item-details">
            ${email ? `<span class="list-item-email">${this.escapeHtml(email)}</span>` : ''}
            ${phone ? `<span class="list-item-phone">${this.escapeHtml(phone)}</span>` : ''}
            ${timeHTML}
          </div>
        </div>
      </li>
    `;
  }

  /**
   * Get initials from name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.container) return;

    // Refresh button
    const refreshBtn = this.container.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refresh();
      });
    }

    // Settings button
    const settingsBtn = this.container.querySelector('[data-action="settings"]');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }

    // Collapse button
    const collapseBtn = this.container.querySelector('[data-action="collapse"]');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        this.toggleCollapsed();
      });
    }

    // Remove button
    const removeBtn = this.container.querySelector('[data-action="remove"]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.emit('remove', { widget: this });
      });
    }

    // List item clicks
    const listItems = this.container.querySelectorAll('.list-item');
    listItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const itemId = item.getAttribute('data-item-id');
        this.emit('itemClick', { widget: this, itemId, item });
      });
    });
  }

  /**
   * Show settings modal
   */
  showSettings() {
    alert(`List Widget Settings\n\nList Type: ${this.listType}\nLimit: ${this.limit}`);
  }

  /**
   * Get widget configuration
   * @returns {Object} Configuration
   */
  getConfig() {
    return {
      ...super.getConfig(),
      options: {
        ...this.options,
        listType: this.listType,
        limit: this.limit,
        showAvatar: this.showAvatar,
        showTimestamp: this.showTimestamp
      }
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ListWidget };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ListWidget = ListWidget;
}
