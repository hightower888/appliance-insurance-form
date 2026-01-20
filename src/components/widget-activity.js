/**
 * Activity Widget Component
 * Displays activity feed (recent changes, events, etc.)
 */

class ActivityWidget extends DashboardWidget {
  /**
   * @param {Object} config - Widget configuration
   */
  constructor(config = {}) {
    super({
      ...config,
      type: 'activity'
    });
    
    this.limit = config.options?.limit || 10;
    this.showIcons = config.options?.showIcons !== false;
    this.groupByDate = config.options?.groupByDate !== false;
  }

  /**
   * Initialize widget
   */
  async onInit() {
    // Initialize widget service if available
    if (typeof widgetService !== 'undefined') {
      widgetService.initialize(this.database);
    }

    // Subscribe to real-time activity updates
    if (this.database) {
      this.subscribeToRealtime('security_logs', (data) => {
        // Refresh when new activity is added
        this.refresh();
      });
    }
  }

  /**
   * Fetch activity data
   * @returns {Promise<Array>} Activity data
   */
  async fetchData() {
    if (typeof widgetService === 'undefined') {
      throw new Error('WidgetService not available');
    }

    const activities = await widgetService.fetchActivityData({
      limit: this.limit
    });

    return activities;
  }

  /**
   * Render widget
   */
  render() {
    if (!this.container) {
      console.warn('ActivityWidget: Container not set');
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
   * @param {Array} newData - New activity data
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
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No activity available</p>';
    }

    // Group by date if enabled
    let groupedData = this.data;
    if (this.groupByDate) {
      groupedData = this.groupActivitiesByDate(this.data);
    }

    const itemsHTML = this.groupByDate
      ? this.renderGroupedActivities(groupedData)
      : this.data.map((item, index) => this.renderActivityItem(item, index)).join('');

    return `
      <div class="activity-widget-content">
        ${this.groupByDate ? itemsHTML : `<ul class="activity-items">${itemsHTML}</ul>`}
      </div>
    `;
  }

  /**
   * Group activities by date
   * @param {Array} activities - Activity array
   * @returns {Object} Grouped activities
   */
  groupActivitiesByDate(activities) {
    const grouped = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp || 0);
      const dateKey = date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    return grouped;
  }

  /**
   * Render grouped activities
   * @param {Object} grouped - Grouped activities
   * @returns {string} HTML
   */
  renderGroupedActivities(grouped) {
    const dates = Object.keys(grouped).sort((a, b) => {
      return new Date(b) - new Date(a);
    });

    return dates.map(date => {
      const activities = grouped[date];
      const itemsHTML = activities.map((item, index) => 
        this.renderActivityItem(item, index)
      ).join('');

      return `
        <div class="activity-group">
          <div class="activity-group-header">${this.escapeHtml(date)}</div>
          <ul class="activity-items">${itemsHTML}</ul>
        </div>
      `;
    }).join('');
  }

  /**
   * Render a single activity item
   * @param {Object} activity - Activity data
   * @param {number} index - Item index
   * @returns {string} Item HTML
   */
  renderActivityItem(activity, index) {
    const eventType = activity.eventType || activity.type || 'unknown';
    const user = activity.userEmail || activity.userId || 'System';
    const timestamp = activity.timestamp;
    const details = activity.details || {};

    // Format timestamp
    let timeStr = '';
    if (timestamp) {
      const date = new Date(timestamp);
      timeStr = date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }

    // Get icon for event type
    const icon = this.getEventIcon(eventType);

    // Format event description
    const description = this.formatEventDescription(eventType, details);

    return `
      <li class="activity-item" data-activity-id="${activity.id || index}">
        ${this.showIcons ? `<div class="activity-icon">${icon}</div>` : ''}
        <div class="activity-content">
          <div class="activity-description">${description}</div>
          <div class="activity-meta">
            <span class="activity-user">${this.escapeHtml(user)}</span>
            ${timeStr ? `<span class="activity-time">${this.escapeHtml(timeStr)}</span>` : ''}
          </div>
        </div>
      </li>
    `;
  }

  /**
   * Get icon for event type
   * @param {string} eventType - Event type
   * @returns {string} Icon
   */
  getEventIcon(eventType) {
    const iconMap = {
      'lead_created': '📋',
      'lead_edited': '✏️',
      'lead_deleted': '🗑️',
      'disposition_set': '✅',
      'conversion': '💰',
      'login': '🔐',
      'logout': '🚪',
      'export': '📥',
      'import': '📤',
      'default': '📝'
    };
    return iconMap[eventType] || iconMap.default;
  }

  /**
   * Format event description
   * @param {string} eventType - Event type
   * @param {Object} details - Event details
   * @returns {string} Formatted description
   */
  formatEventDescription(eventType, details) {
    const eventMap = {
      'lead_created': 'Created new lead',
      'lead_edited': `Edited lead${details.leadId ? ` #${details.leadId}` : ''}`,
      'lead_deleted': `Deleted lead${details.leadId ? ` #${details.leadId}` : ''}`,
      'disposition_set': `Set disposition to ${details.disposition || 'unknown'}`,
      'conversion': 'Lead converted to customer',
      'login': 'User logged in',
      'logout': 'User logged out',
      'export': 'Exported data',
      'import': 'Imported data'
    };

    let description = eventMap[eventType] || eventType.replace('_', ' ');
    
    // Add additional details if available
    if (details.fields && Array.isArray(details.fields)) {
      description += ` (${details.fields.join(', ')})`;
    }

    return this.escapeHtml(description);
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
  }

  /**
   * Show settings modal
   */
  showSettings() {
    alert(`Activity Widget Settings\n\nLimit: ${this.limit}\nGroup by Date: ${this.groupByDate}`);
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
        limit: this.limit,
        showIcons: this.showIcons,
        groupByDate: this.groupByDate
      }
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ActivityWidget };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ActivityWidget = ActivityWidget;
}
