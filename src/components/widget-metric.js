/**
 * Metric Widget Component
 * Displays KPI/metric values (numbers, percentages, currency)
 */

class MetricWidget extends DashboardWidget {
  /**
   * @param {Object} config - Widget configuration
   */
  constructor(config = {}) {
    super({
      ...config,
      type: 'metric'
    });
    
    this.metricType = config.options?.metricType || 'conversionRate';
    this.format = config.options?.format || 'number'; // number, percentage, currency
    this.showTrend = config.options?.showTrend !== false;
    this.trendPeriod = config.options?.trendPeriod || 'week'; // day, week, month
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
   * Fetch metric data
   * @returns {Promise<Object>} Metric data
   */
  async fetchData() {
    if (typeof widgetService === 'undefined') {
      throw new Error('WidgetService not available');
    }

    const filters = this.options.filters || {};
    const data = await widgetService.fetchMetricData({
      metric: this.metricType,
      filters: filters
    });

    return data;
  }

  /**
   * Render widget
   */
  render() {
    if (!this.container) {
      console.warn('MetricWidget: Container not set');
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
   * @param {Object} newData - New metric data
   */
  async onUpdate(newData) {
    this.updateDisplay();
  }

  /**
   * Get widget content HTML
   * @returns {string} Content HTML
   */
  getContentHTML() {
    if (!this.data) {
      return '<p style="color: var(--text-secondary);">No data available</p>';
    }

    const { value, label, unit, detail } = this.data;
    
    // Format value based on format type
    let formattedValue = value;
    if (this.format === 'percentage' && !unit.includes('%')) {
      formattedValue = `${value}%`;
    } else if (this.format === 'currency' && !unit.includes('£')) {
      formattedValue = `£${parseFloat(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (this.format === 'number') {
      formattedValue = parseFloat(value).toLocaleString('en-GB');
    }

    // Calculate trend if enabled
    let trendHTML = '';
    if (this.showTrend && this.data.previousValue !== undefined) {
      const trend = parseFloat(value) - parseFloat(this.data.previousValue);
      const trendPercent = this.data.previousValue > 0 
        ? ((trend / this.data.previousValue) * 100).toFixed(1)
        : 0;
      const trendClass = trend >= 0 ? 'trend-up' : 'trend-down';
      const trendIcon = trend >= 0 ? '↑' : '↓';
      
      trendHTML = `
        <div class="metric-trend ${trendClass}">
          <span class="trend-icon">${trendIcon}</span>
          <span class="trend-value">${Math.abs(trendPercent)}%</span>
          <span class="trend-label">vs previous ${this.trendPeriod}</span>
        </div>
      `;
    }

    return `
      <div class="metric-widget-content">
        <div class="metric-value">
          ${this.escapeHtml(formattedValue)}
          ${unit && !formattedValue.includes(unit) ? `<span class="metric-unit">${this.escapeHtml(unit)}</span>` : ''}
        </div>
        <div class="metric-label">${this.escapeHtml(label)}</div>
        ${detail ? `<div class="metric-detail">${this.escapeHtml(detail)}</div>` : ''}
        ${trendHTML}
      </div>
    `;
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
    // This will be enhanced with dashboard builder
    alert(`Metric Widget Settings\n\nMetric Type: ${this.metricType}\nFormat: ${this.format}`);
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
        metricType: this.metricType,
        format: this.format,
        showTrend: this.showTrend,
        trendPeriod: this.trendPeriod
      }
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MetricWidget };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.MetricWidget = MetricWidget;
}
