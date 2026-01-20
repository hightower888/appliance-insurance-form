/**
 * Dashboard Component (TASK-2.8.1)
 * Dashboard with KPI cards and real-time updates
 */

class Dashboard {
  constructor(containerId = 'dashboard', options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Dashboard: Container with id "${containerId}" not found`);
      return;
    }

    this.options = {
      database: null,
      kpiCalculator: null,
      updateInterval: 60000, // 1 minute
      kpis: [
        { id: 'ltv', label: 'Avg Lifetime Value', icon: '💰', route: '#reports' },
        { id: 'retention', label: 'Retention Rate', icon: '📈', route: '#reports' },
        { id: 'churn', label: 'Churn Rate', icon: '📉', route: '#reports' },
        { id: 'arpc', label: 'Avg Revenue/Customer', icon: '💵', route: '#reports' },
        { id: 'conversion', label: 'Conversion Rate', icon: '✅', route: '#reports' },
        { id: 'agents', label: 'Top Agent', icon: '👤', route: '#reports' }
      ],
      filters: {},
      onKPIClick: null,
      ...options
    };

    this.isInitialized = false;
    this.updateTimer = null;
    this.kpiData = {};
    this.init();
  }

  /**
   * Initialize dashboard
   */
  init() {
    if (this.isInitialized) return;

    // Get KPI Calculator if available
    if (typeof kpiCalculator !== 'undefined') {
      this.options.kpiCalculator = kpiCalculator;
    }

    // Initialize KPI Calculator if needed
    if (this.options.kpiCalculator && this.options.database) {
      this.options.kpiCalculator.initialize(this.options.database, typeof cacheManager !== 'undefined' ? cacheManager : null);
    }

    this.render();
    this.loadKPIs();
    this.startAutoUpdate();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  /**
   * Render dashboard
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h2>Dashboard</h2>
          <div class="dashboard-actions">
            <button class="btn btn-sm btn-secondary" id="refreshDashboard">Refresh</button>
          </div>
        </div>
        
        <div class="dashboard-filters" id="dashboardFilters">
          <input type="date" id="dashboardDateFrom" class="form-control" placeholder="Start Date">
          <input type="date" id="dashboardDateTo" class="form-control" placeholder="End Date">
          <button class="btn btn-sm btn-primary" id="applyDashboardFilters">Apply</button>
          <button class="btn btn-sm btn-secondary" id="clearDashboardFilters">Clear</button>
        </div>

        <div class="dashboard-kpis" id="dashboardKPIs">
          ${this.renderKPICards()}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render KPI cards
   * @returns {string} HTML string
   */
  renderKPICards() {
    return this.options.kpis.map(kpi => this.renderKPICard(kpi)).join('');
  }

  /**
   * Render single KPI card
   * @param {Object} kpi - KPI configuration
   * @returns {string} HTML string
   */
  renderKPICard(kpi) {
    const data = this.kpiData[kpi.id] || {};
    const value = this.formatKPIValue(kpi.id, data);
    const trend = data.trend || null;
    const trendClass = trend ? (trend > 0 ? 'trend-up' : 'trend-down') : '';
    const trendIcon = trend ? (trend > 0 ? '↑' : '↓') : '';

    return `
      <div class="dashboard-kpi-card ${kpi.id}" 
           data-kpi-id="${kpi.id}"
           ${kpi.route ? `onclick="this.closest('.dashboard-container').__dashboard?.handleKPIClick('${kpi.id}')"` : ''}
           style="cursor: ${kpi.route ? 'pointer' : 'default'};">
        <div class="kpi-card-header">
          <span class="kpi-icon">${kpi.icon || '📊'}</span>
          <h3 class="kpi-label">${kpi.label}</h3>
        </div>
        <div class="kpi-card-value">
          <span class="kpi-value">${value}</span>
          ${trend ? `<span class="kpi-trend ${trendClass}">${trendIcon} ${Math.abs(trend).toFixed(1)}%</span>` : ''}
        </div>
        ${data.subtitle ? `<div class="kpi-card-subtitle">${data.subtitle}</div>` : ''}
        ${data.loading ? '<div class="kpi-loading">Loading...</div>' : ''}
      </div>
    `;
  }

  /**
   * Format KPI value based on type
   * @param {string} kpiId - KPI ID
   * @param {Object} data - KPI data
   * @returns {string} Formatted value
   */
  formatKPIValue(kpiId, data) {
    if (data.loading) {
      return '—';
    }

    switch (kpiId) {
      case 'ltv':
        return data.avgLTV ? `£${data.avgLTV.toLocaleString()}` : '£0';
      case 'retention':
        return data.retentionRate ? `${data.retentionRate}%` : '0%';
      case 'churn':
        return data.churnRate ? `${data.churnRate}%` : '0%';
      case 'arpc':
        return data.arpc ? `£${data.arpc.toLocaleString()}` : '£0';
      case 'conversion':
        return data.conversionRate ? `${data.conversionRate}%` : '0%';
      case 'agents':
        return data.topPerformer ? data.topPerformer.agent.split('@')[0] : 'N/A';
      default:
        return data.value || '—';
    }
  }

  /**
   * Load all KPIs
   */
  async loadKPIs() {
    if (!this.options.kpiCalculator) {
      console.warn('Dashboard: KPI Calculator not available');
      return;
    }

    try {
      // Mark as loading
      this.options.kpis.forEach(kpi => {
        if (!this.kpiData[kpi.id]) {
          this.kpiData[kpi.id] = { loading: true };
        } else {
          this.kpiData[kpi.id].loading = true;
        }
      });
      this.render();

      // Calculate KPIs
      const filters = this.buildFilters();
      
      // Load individual KPIs
      const [ltv, retention, churn, arpc, agentMetrics] = await Promise.all([
        this.options.kpiCalculator.calculateLTV(filters).catch(() => null),
        this.options.kpiCalculator.calculateRetentionRate(filters).catch(() => null),
        this.options.kpiCalculator.calculateChurnRate(filters).catch(() => null),
        this.options.kpiCalculator.calculateARPC(filters).catch(() => null),
        this.options.kpiCalculator.calculateAgentMetrics(filters).catch(() => null)
      ]);

      // Store KPI data
      if (ltv) {
        this.kpiData.ltv = { ...ltv, loading: false, subtitle: `${ltv.customerCount} customers` };
      }
      if (retention) {
        this.kpiData.retention = { ...retention, loading: false, subtitle: `${retention.retainedCustomers}/${retention.totalCustomers} retained` };
      }
      if (churn) {
        this.kpiData.churn = { ...churn, loading: false, subtitle: `${churn.churnedCustomers}/${churn.totalCustomers} churned` };
      }
      if (arpc) {
        this.kpiData.arpc = { ...arpc, loading: false, subtitle: `${arpc.customerCount} customers` };
      }
      if (agentMetrics && agentMetrics.topPerformer) {
        this.kpiData.agents = { 
          ...agentMetrics, 
          loading: false, 
          subtitle: `${agentMetrics.topPerformer.conversionRate}% conversion rate`,
          topPerformer: agentMetrics.topPerformer
        };
      }

      // Get conversion rate (from existing crm-reports.js logic or calculate)
      // For now, use a placeholder
      this.kpiData.conversion = { conversionRate: 0, loading: false, subtitle: 'From leads' };

      this.render();
    } catch (error) {
      console.error('Dashboard: Error loading KPIs:', error);
      this.showError('Failed to load KPIs');
    }
  }

  /**
   * Build filters from UI
   * @returns {Object} Filter object
   */
  buildFilters() {
    const filters = { ...this.options.filters };
    
    const dateFrom = document.getElementById('dashboardDateFrom')?.value;
    const dateTo = document.getElementById('dashboardDateTo')?.value;
    
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom).getTime();
    }
    if (dateTo) {
      filters.dateTo = new Date(dateTo).getTime() + 86400000; // Add one day
    }

    return filters;
  }

  /**
   * Start auto-update timer
   */
  startAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      this.loadKPIs();
    }, this.options.updateInterval);
  }

  /**
   * Stop auto-update timer
   */
  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Store reference for event handlers
    if (this.container) {
      const container = this.container.querySelector('.dashboard-container');
      if (container) {
        container.__dashboard = this;
      }
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadKPIs();
      });
    }

    // Apply filters
    const applyFiltersBtn = document.getElementById('applyDashboardFilters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.loadKPIs();
      });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clearDashboardFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        const dateFromInput = document.getElementById('dashboardDateFrom');
        const dateToInput = document.getElementById('dashboardDateTo');
        
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        
        this.options.filters = {};
        this.loadKPIs();
      });
    }
  }

  /**
   * Handle KPI card click
   * @param {string} kpiId - KPI ID
   */
  handleKPIClick(kpiId) {
    const kpi = this.options.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    if (this.options.onKPIClick) {
      this.options.onKPIClick(kpiId, kpi, this.kpiData[kpiId]);
    } else if (kpi.route) {
      // Default navigation
      if (kpi.route.startsWith('#')) {
        window.location.hash = kpi.route.substring(1);
      } else {
        window.location.href = kpi.route;
      }
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (this.container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-error';
      errorDiv.textContent = message;
      this.container.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    this.stopAutoUpdate();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isInitialized = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Dashboard };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.Dashboard = Dashboard;
}
