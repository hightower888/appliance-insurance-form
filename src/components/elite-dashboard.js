/**
 * Elite Dashboard Component
 * Phase 3: Dashboard/Overview Page
 * Integrates KPIs, charts, activity feed, and quick actions with elite design system
 */

class EliteDashboard {
  constructor(options = {}) {
    this.options = {
      containerId: options.containerId || 'dashboardContainer',
      showKPIs: options.showKPIs !== false,
      showCharts: options.showCharts !== false,
      showActivityFeed: options.showActivityFeed !== false,
      showQuickActions: options.showQuickActions !== false,
      ...options
    };
    
    this.kpiData = null;
    this.chartInstances = {};
    this.activityFeed = [];
    this.init();
  }

  /**
   * Initialize dashboard
   */
  async init() {
    await this.loadData();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Load dashboard data from Firebase using existing KPI functions
   */
  async loadData() {
    try {
      // Use existing KPI calculation functions if available
      if (typeof calculateConversionRate === 'function' && 
          typeof calculateDispositionBreakdown === 'function' &&
          typeof calculateAcquisitionMetrics === 'function') {
        
        // Get filters (can be enhanced later with date filters)
        const filters = {};
        
        // Calculate KPIs using existing functions
        const [conversionRate, dispositionBreakdown, acquisitionMetrics] = await Promise.all([
          calculateConversionRate(filters),
          calculateDispositionBreakdown(filters),
          calculateAcquisitionMetrics(filters)
        ]);

        // Build KPI data from calculated values
        this.kpiData = {
          totalLeads: {
            value: acquisitionMetrics.newLeads || 0,
            label: 'Total Leads',
            icon: 'users',
            trend: null,
            color: 'blue'
          },
          conversionRate: {
            value: `${conversionRate.rate || 0}%`,
            label: 'Conversion Rate',
            icon: 'trending-up',
            trend: null,
            color: 'success'
          },
          conversions: {
            value: acquisitionMetrics.conversions || 0,
            label: 'Conversions',
            icon: 'check-circle',
            trend: null,
            color: 'success'
          },
          activeLeads: {
            value: acquisitionMetrics.newLeads || 0,
            label: 'New Leads',
            icon: 'activity',
            trend: null,
            color: 'blue'
          }
        };

        // Store disposition data for charts
        this.dispositionData = dispositionBreakdown;
        
        // Get trend data for charts
        if (typeof getConversionTrendData === 'function' && typeof getAcquisitionTrendData === 'function') {
          this.conversionTrendData = await getConversionTrendData(filters);
          this.acquisitionTrendData = await getAcquisitionTrendData(filters);
        }

        // Load sales data for activity feed
        let db;
        if (typeof getDatabase === 'function') {
          db = getDatabase();
        } else if (typeof database !== 'undefined' && database) {
          db = database;
        } else if (typeof window.database !== 'undefined' && window.database) {
          db = window.database;
        }

        if (db) {
          const salesRef = db.ref('sales');
          const snapshot = await salesRef.once('value');
          const salesData = snapshot.val() || {};
          const sales = Object.keys(salesData).map(key => ({
            id: key,
            ...salesData[key]
          }));
          this.activityFeed = this.prepareActivityFeed(sales);
        } else {
          this.activityFeed = [];
        }

      } else {
        // Fallback to manual calculation if functions not available
        let db;
        if (typeof getDatabase === 'function') {
          db = getDatabase();
        } else if (typeof database !== 'undefined' && database) {
          db = database;
        } else if (typeof window.database !== 'undefined' && window.database) {
          db = window.database;
        } else {
          throw new Error('Database not available');
        }

        const salesRef = db.ref('sales');
        const snapshot = await salesRef.once('value');
        const salesData = snapshot.val() || {};
        const sales = Object.keys(salesData).map(key => ({
          id: key,
          ...salesData[key]
        }));

        this.kpiData = this.calculateKPIs(sales);
        this.activityFeed = this.prepareActivityFeed(sales);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.kpiData = this.getEmptyKPIs();
      this.activityFeed = [];
      this.dispositionData = null;
      this.conversionTrendData = null;
      this.acquisitionTrendData = null;
    }
  }

  /**
   * Calculate KPIs from sales data
   */
  calculateKPIs(sales) {
    const totalLeads = sales.length;
    const converted = sales.filter(s => s.disposition === 'interested' || s.disposition === 'converted').length;
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : 0;
    
    // Calculate revenue (if available)
    const revenue = sales.reduce((sum, s) => {
      const value = parseFloat(s.value || s.revenue || 0);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    // Active leads (recent activity)
    const now = Date.now();
    const activeLeads = sales.filter(s => {
      const lastActivity = s.lastActivity || s.updatedAt || s.createdAt;
      if (!lastActivity) return false;
      const activityTime = typeof lastActivity === 'string' ? new Date(lastActivity).getTime() : lastActivity;
      const daysSinceActivity = (now - activityTime) / (1000 * 60 * 60 * 24);
      return daysSinceActivity <= 7; // Active in last 7 days
    }).length;

    return {
      totalLeads: {
        value: totalLeads,
        label: 'Total Leads',
        icon: 'users',
        trend: null,
        color: 'blue'
      },
      conversionRate: {
        value: `${conversionRate}%`,
        label: 'Conversion Rate',
        icon: 'trending-up',
        trend: null,
        color: 'success'
      },
      revenue: {
        value: this.formatCurrency(revenue),
        label: 'Revenue',
        icon: 'dollar-sign',
        trend: null,
        color: 'success'
      },
      activeLeads: {
        value: activeLeads,
        label: 'Active Leads',
        icon: 'activity',
        trend: null,
        color: 'blue'
      }
    };
  }

  /**
   * Get empty KPIs for error state
   */
  getEmptyKPIs() {
    return {
      totalLeads: { value: 0, label: 'Total Leads', icon: 'users', color: 'blue' },
      conversionRate: { value: '0%', label: 'Conversion Rate', icon: 'trending-up', color: 'success' },
      revenue: { value: '$0', label: 'Revenue', icon: 'dollar-sign', color: 'success' },
      activeLeads: { value: 0, label: 'Active Leads', icon: 'activity', color: 'blue' }
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Prepare activity feed from sales data
   */
  prepareActivityFeed(sales) {
    const activities = [];
    
    sales.forEach(sale => {
      // Add creation activity
      if (sale.createdAt) {
        activities.push({
          id: `${sale.id}-created`,
          type: 'created',
          title: 'New lead created',
          description: sale.customerName || 'New lead',
          timestamp: sale.createdAt,
          icon: 'user-plus',
          color: 'blue'
        });
      }

      // Add update activity
      if (sale.updatedAt && sale.updatedAt !== sale.createdAt) {
        activities.push({
          id: `${sale.id}-updated`,
          type: 'updated',
          title: 'Lead updated',
          description: sale.customerName || 'Lead updated',
          timestamp: sale.updatedAt,
          icon: 'edit',
          color: 'warning'
        });
      }

      // Add disposition activity
      if (sale.disposition) {
        activities.push({
          id: `${sale.id}-disposition`,
          type: 'disposition',
          title: `Disposition: ${sale.disposition}`,
          description: sale.customerName || 'Lead',
          timestamp: sale.updatedAt || sale.createdAt,
          icon: 'check-circle',
          color: sale.disposition === 'interested' ? 'success' : 'secondary'
        });
      }
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
      const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
      return timeB - timeA;
    });

    return activities.slice(0, 20); // Last 20 activities
  }

  /**
   * Render dashboard
   */
  render() {
    const container = document.getElementById(this.options.containerId);
    if (!container) {
      console.error(`Dashboard container "${this.options.containerId}" not found`);
      return;
    }

    container.innerHTML = `
      <div class="elite-dashboard">
        ${this.options.showKPIs ? this.renderKPIs() : ''}
        ${this.options.showCharts ? this.renderCharts() : ''}
        <div class="elite-dashboard-bottom">
          ${this.options.showActivityFeed ? this.renderActivityFeed() : ''}
          ${this.options.showQuickActions ? this.renderQuickActions() : ''}
        </div>
      </div>
    `;

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    // Render charts after DOM is ready
    if (this.options.showCharts && typeof Chart !== 'undefined') {
      setTimeout(() => this.renderChartInstances(), 100);
    }
  }

  /**
   * Render KPI cards
   */
  renderKPIs() {
    if (!this.kpiData) return '';

    const kpis = Object.values(this.kpiData);
    
    return `
      <div class="elite-kpi-grid">
        ${kpis.map(kpi => `
          <div class="elite-kpi-card card card-elevated">
            <div class="elite-kpi-card-header">
              <div class="elite-kpi-icon elite-kpi-icon-${kpi.color}">
                <i data-lucide="${kpi.icon}" style="width: 24px; height: 24px;"></i>
              </div>
              <div class="elite-kpi-content">
                <div class="elite-kpi-label">${kpi.label}</div>
                <div class="elite-kpi-value">${kpi.value}</div>
                ${kpi.trend ? `<div class="elite-kpi-trend elite-kpi-trend-${kpi.trend.direction}">
                  <i data-lucide="${kpi.trend.direction === 'up' ? 'trending-up' : 'trending-down'}" style="width: 16px; height: 16px;"></i>
                  ${kpi.trend.value}
                </div>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render charts section
   */
  renderCharts() {
    return `
      <div class="elite-charts-section">
        <div class="elite-chart-grid">
          <div class="elite-chart-card card card-elevated">
            <div class="elite-chart-header">
              <h3>Disposition Breakdown</h3>
            </div>
            <div class="elite-chart-body">
              <canvas id="dashboardDispositionChart"></canvas>
            </div>
          </div>
          <div class="elite-chart-card card card-elevated">
            <div class="elite-chart-header">
              <h3>Lead Trends</h3>
            </div>
            <div class="elite-chart-body">
              <canvas id="dashboardTrendsChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render chart instances
   */
  renderChartInstances() {
    if (this.kpiData && typeof Chart !== 'undefined') {
      // Use existing chart creation functions if available
      if (typeof createDispositionPieChart === 'function' && this.dispositionData) {
        // Use existing function for disposition chart
        this.chartInstances.disposition = createDispositionPieChart(this.dispositionData, 'dashboardDispositionChart');
      } else {
        // Fallback to manual chart creation
        this.renderDispositionChart();
      }

      // Render trends chart
      if (typeof createAcquisitionLineChart === 'function' && this.acquisitionTrendData) {
        // Use existing function for trends chart
        this.chartInstances.trends = createAcquisitionLineChart(this.acquisitionTrendData, 'dashboardTrendsChart');
      } else {
        // Fallback to manual chart creation
        this.renderTrendsChart();
      }
    }
  }

  /**
   * Render disposition pie chart (fallback)
   */
  renderDispositionChart() {
    const canvas = document.getElementById('dashboardDispositionChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (this.chartInstances.disposition) {
      this.chartInstances.disposition.destroy();
    }

    // Use disposition data if available
    if (this.dispositionData && this.dispositionData.counts) {
      const labels = [];
      const values = [];
      const colors = [];
      const colorMap = {
        'interested': 'var(--success-500)',
        'not_interested': 'var(--danger-500)',
        'no_answer': 'var(--warning-500)',
        'call_back': 'var(--blue-500)',
        'other': 'var(--slate-500)',
        'none': 'var(--slate-400)'
      };

      Object.keys(this.dispositionData.counts).forEach(key => {
        if (this.dispositionData.counts[key] > 0) {
          labels.push(key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
          values.push(this.dispositionData.counts[key]);
          colors.push(colorMap[key] || 'var(--slate-400)');
        }
      });

      if (values.length > 0) {
        this.chartInstances.disposition = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: colors,
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }
  }

  /**
   * Render trends line chart (fallback)
   */
  renderTrendsChart() {
    const canvas = document.getElementById('dashboardTrendsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (this.chartInstances.trends) {
      this.chartInstances.trends.destroy();
    }

    // Use trend data if available
    if (this.acquisitionTrendData && this.acquisitionTrendData.labels && this.acquisitionTrendData.values) {
      this.chartInstances.trends = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.acquisitionTrendData.labels,
          datasets: [{
            label: 'New Leads',
            data: this.acquisitionTrendData.values,
            borderColor: 'var(--blue-500)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  /**
   * Render activity feed (enhanced)
   */
  renderActivityFeed() {
    return `
      <div class="elite-activity-feed card card-elevated">
        <div class="elite-activity-feed-header">
          <div class="elite-activity-feed-title">
            <i data-lucide="activity" style="width: 20px; height: 20px; color: var(--blue-600);"></i>
            <h3>Recent Activity</h3>
          </div>
          <div class="elite-activity-feed-actions">
            <button class="elite-activity-feed-filter" id="filterActivityFeed" aria-label="Filter activity" style="display: none;">
              <i data-lucide="filter" style="width: 18px; height: 18px;"></i>
            </button>
            <button class="elite-activity-feed-refresh" id="refreshActivityFeed" aria-label="Refresh activity feed">
              <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
            </button>
          </div>
        </div>
        <div class="elite-activity-feed-body">
          ${this.activityFeed.length > 0 ? this.renderActivityItems() : this.renderEmptyActivity()}
        </div>
        ${this.activityFeed.length > 10 ? `
          <div class="elite-activity-feed-footer">
            <button class="elite-activity-feed-view-all" id="viewAllActivity">
              View All Activity
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render activity items (enhanced)
   */
  renderActivityItems() {
    return `
      <div class="elite-activity-timeline">
        ${this.activityFeed.slice(0, 10).map((activity, index) => `
          <div class="elite-activity-item" data-activity-id="${activity.id}">
            <div class="elite-activity-timeline-line"></div>
            <div class="elite-activity-icon elite-activity-icon-${activity.color}">
              <i data-lucide="${activity.icon}" style="width: 18px; height: 18px;"></i>
            </div>
            <div class="elite-activity-content">
              <div class="elite-activity-header">
                <div class="elite-activity-title">${activity.title}</div>
                <div class="elite-activity-time">${this.formatTimestamp(activity.timestamp)}</div>
              </div>
              <div class="elite-activity-description">${activity.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render empty activity state
   */
  renderEmptyActivity() {
    return `
      <div class="elite-activity-empty">
        <i data-lucide="activity" style="width: 48px; height: 48px; color: var(--text-tertiary);"></i>
        <p>No recent activity</p>
      </div>
    `;
  }

  /**
   * Format timestamp
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Render quick actions
   */
  renderQuickActions() {
    return `
      <div class="elite-quick-actions card card-elevated">
        <div class="elite-quick-actions-header">
          <h3>Quick Actions</h3>
        </div>
        <div class="elite-quick-actions-body">
          <button class="elite-quick-action-btn" data-action="new-lead">
            <i data-lucide="user-plus" style="width: 20px; height: 20px;"></i>
            <span>New Lead</span>
          </button>
          <button class="elite-quick-action-btn" data-action="upload-leads">
            <i data-lucide="upload" style="width: 20px; height: 20px;"></i>
            <span>Upload Leads</span>
          </button>
          <button class="elite-quick-action-btn" data-action="export">
            <i data-lucide="download" style="width: 20px; height: 20px;"></i>
            <span>Export Data</span>
          </button>
          <button class="elite-quick-action-btn" data-action="report">
            <i data-lucide="file-bar-chart" style="width: 20px; height: 20px;"></i>
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Quick action buttons
    const quickActionBtns = document.querySelectorAll('.elite-quick-action-btn');
    quickActionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.handleQuickAction(action);
      });
    });

    // Refresh activity feed
    const refreshBtn = document.getElementById('refreshActivityFeed');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadData().then(() => {
          this.render();
          this.attachEventListeners();
        });
      });
    }
  }

  /**
   * Handle quick action
   */
  handleQuickAction(action) {
    switch (action) {
      case 'new-lead':
        // Navigate to leads tab and open new lead form
        if (typeof switchTab === 'function') {
          switchTab('leads');
          // Trigger new lead form if available
          setTimeout(() => {
            const newLeadBtn = document.querySelector('[aria-label="Add new lead"]');
            if (newLeadBtn) newLeadBtn.click();
          }, 100);
        }
        break;
      case 'upload-leads':
        // Open upload leads modal
        const uploadBtn = document.getElementById('uploadLeadsBtn');
        if (uploadBtn) uploadBtn.click();
        break;
      case 'export':
        // Trigger export functionality
        if (typeof exportReports === 'function') {
          exportReports();
        }
        break;
      case 'report':
        // Navigate to reports tab
        if (typeof switchTab === 'function') {
          switchTab('reports');
        }
        break;
    }
  }

  /**
   * Refresh dashboard data
   */
  async refresh() {
    await this.loadData();
    this.render();
    this.attachEventListeners();
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.EliteDashboard = EliteDashboard;
}
