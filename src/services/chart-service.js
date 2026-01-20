/**
 * Chart Service (TASK-2.9.1)
 * Chart creation and management with drill-down functionality
 */

class ChartService {
  constructor() {
    this.chartInstances = {};
    this.defaultOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          enabled: true
        }
      }
    };
  }

  /**
   * Check if Chart.js is available
   * @returns {boolean}
   */
  isChartJSAvailable() {
    return typeof Chart !== 'undefined';
  }

  /**
   * Create a chart
   * @param {string} type - Chart type ('pie', 'bar', 'line', 'area')
   * @param {string} containerId - Container element ID
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object|null} Chart instance or null
   */
  createChart(type, containerId, data, options = {}) {
    if (!this.isChartJSAvailable()) {
      console.warn('Chart Service: Chart.js not available');
      return null;
    }

    const canvas = document.getElementById(containerId);
    if (!canvas) {
      console.warn(`Chart Service: Container "${containerId}" not found`);
      return null;
    }

    // Destroy existing chart if it exists
    this.destroyChart(containerId);

    const ctx = canvas.getContext('2d');
    const mergedOptions = this.mergeOptions(type, options);

    let chart;
    
    switch (type) {
      case 'pie':
        chart = this.createPieChart(ctx, data, mergedOptions);
        break;
      case 'bar':
        chart = this.createBarChart(ctx, data, mergedOptions);
        break;
      case 'line':
        chart = this.createLineChart(ctx, data, mergedOptions);
        break;
      case 'area':
        chart = this.createAreaChart(ctx, data, mergedOptions);
        break;
      default:
        console.warn(`Chart Service: Unknown chart type "${type}"`);
        return null;
    }

    if (chart) {
      this.chartInstances[containerId] = chart;
      
      // Add drill-down support if callback provided
      if (options.onClick) {
        canvas.onclick = (evt) => {
          const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
          if (points.length) {
            const firstPoint = points[0];
            const label = chart.data.labels[firstPoint.index];
            const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
            options.onClick(label, value, firstPoint.index, chart.data);
          }
        };
      }
    }

    return chart;
  }

  /**
   * Create pie chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart instance
   */
  createPieChart(ctx, data, options) {
    return new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels || [],
        datasets: [{
          data: data.values || [],
          backgroundColor: data.colors || this.generateColors(data.values?.length || 0),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        ...this.defaultOptions,
        ...options,
        plugins: {
          ...this.defaultOptions.plugins,
          ...options.plugins,
          tooltip: {
            ...this.defaultOptions.plugins.tooltip,
            ...options.plugins?.tooltip,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
              ...options.plugins?.tooltip?.callbacks
            }
          }
        }
      }
    });
  }

  /**
   * Create bar chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart instance
   */
  createBarChart(ctx, data, options) {
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: data.datasets || [{
          label: data.label || 'Data',
          data: data.values || [],
          backgroundColor: data.backgroundColor || 'rgba(59, 130, 246, 0.8)',
          borderColor: data.borderColor || '#2563eb',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        ...this.defaultOptions,
        ...options,
        scales: {
          y: {
            beginAtZero: true,
            ...options.scales?.y
          },
          x: {
            ...options.scales?.x
          }
        }
      }
    });
  }

  /**
   * Create line chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart instance
   */
  createLineChart(ctx, data, options) {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: data.datasets || [{
          label: data.label || 'Data',
          data: data.values || [],
          borderColor: data.borderColor || '#3b82f6',
          backgroundColor: data.backgroundColor || 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        ...this.defaultOptions,
        ...options,
        scales: {
          y: {
            beginAtZero: true,
            ...options.scales?.y
          },
          x: {
            ...options.scales?.x
          }
        }
      }
    });
  }

  /**
   * Create area chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} data - Chart data
   * @param {Object} options - Chart options
   * @returns {Object} Chart instance
   */
  createAreaChart(ctx, data, options) {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: data.datasets || [{
          label: data.label || 'Data',
          data: data.values || [],
          borderColor: data.borderColor || '#3b82f6',
          backgroundColor: data.backgroundColor || 'rgba(59, 130, 246, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        ...this.defaultOptions,
        ...options,
        scales: {
          y: {
            beginAtZero: true,
            ...options.scales?.y
          },
          x: {
            ...options.scales?.x
          }
        }
      }
    });
  }

  /**
   * Update chart data
   * @param {string} containerId - Container element ID
   * @param {Object} data - New chart data
   */
  updateChart(containerId, data) {
    const chart = this.chartInstances[containerId];
    if (!chart) {
      console.warn(`Chart Service: Chart "${containerId}" not found`);
      return;
    }

    if (data.labels) {
      chart.data.labels = data.labels;
    }

    if (data.values) {
      if (chart.data.datasets && chart.data.datasets[0]) {
        chart.data.datasets[0].data = data.values;
      }
    }

    if (data.datasets) {
      chart.data.datasets = data.datasets;
    }

    chart.update();
  }

  /**
   * Destroy chart
   * @param {string} containerId - Container element ID
   */
  destroyChart(containerId) {
    const chart = this.chartInstances[containerId];
    if (chart) {
      try {
        chart.destroy();
      } catch (error) {
        console.warn('Chart Service: Error destroying chart:', error);
      }
      delete this.chartInstances[containerId];
    }
  }

  /**
   * Destroy all charts
   */
  destroyAllCharts() {
    Object.keys(this.chartInstances).forEach(containerId => {
      this.destroyChart(containerId);
    });
  }

  /**
   * Get chart instance
   * @param {string} containerId - Container element ID
   * @returns {Object|null} Chart instance or null
   */
  getChart(containerId) {
    return this.chartInstances[containerId] || null;
  }

  /**
   * Merge default options with custom options
   * @param {string} type - Chart type
   * @param {Object} options - Custom options
   * @returns {Object} Merged options
   */
  mergeOptions(type, options) {
    const typeDefaults = {
      pie: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 },
              usePointStyle: true
            }
          }
        }
      },
      bar: {
        scales: {
          y: { beginAtZero: true }
        }
      },
      line: {
        scales: {
          y: { beginAtZero: true }
        }
      },
      area: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    return {
      ...this.defaultOptions,
      ...typeDefaults[type],
      ...options,
      plugins: {
        ...this.defaultOptions.plugins,
        ...typeDefaults[type]?.plugins,
        ...options.plugins
      }
    };
  }

  /**
   * Generate colors for chart
   * @param {number} count - Number of colors needed
   * @returns {Array} Array of color strings
   */
  generateColors(count) {
    const defaultColors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f97316', // orange
      '#84cc16', // lime
      '#ec4899', // pink
      '#6366f1'  // indigo
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(defaultColors[i % defaultColors.length]);
    }
    return colors;
  }

  /**
   * Create trend comparison chart (multiple datasets)
   * @param {string} containerId - Container element ID
   * @param {Object} data - Chart data with multiple datasets
   * @param {Object} options - Chart options
   * @returns {Object|null} Chart instance
   */
  createTrendComparison(containerId, data, options = {}) {
    if (!data.datasets || data.datasets.length === 0) {
      console.warn('Chart Service: Trend comparison requires datasets array');
      return null;
    }

    return this.createChart('line', containerId, data, {
      ...options,
      plugins: {
        ...options.plugins,
        legend: {
          position: 'top',
          ...options.plugins?.legend
        }
      }
    });
  }

  /**
   * Create drill-down chart (child chart from parent)
   * @param {string} parentContainerId - Parent chart container ID
   * @param {string} childContainerId - Child chart container ID
   * @param {Function} getChildData - Function to get child data (label, value, index, parentData) => childData
   * @param {Object} childOptions - Child chart options
   */
  setupDrillDown(parentContainerId, childContainerId, getChildData, childOptions = {}) {
    const chart = this.getChart(parentContainerId);
    if (!chart) {
      console.warn(`Chart Service: Parent chart "${parentContainerId}" not found`);
      return;
    }

    const canvas = document.getElementById(parentContainerId);
    if (!canvas) return;

    canvas.onclick = (evt) => {
      const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
      if (points.length) {
        const firstPoint = points[0];
        const label = chart.data.labels[firstPoint.index];
        const value = chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
        
        const childData = getChildData(label, value, firstPoint.index, chart.data);
        if (childData) {
          this.createChart(
            childOptions.type || 'bar',
            childContainerId,
            childData,
            {
              ...childOptions,
              onClick: childOptions.onClick
            }
          );
        }
      }
    };
  }
}

// Create singleton instance
const chartService = new ChartService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChartService, chartService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.chartService = chartService;
  window.ChartService = ChartService;
}
