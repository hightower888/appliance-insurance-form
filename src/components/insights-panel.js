/**
 * Insights Panel Component (Phase 4B)
 * Display automated insights in a dedicated panel
 */

class InsightsPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      leads: options.leads || [],
      insightsService: options.insightsService || (typeof AutomatedInsightsService !== 'undefined' ? new AutomatedInsightsService() : null),
      autoRefresh: options.autoRefresh !== false,
      refreshInterval: options.refreshInterval || 5 * 60 * 1000, // 5 minutes
      ...options
    };

    this.insights = [];
    this.refreshTimer = null;
  }

  /**
   * Render insights panel
   */
  render() {
    if (!this.container) return;

    // Generate insights
    if (this.options.insightsService) {
      this.insights = this.options.insightsService.generateInsights(this.options.leads || []);
    }

    this.container.innerHTML = `
      <div class="insights-panel-container">
        <div class="insights-panel-header">
          <h3>📊 Automated Insights</h3>
          <div class="insights-panel-actions">
            <button class="btn btn-sm btn-secondary" id="refreshInsightsBtn">Refresh</button>
            <button class="btn btn-sm btn-secondary" id="toggleInsightsAutoRefresh">
              ${this.options.autoRefresh ? 'Disable Auto' : 'Enable Auto'}
            </button>
          </div>
        </div>

        <div class="insights-panel-content">
          ${this.renderInsights()}
        </div>
      </div>
    `;

    this.setupEventListeners();
    
    if (this.options.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Render insights list
   * @returns {string} HTML
   */
  renderInsights() {
    if (this.insights.length === 0) {
      return `
        <div class="insights-empty">
          <p>No insights available. Add more leads to generate insights.</p>
        </div>
      `;
    }

    return `
      <div class="insights-list">
        ${this.insights.map((insight, index) => this.renderInsight(insight, index)).join('')}
      </div>
    `;
  }

  /**
   * Render single insight
   * @param {Object} insight - Insight object
   * @param {number} index - Insight index
   * @returns {string} HTML
   */
  renderInsight(insight, index) {
    const icon = this.getInsightIcon(insight.type);
    const priorityClass = `insight-priority-${insight.priority}`;
    
    return `
      <div class="insight-card ${priorityClass}" data-insight-index="${index}">
        <div class="insight-card-header">
          <div class="insight-icon">${icon}</div>
          <div class="insight-title">${this.escapeHtml(insight.title)}</div>
          <div class="insight-priority-badge priority-${insight.priority}">${insight.priority}</div>
        </div>
        <div class="insight-card-body">
          <div class="insight-message">${this.escapeHtml(insight.message)}</div>
          ${insight.metric !== undefined ? `
            <div class="insight-metric">
              <strong>Metric:</strong> ${this.formatMetric(insight.metric, insight.type)}
            </div>
          ` : ''}
          ${insight.action ? `
            <div class="insight-action">
              <button class="btn btn-sm btn-primary" onclick="insightsPanel.handleAction('${index}')">
                ${this.escapeHtml(insight.action)}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get insight icon
   * @param {string} type - Insight type
   * @returns {string} Icon
   */
  getInsightIcon(type) {
    const icons = {
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  }

  /**
   * Format metric value
   * @param {number} metric - Metric value
   * @param {string} type - Insight type
   * @returns {string} Formatted metric
   */
  formatMetric(metric, type) {
    if (typeof metric === 'number') {
      if (type === 'conversion' || type === 'rate') {
        return `${metric.toFixed(1)}%`;
      }
      return metric.toFixed(2);
    }
    return String(metric);
  }

  /**
   * Handle insight action
   * @param {string} index - Insight index
   */
  handleAction(index) {
    const insight = this.insights[parseInt(index)];
    if (!insight) return;

    // Handle different action types
    if (insight.action === 'Review conversion funnel') {
      if (typeof switchTab === 'function') {
        switchTab('reports');
      }
    } else if (insight.action === 'Review lead sources') {
      if (typeof switchTab === 'function') {
        switchTab('leads');
      }
    } else if (insight.action === 'Schedule callbacks') {
      // Filter leads by call_back disposition
      const callbackFilter = document.getElementById('leadsFilterDisposition');
      if (callbackFilter) {
        callbackFilter.value = 'call_back';
        if (typeof filterLeads === 'function') {
          filterLeads();
        }
      }
    } else if (insight.action === 'Review high-risk leads') {
      // Show high-risk leads
      if (typeof switchTab === 'function') {
        switchTab('analytics');
      }
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const refreshBtn = document.getElementById('refreshInsightsBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }

    const toggleBtn = document.getElementById('toggleInsightsAutoRefresh');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleAutoRefresh());
    }
  }

  /**
   * Refresh insights
   */
  refresh() {
    if (this.options.insightsService) {
      this.insights = this.options.insightsService.generateInsights(this.options.leads || []);
      this.render();
    }
  }

  /**
   * Toggle auto refresh
   */
  toggleAutoRefresh() {
    this.options.autoRefresh = !this.options.autoRefresh;
    
    if (this.options.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
    
    this.render();
  }

  /**
   * Start auto refresh
   */
  startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, this.options.refreshInterval);
  }

  /**
   * Stop auto refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Update leads data
   * @param {Array} leads - New leads array
   */
  updateLeads(leads) {
    this.options.leads = leads;
    this.refresh();
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
let insightsPanel = null;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InsightsPanel };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.InsightsPanel = InsightsPanel;
  window.insightsPanel = insightsPanel;
}
