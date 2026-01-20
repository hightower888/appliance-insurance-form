/**
 * Chart Widget Component
 * Wraps Chart.js charts for dashboard display
 */

class ChartWidget extends DashboardWidget {
  /**
   * @param {Object} config - Widget configuration
   */
  constructor(config = {}) {
    super({
      ...config,
      type: 'chart'
    });
    
    this.chartType = config.options?.chartType || 'pie'; // pie, bar, line
    this.dataType = config.options?.dataType || 'disposition'; // disposition, conversion, acquisition
    this.chartInstance = null;
    this.canvasId = `chart-${this.id}`;
  }

  /**
   * Initialize widget
   */
  async onInit() {
    // Check Chart.js availability
    if (typeof Chart === 'undefined') {
      console.warn('ChartWidget: Chart.js not available');
    }

    // Initialize widget service if available
    if (typeof widgetService !== 'undefined') {
      widgetService.initialize(this.database);
    }
  }

  /**
   * Fetch chart data
   * @returns {Promise<Object>} Chart data
   */
  async fetchData() {
    if (typeof widgetService === 'undefined') {
      throw new Error('WidgetService not available');
    }

    const filters = this.options.filters || {};
    
    // For now, use existing chart functions from crm-reports.js
    // This will be enhanced in Phase 2 with interactive charts
    let chartData = null;

    try {
      // Use existing calculation functions if available
      if (this.dataType === 'disposition' && typeof calculateDispositionBreakdown === 'function') {
        const breakdown = await calculateDispositionBreakdown(filters);
        chartData = this.formatDispositionData(breakdown);
      } else if (this.dataType === 'conversion' && typeof getConversionTrendData === 'function') {
        const trend = await getConversionTrendData(filters);
        chartData = this.formatTrendData(trend);
      } else if (this.dataType === 'acquisition' && typeof getAcquisitionTrendData === 'function') {
        const acquisition = await getAcquisitionTrendData(filters);
        chartData = this.formatTrendData(acquisition);
      } else {
        // Fallback to widget service
        chartData = await widgetService.fetchChartData({
          chartType: this.chartType,
          dataType: this.dataType,
          filters: filters
        });
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }

    return chartData;
  }

  /**
   * Format disposition data for chart
   * @param {Object} breakdown - Disposition breakdown
   * @returns {Object} Chart data
   */
  formatDispositionData(breakdown) {
    const labels = [];
    const values = [];
    const colors = [];
    
    const colorMap = {
      'interested': '#10b981',
      'not_interested': '#ef4444',
      'no_answer': '#f59e0b',
      'call_back': '#3b82f6',
      'other': '#8b5cf6',
      'none': '#6b7280'
    };

    Object.keys(breakdown.counts || {}).forEach(key => {
      if (breakdown.counts[key] > 0) {
        labels.push(key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        values.push(breakdown.counts[key]);
        colors.push(colorMap[key] || '#6b7280');
      }
    });

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  /**
   * Format trend data for chart
   * @param {Object} trend - Trend data
   * @returns {Object} Chart data
   */
  formatTrendData(trend) {
    return {
      labels: trend.labels || [],
      datasets: [{
        label: this.dataType === 'conversion' ? 'Conversions' : 'New Leads',
        data: trend.values || [],
        backgroundColor: this.chartType === 'bar' 
          ? 'rgba(59, 130, 246, 0.8)'
          : 'rgba(16, 185, 129, 0.1)',
        borderColor: this.chartType === 'bar' ? '#2563eb' : '#10b981',
        borderWidth: this.chartType === 'bar' ? 2 : 3,
        fill: this.chartType === 'line'
      }]
    };
  }

  /**
   * Render widget
   */
  render() {
    if (!this.container) {
      console.warn('ChartWidget: Container not set');
      return;
    }

    this.container.innerHTML = this.getHTML();
    this.isRendered = true;

    // Setup event listeners
    this.setupEventListeners();

    // Load data and create chart
    if (!this.data && !this.loading) {
      this.refresh();
    } else if (this.data) {
      this.createChart();
    }
  }

  /**
   * Create Chart.js chart
   */
  createChart() {
    if (typeof Chart === 'undefined') {
      console.warn('ChartWidget: Chart.js not available');
      return;
    }

    if (!this.data || !this.data.labels || !this.data.datasets) {
      console.warn('ChartWidget: Invalid chart data');
      return;
    }

    // Destroy existing chart
    if (this.chartInstance) {
      try {
        this.chartInstance.destroy();
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
      this.chartInstance = null;
    }

    // Find canvas element
    const canvas = this.container.querySelector(`#${this.canvasId}`);
    if (!canvas) {
      console.warn('ChartWidget: Canvas element not found');
      return;
    }

    const ctx = canvas.getContext('2d');

    // Create chart based on type
    const chartConfig = {
      type: this.chartType,
      data: this.data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: this.chartType === 'pie' ? 'bottom' : 'top',
            labels: {
              padding: 15,
              font: {
                size: 12
              },
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            }
          }
        }
      }
    };

    // Add scales for bar/line charts
    if (this.chartType === 'bar' || this.chartType === 'line') {
      chartConfig.options.scales = {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      };
    }

    // Add fill for line charts
    if (this.chartType === 'line') {
      chartConfig.options.interaction = {
        mode: 'index',
        intersect: false
      };
    }

    this.chartInstance = new Chart(ctx, chartConfig);
  }

  /**
   * Widget-specific update
   * @param {Object} newData - New chart data
   */
  async onUpdate(newData) {
    if (this.chartInstance && newData) {
      // Update chart data
      this.chartInstance.data = newData;
      this.chartInstance.update();
    } else {
      // Recreate chart
      this.createChart();
    }
  }

  /**
   * Get widget content HTML
   * @returns {string} Content HTML
   */
  getContentHTML() {
    if (!this.data) {
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No data available</p>';
    }

    const height = this.state.size === 'small' ? '200px' : 
                   this.state.size === 'large' ? '400px' : '300px';

    return `
      <div class="chart-widget-content" style="position: relative; height: ${height};">
        <canvas id="${this.canvasId}" aria-label="${this.title} chart"></canvas>
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
    alert(`Chart Widget Settings\n\nChart Type: ${this.chartType}\nData Type: ${this.dataType}`);
  }

  /**
   * Destroy widget and clean up chart
   */
  onDestroy() {
    if (this.chartInstance) {
      try {
        this.chartInstance.destroy();
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
      this.chartInstance = null;
    }
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
        chartType: this.chartType,
        dataType: this.dataType
      }
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChartWidget };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ChartWidget = ChartWidget;
}
