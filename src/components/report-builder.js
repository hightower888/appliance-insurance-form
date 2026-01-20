/**
 * Report Builder Component (Phase 3)
 * Custom report generation with KPIs and charts
 */

class ReportBuilder {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      kpiCalculator: options.kpiCalculator || null,
      chartService: options.chartService || null,
      onSave: options.onSave || null,
      onExport: options.onExport || null,
      ...options
    };

    this.currentReport = null;
    this.savedReports = this.loadSavedReports();
  }

  /**
   * Render the report builder
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="report-builder-container">
        <div class="report-builder-header">
          <h3>Report Builder</h3>
          <div class="report-builder-actions">
            <button class="btn btn-sm btn-secondary" id="newReportBtn">New Report</button>
            <button class="btn btn-sm btn-primary" id="saveReportBtn" style="display: none;">Save Report</button>
            <button class="btn btn-sm btn-success" id="exportReportBtn" style="display: none;">Export</button>
          </div>
        </div>

        <div class="report-builder-content">
          <div class="report-builder-sidebar">
            <h4>Saved Reports</h4>
            <div id="savedReportsList" class="saved-reports-list">
              ${this.renderSavedReports()}
            </div>

            <h4 style="margin-top: 30px;">Report Configuration</h4>
            <div id="reportConfig" class="report-config">
              ${this.renderReportConfig()}
            </div>
          </div>

          <div class="report-builder-main">
            <div id="reportPreview" class="report-preview">
              <div class="empty-state" style="text-align: center; padding: 60px; color: var(--text-secondary);">
                <p>Create a new report or load a saved report to get started</p>
                <button class="btn btn-primary" onclick="document.getElementById('newReportBtn')?.click()">Create New Report</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render saved reports list
   * @returns {string} HTML string
   */
  renderSavedReports() {
    if (this.savedReports.length === 0) {
      return '<p style="color: var(--text-secondary); font-size: 14px;">No saved reports</p>';
    }

    return this.savedReports.map((report, index) => `
      <div class="saved-report-item" data-report-index="${index}">
        <div class="saved-report-name">${this.escapeHtml(report.name)}</div>
        <div class="saved-report-actions">
          <button class="btn btn-xs btn-primary" onclick="this.closest('.report-builder-container').__reportBuilder?.loadReport(${index})">Load</button>
          <button class="btn btn-xs btn-danger" onclick="this.closest('.report-builder-container').__reportBuilder?.deleteReport(${index})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render report configuration
   * @returns {string} HTML string
   */
  renderReportConfig() {
    return `
      <div class="config-section">
        <label>Report Name</label>
        <input type="text" id="reportName" class="form-control" placeholder="My Custom Report">
      </div>

      <div class="config-section">
        <label>KPIs to Include</label>
        <div class="checkbox-group">
          <label><input type="checkbox" name="kpis" value="ltv" checked> Customer LTV</label>
          <label><input type="checkbox" name="kpis" value="retention" checked> Retention Rate</label>
          <label><input type="checkbox" name="kpis" value="churn"> Churn Rate</label>
          <label><input type="checkbox" name="kpis" value="arpc" checked> ARPC</label>
          <label><input type="checkbox" name="kpis" value="agent"> Agent Metrics</label>
        </div>
      </div>

      <div class="config-section">
        <label>Chart Types</label>
        <div class="checkbox-group">
          <label><input type="checkbox" name="charts" value="pie"> Pie Chart</label>
          <label><input type="checkbox" name="charts" value="bar" checked> Bar Chart</label>
          <label><input type="checkbox" name="charts" value="line" checked> Line Chart</label>
          <label><input type="checkbox" name="charts" value="area"> Area Chart</label>
        </div>
      </div>

      <div class="config-section">
        <label>Date Range</label>
        <input type="date" id="reportDateFrom" class="form-control">
        <input type="date" id="reportDateTo" class="form-control" style="margin-top: 10px;">
      </div>

      <div class="config-section">
        <button class="btn btn-primary" id="generateReportBtn">Generate Report</button>
      </div>
    `;
  }

  /**
   * Generate report
   */
  async generateReport() {
    if (!this.options.kpiCalculator || !this.options.chartService) {
      this.showError('KPI Calculator or Chart Service not available');
      return;
    }

    const reportName = document.getElementById('reportName')?.value || 'Untitled Report';
    const selectedKPIs = Array.from(document.querySelectorAll('input[name="kpis"]:checked')).map(cb => cb.value);
    const selectedCharts = Array.from(document.querySelectorAll('input[name="charts"]:checked')).map(cb => cb.value);
    const dateFrom = document.getElementById('reportDateFrom')?.value;
    const dateTo = document.getElementById('reportDateTo')?.value;

    if (selectedKPIs.length === 0) {
      this.showError('Please select at least one KPI');
      return;
    }

    try {
      const preview = document.getElementById('reportPreview');
      if (preview) {
        preview.innerHTML = '<div class="loading-container" style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Generating report...</p></div>';
      }

      // Calculate KPIs
      const kpis = await this.options.kpiCalculator.calculateAllKPIs({
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null
      });

      // Build report HTML
      let reportHtml = `
        <div class="generated-report">
          <div class="report-header">
            <h2>${this.escapeHtml(reportName)}</h2>
            <p class="report-date">Generated: ${new Date().toLocaleString()}</p>
          </div>

          <div class="report-kpis">
            <h3>Key Performance Indicators</h3>
            <div class="kpi-grid">
              ${this.renderKPIs(kpis, selectedKPIs)}
            </div>
          </div>

          <div class="report-charts">
            <h3>Charts</h3>
            <div class="chart-grid">
              ${await this.renderCharts(kpis, selectedCharts)}
            </div>
          </div>
        </div>
      `;

      if (preview) {
        preview.innerHTML = reportHtml;
      }

      // Store current report
      this.currentReport = {
        name: reportName,
        kpis: selectedKPIs,
        charts: selectedCharts,
        dateFrom,
        dateTo,
        data: kpis,
        html: reportHtml
      };

      // Show save/export buttons
      const saveBtn = document.getElementById('saveReportBtn');
      const exportBtn = document.getElementById('exportReportBtn');
      if (saveBtn) saveBtn.style.display = 'inline-block';
      if (exportBtn) exportBtn.style.display = 'inline-block';

    } catch (error) {
      console.error('Error generating report:', error);
      this.showError(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Render KPIs
   * @param {Object} kpis - KPI data
   * @param {Array} selected - Selected KPI keys
   * @returns {string} HTML string
   */
  renderKPIs(kpis, selected) {
    const kpiLabels = {
      ltv: 'Customer LTV',
      retention: 'Retention Rate',
      churn: 'Churn Rate',
      arpc: 'ARPC',
      agent: 'Agent Metrics'
    };

    return selected.map(key => {
      const value = kpis[key];
      if (value === undefined || value === null) return '';

      let displayValue = value;
      if (typeof value === 'number') {
        if (key === 'ltv' || key === 'arpc') {
          displayValue = `£${value.toFixed(2)}`;
        } else if (key === 'retention' || key === 'churn') {
          displayValue = `${(value * 100).toFixed(1)}%`;
        }
      }

      return `
        <div class="kpi-card">
          <div class="kpi-label">${kpiLabels[key] || key}</div>
          <div class="kpi-value">${displayValue}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render charts
   * @param {Object} kpis - KPI data
   * @param {Array} selected - Selected chart types
   * @returns {string} HTML string
   */
  async renderCharts(kpis, selected) {
    if (!this.options.chartService || selected.length === 0) {
      return '';
    }

    const charts = [];
    for (const chartType of selected) {
      const chartId = `chart-${chartType}-${Date.now()}`;
      const chartContainer = document.createElement('div');
      chartContainer.id = chartId;
      chartContainer.className = 'chart-container';

      try {
        // Create chart based on type
        if (chartType === 'pie') {
          await this.options.chartService.createPieChart(chartId, {
            labels: Object.keys(kpis),
            data: Object.values(kpis).map(v => typeof v === 'number' ? v : 0)
          });
        } else if (chartType === 'bar') {
          await this.options.chartService.createBarChart(chartId, {
            labels: Object.keys(kpis),
            data: Object.values(kpis).map(v => typeof v === 'number' ? v : 0)
          });
        } else if (chartType === 'line') {
          await this.options.chartService.createLineChart(chartId, {
            labels: Object.keys(kpis),
            data: Object.values(kpis).map(v => typeof v === 'number' ? v : 0)
          });
        } else if (chartType === 'area') {
          await this.options.chartService.createAreaChart(chartId, {
            labels: Object.keys(kpis),
            data: Object.values(kpis).map(v => typeof v === 'number' ? v : 0)
          });
        }

        charts.push(`<div class="chart-wrapper">${chartContainer.outerHTML}</div>`);
      } catch (error) {
        console.error(`Error creating ${chartType} chart:`, error);
      }
    }

    return charts.join('');
  }

  /**
   * Save current report
   */
  saveReport() {
    if (!this.currentReport) {
      this.showError('No report to save');
      return;
    }

    const reportName = document.getElementById('reportName')?.value || this.currentReport.name;
    if (!reportName) {
      this.showError('Please enter a report name');
      return;
    }

    const report = {
      ...this.currentReport,
      name: reportName,
      savedAt: Date.now()
    };

    this.savedReports.push(report);
    this.saveSavedReports();

    // Update UI
    const savedList = document.getElementById('savedReportsList');
    if (savedList) {
      savedList.innerHTML = this.renderSavedReports();
    }

    if (this.options.onSave) {
      this.options.onSave(report);
    }

    console.log('Report saved:', reportName);
  }

  /**
   * Load saved report
   * @param {number} index - Report index
   */
  loadReport(index) {
    const report = this.savedReports[index];
    if (!report) return;

    // Set form values
    if (document.getElementById('reportName')) {
      document.getElementById('reportName').value = report.name;
    }

    // Set checkboxes
    report.kpis.forEach(kpi => {
      const checkbox = document.querySelector(`input[name="kpis"][value="${kpi}"]`);
      if (checkbox) checkbox.checked = true;
    });

    report.charts.forEach(chart => {
      const checkbox = document.querySelector(`input[name="charts"][value="${chart}"]`);
      if (checkbox) checkbox.checked = true;
    });

    // Set dates
    if (report.dateFrom && document.getElementById('reportDateFrom')) {
      document.getElementById('reportDateFrom').value = report.dateFrom;
    }
    if (report.dateTo && document.getElementById('reportDateTo')) {
      document.getElementById('reportDateTo').value = report.dateTo;
    }

    // Render preview
    const preview = document.getElementById('reportPreview');
    if (preview && report.html) {
      preview.innerHTML = report.html;
    }

    this.currentReport = report;

    // Show buttons
    const saveBtn = document.getElementById('saveReportBtn');
    const exportBtn = document.getElementById('exportReportBtn');
    if (saveBtn) saveBtn.style.display = 'inline-block';
    if (exportBtn) exportBtn.style.display = 'inline-block';
  }

  /**
   * Delete saved report
   * @param {number} index - Report index
   */
  deleteReport(index) {
    if (confirm('Are you sure you want to delete this report?')) {
      this.savedReports.splice(index, 1);
      this.saveSavedReports();

      const savedList = document.getElementById('savedReportsList');
      if (savedList) {
        savedList.innerHTML = this.renderSavedReports();
      }
    }
  }

  /**
   * Export current report
   */
  exportReport() {
    if (!this.currentReport) {
      this.showError('No report to export');
      return;
    }

    if (this.options.onExport) {
      this.options.onExport(this.currentReport);
    } else {
      // Default: open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${this.escapeHtml(this.currentReport.name)}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .kpi-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                .chart-container { margin: 20px 0; }
              </style>
            </head>
            <body>
              ${this.currentReport.html}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  /**
   * Load saved reports from localStorage
   * @returns {Array} Saved reports
   */
  loadSavedReports() {
    try {
      const saved = localStorage.getItem('savedReports');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved reports:', error);
      return [];
    }
  }

  /**
   * Save reports to localStorage
   */
  saveSavedReports() {
    try {
      localStorage.setItem('savedReports', JSON.stringify(this.savedReports));
    } catch (error) {
      console.error('Error saving reports:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Store reference
    if (this.container) {
      const container = this.container.querySelector('.report-builder-container');
      if (container) {
        container.__reportBuilder = this;
      }
    }

    // New report
    const newBtn = document.getElementById('newReportBtn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        this.currentReport = null;
        document.getElementById('reportPreview').innerHTML = '<div class="empty-state">Create a new report</div>';
        document.getElementById('saveReportBtn').style.display = 'none';
        document.getElementById('exportReportBtn').style.display = 'none';
      });
    }

    // Generate report
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateReport();
      });
    }

    // Save report
    const saveBtn = document.getElementById('saveReportBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveReport();
      });
    }

    // Export report
    const exportBtn = document.getElementById('exportReportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportReport();
      });
    }
  }

  /**
   * Show error
   * @param {string} message - Error message
   */
  showError(message) {
    const preview = document.getElementById('reportPreview');
    if (preview) {
      preview.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 40px;">
          <p style="color: var(--error-color, #dc2626);">${this.escapeHtml(message)}</p>
        </div>
      `;
    }
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReportBuilder };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ReportBuilder = ReportBuilder;
}
