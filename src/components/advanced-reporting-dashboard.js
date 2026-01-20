/**
 * Advanced Reporting Dashboard Component (Phase 4B)
 * Comprehensive analytics and reporting dashboard
 */

class AdvancedReportingDashboard {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      leads: options.leads || [],
      onRefresh: options.onRefresh || null,
      ...options
    };

    this.charts = {};
  }

  /**
   * Render dashboard
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="advanced-reporting-dashboard">
        <div class="dashboard-header">
          <h3>Advanced Analytics Dashboard</h3>
          <div class="dashboard-actions">
            <button class="btn btn-secondary" id="refreshDashboardBtn">Refresh</button>
            <button class="btn btn-secondary" id="exportDashboardBtn">Export Report</button>
          </div>
        </div>

        <div class="dashboard-content">
          <div class="dashboard-grid">
            ${this.renderKPICards()}
            ${this.renderCharts()}
            ${this.renderInsights()}
            ${this.renderPredictions()}
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderCharts();
  }

  /**
   * Render KPI cards
   * @returns {string} HTML
   */
  renderKPICards() {
    const leads = this.options.leads || [];
    const total = leads.length;
    const converted = leads.filter(l => l.leadStatus === 'converted' || l.submittedAt).length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

    // Calculate average score if scoring service available
    let avgScore = 0;
    if (typeof LeadScoringService !== 'undefined' && leads.length > 0) {
      const scoringService = new LeadScoringService();
      const scores = leads.map(l => scoringService.scoreLead(l).totalScore);
      avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    }

    // Calculate high-risk count
    let highRiskCount = 0;
    if (typeof ChurnPredictionService !== 'undefined' && leads.length > 0) {
      const churnService = new ChurnPredictionService();
      highRiskCount = churnService.getHighRiskLeads(leads, 100).length;
    }

    return `
      <div class="kpi-cards">
        <div class="kpi-card">
          <div class="kpi-label">Total Leads</div>
          <div class="kpi-value">${total}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Conversion Rate</div>
          <div class="kpi-value">${conversionRate}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Avg Lead Score</div>
          <div class="kpi-value">${avgScore.toFixed(0)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">High Risk Leads</div>
          <div class="kpi-value">${highRiskCount}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render charts section
   * @returns {string} HTML
   */
  renderCharts() {
    return `
      <div class="charts-section">
        <div class="chart-container">
          <h4>Lead Score Distribution</h4>
          <canvas id="scoreDistributionChart"></canvas>
        </div>
        <div class="chart-container">
          <h4>Churn Risk Analysis</h4>
          <canvas id="churnRiskChart"></canvas>
        </div>
        <div class="chart-container">
          <h4>Conversion Funnel</h4>
          <canvas id="conversionFunnelChart"></canvas>
        </div>
        <div class="chart-container">
          <h4>Disposition Trends</h4>
          <canvas id="dispositionTrendsChart"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Render insights section
   * @returns {string} HTML
   */
  renderInsights() {
    let insights = [];
    if (typeof AutomatedInsightsService !== 'undefined') {
      const insightsService = new AutomatedInsightsService();
      insights = insightsService.generateInsights(this.options.leads || []);
    }

    return `
      <div class="insights-section">
        <h4>Automated Insights</h4>
        <div class="insights-list">
          ${insights.slice(0, 5).map(insight => `
            <div class="insight-item insight-${insight.type} insight-${insight.priority}">
              <div class="insight-icon">${this.getInsightIcon(insight.type)}</div>
              <div class="insight-content">
                <div class="insight-title">${this.escapeHtml(insight.title)}</div>
                <div class="insight-message">${this.escapeHtml(insight.message)}</div>
                ${insight.action ? `<div class="insight-action">${this.escapeHtml(insight.action)}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render predictions section
   * @returns {string} HTML
   */
  renderPredictions() {
    const leads = this.options.leads || [];
    
    // Get top scored leads
    let topLeads = [];
    if (typeof LeadScoringService !== 'undefined' && leads.length > 0) {
      const scoringService = new LeadScoringService();
      topLeads = scoringService.getTopLeads(leads, 5);
    }

    // Get high-risk leads
    let highRiskLeads = [];
    if (typeof ChurnPredictionService !== 'undefined' && leads.length > 0) {
      const churnService = new ChurnPredictionService();
      highRiskLeads = churnService.getHighRiskLeads(leads, 5);
    }

    return `
      <div class="predictions-section">
        <div class="prediction-group">
          <h4>Top Scored Leads</h4>
          <div class="prediction-list">
            ${topLeads.map(lead => `
              <div class="prediction-item">
                <div class="prediction-name">${this.escapeHtml(lead.contact?.name || 'Unknown')}</div>
                <div class="prediction-score">Score: ${lead.score?.totalScore || 0} (${lead.score?.grade || 'N/A'})</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="prediction-group">
          <h4>High Churn Risk</h4>
          <div class="prediction-list">
            ${highRiskLeads.map(lead => `
              <div class="prediction-item prediction-risk-${lead.churnPrediction?.riskLevel || 'unknown'}">
                <div class="prediction-name">${this.escapeHtml(lead.contact?.name || 'Unknown')}</div>
                <div class="prediction-score">Risk: ${lead.churnPrediction?.riskScore || 0}% (${lead.churnPrediction?.riskLevel || 'N/A'})</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render charts using Chart.js
   */
  renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not available');
      return;
    }

    const leads = this.options.leads || [];

    // Score Distribution Chart
    this.renderScoreDistributionChart(leads);
    
    // Churn Risk Chart
    this.renderChurnRiskChart(leads);
    
    // Conversion Funnel Chart
    this.renderConversionFunnelChart(leads);
    
    // Disposition Trends Chart
    this.renderDispositionTrendsChart(leads);
  }

  /**
   * Render score distribution chart
   * @param {Array} leads - Leads array
   */
  renderScoreDistributionChart(leads) {
    const canvas = document.getElementById('scoreDistributionChart');
    if (!canvas) return;

    if (this.charts.scoreDistribution) {
      this.charts.scoreDistribution.destroy();
    }

    if (typeof LeadScoringService === 'undefined' || leads.length === 0) {
      return;
    }

    const scoringService = new LeadScoringService();
    const scores = leads.map(l => scoringService.scoreLead(l).totalScore);
    
    const bins = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    scores.forEach(score => {
      if (score <= 20) bins['0-20']++;
      else if (score <= 40) bins['21-40']++;
      else if (score <= 60) bins['41-60']++;
      else if (score <= 80) bins['61-80']++;
      else bins['81-100']++;
    });

    this.charts.scoreDistribution = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(bins),
        datasets: [{
          label: 'Lead Count',
          data: Object.values(bins),
          backgroundColor: 'rgba(59, 130, 246, 0.5)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Render churn risk chart
   * @param {Array} leads - Leads array
   */
  renderChurnRiskChart(leads) {
    const canvas = document.getElementById('churnRiskChart');
    if (!canvas) return;

    if (this.charts.churnRisk) {
      this.charts.churnRisk.destroy();
    }

    if (typeof ChurnPredictionService === 'undefined' || leads.length === 0) {
      return;
    }

    const churnService = new ChurnPredictionService();
    const risks = leads.map(l => churnService.predictChurn(l).riskLevel);
    
    const riskCounts = { high: 0, medium: 0, low: 0, minimal: 0 };
    risks.forEach(risk => {
      riskCounts[risk] = (riskCounts[risk] || 0) + 1;
    });

    this.charts.churnRisk = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(riskCounts).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        datasets: [{
          data: Object.values(riskCounts),
          backgroundColor: [
            'rgba(239, 68, 68, 0.7)',  // high - red
            'rgba(245, 158, 11, 0.7)', // medium - orange
            'rgba(59, 130, 246, 0.7)', // low - blue
            'rgba(16, 185, 129, 0.7)'  // minimal - green
          ]
        }]
      },
      options: {
        responsive: true
      }
    });
  }

  /**
   * Render conversion funnel chart
   * @param {Array} leads - Leads array
   */
  renderConversionFunnelChart(leads) {
    const canvas = document.getElementById('conversionFunnelChart');
    if (!canvas) return;

    if (this.charts.conversionFunnel) {
      this.charts.conversionFunnel.destroy();
    }

    const total = leads.length;
    const newLeads = leads.filter(l => l.leadStatus === 'new').length;
    const contacted = leads.filter(l => l.leadStatus === 'contacted').length;
    const dispositioned = leads.filter(l => l.leadStatus === 'dispositioned').length;
    const converted = leads.filter(l => l.leadStatus === 'converted' || l.submittedAt).length;

    this.charts.conversionFunnel = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['New', 'Contacted', 'Dispositioned', 'Converted'],
        datasets: [{
          label: 'Leads',
          data: [newLeads, contacted, dispositioned, converted],
          backgroundColor: 'rgba(16, 185, 129, 0.7)'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  /**
   * Render disposition trends chart
   * @param {Array} leads - Leads array
   */
  renderDispositionTrendsChart(leads) {
    const canvas = document.getElementById('dispositionTrendsChart');
    if (!canvas) return;

    if (this.charts.dispositionTrends) {
      this.charts.dispositionTrends.destroy();
    }

    const dispositionCounts = {};
    leads.forEach(lead => {
      const disp = lead.disposition || 'none';
      dispositionCounts[disp] = (dispositionCounts[disp] || 0) + 1;
    });

    this.charts.dispositionTrends = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: Object.keys(dispositionCounts).map(k => k.replace('_', ' ')),
        datasets: [{
          data: Object.values(dispositionCounts),
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(139, 92, 246, 0.7)'
          ]
        }]
      },
      options: {
        responsive: true
      }
    });
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
   * Setup event listeners
   */
  setupEventListeners() {
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.options.onRefresh) {
          this.options.onRefresh();
        }
        this.render();
      });
    }

    const exportBtn = document.getElementById('exportDashboardBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportReport());
    }
  }

  /**
   * Export report
   */
  exportReport() {
    // Placeholder - would generate PDF or CSV report
    console.log('Exporting advanced report...');
    if (typeof showCRMMessage === 'function') {
      showCRMMessage('Report export feature coming soon', 'info');
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
  module.exports = { AdvancedReportingDashboard };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AdvancedReportingDashboard = AdvancedReportingDashboard;
}
