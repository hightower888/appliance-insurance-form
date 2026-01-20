/**
 * Audit Viewer Component (TASK-2.5.1)
 * Display audit logs and change history from Enhanced Logger
 */

class AuditViewer {
  constructor(containerId = 'audit-viewer', options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`AuditViewer: Container with id "${containerId}" not found`);
      return;
    }

    this.options = {
      database: null,
      enhancedLogger: null,
      recordId: null,
      filters: {
        userId: null,
        startDate: null,
        endDate: null,
        field: null
      },
      pageSize: 50,
      currentPage: 1,
      ...options
    };

    this.isInitialized = false;
    this.auditLogs = [];
    this.init();
  }

  /**
   * Initialize audit viewer
   */
  init() {
    if (this.isInitialized) return;

    // Get enhanced logger if available
    if (typeof enhancedLogger !== 'undefined') {
      this.options.enhancedLogger = enhancedLogger;
    }

    this.render();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  /**
   * Set record ID to view audit logs for
   * @param {string} recordId - Record ID
   */
  setRecordId(recordId) {
    this.options.recordId = recordId;
    this.loadAuditLogs();
  }

  /**
   * Load audit logs
   */
  async loadAuditLogs() {
    if (!this.options.enhancedLogger) {
      console.warn('AuditViewer: Enhanced Logger not available');
      return;
    }

    if (!this.options.recordId) {
      this.auditLogs = [];
      this.render();
      return;
    }

    try {
      // Use generateAuditTrail from Enhanced Logger
      const options = {
        limit: this.options.pageSize,
        startDate: this.options.filters.startDate,
        endDate: this.options.filters.endDate
      };

      this.auditLogs = await this.options.enhancedLogger.generateAuditTrail(
        this.options.recordId,
        options
      );

      this.render();
    } catch (error) {
      console.error('AuditViewer: Error loading audit logs:', error);
      this.showError('Failed to load audit logs');
    }
  }

  /**
   * Render audit viewer
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="audit-viewer-container">
        <div class="audit-viewer-header">
          <h3>Audit Trail</h3>
          <div class="audit-viewer-actions">
            <button class="btn btn-sm btn-secondary" id="refreshAuditLogs">Refresh</button>
            <button class="btn btn-sm btn-primary" id="exportAuditLogs">Export CSV</button>
          </div>
        </div>
        
        <div class="audit-viewer-filters">
          <input type="date" id="auditStartDate" class="form-control" placeholder="Start Date">
          <input type="date" id="auditEndDate" class="form-control" placeholder="End Date">
          <input type="text" id="auditFieldFilter" class="form-control" placeholder="Filter by field">
          <button class="btn btn-sm btn-primary" id="applyAuditFilters">Apply Filters</button>
          <button class="btn btn-sm btn-secondary" id="clearAuditFilters">Clear</button>
        </div>

        <div class="audit-viewer-content">
          ${this.renderAuditLogs()}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render audit logs
   * @returns {string} HTML string
   */
  renderAuditLogs() {
    if (this.auditLogs.length === 0) {
      return `
        <div class="audit-viewer-empty">
          <p>No audit logs found for this record.</p>
        </div>
      `;
    }

    return `
      <div class="audit-viewer-table">
        <table class="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Field</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            ${this.auditLogs.map(log => this.renderAuditLogRow(log)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render audit log row
   * @param {Object} log - Audit log entry
   * @returns {string} HTML string
   */
  renderAuditLogRow(log) {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const field = log.field || log.fieldName || 'Unknown';
    const oldValue = this.formatValue(log.oldValue);
    const newValue = this.formatValue(log.newValue);
    const user = log.username || log.userEmail || log.userId || 'Unknown';

    return `
      <tr>
        <td>${timestamp}</td>
        <td><code>${field}</code></td>
        <td class="audit-old-value">${oldValue}</td>
        <td class="audit-new-value">${newValue}</td>
        <td>${user}</td>
      </tr>
    `;
  }

  /**
   * Format value for display
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (value === null || value === undefined) {
      return '<em>null</em>';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    if (String(value).length > 50) {
      return String(value).substring(0, 50) + '...';
    }
    return String(value);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshAuditLogs');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadAuditLogs();
      });
    }

    // Export button
    const exportBtn = document.getElementById('exportAuditLogs');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportToCSV();
      });
    }

    // Apply filters
    const applyFiltersBtn = document.getElementById('applyAuditFilters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clearAuditFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  }

  /**
   * Apply filters
   */
  applyFilters() {
    const startDate = document.getElementById('auditStartDate')?.value;
    const endDate = document.getElementById('auditEndDate')?.value;
    const fieldFilter = document.getElementById('auditFieldFilter')?.value;

    this.options.filters.startDate = startDate ? new Date(startDate) : null;
    this.options.filters.endDate = endDate ? new Date(endDate) : null;
    this.options.filters.field = fieldFilter || null;

    this.loadAuditLogs();
  }

  /**
   * Clear filters
   */
  clearFilters() {
    this.options.filters = {
      userId: null,
      startDate: null,
      endDate: null,
      field: null
    };

    const startDateInput = document.getElementById('auditStartDate');
    const endDateInput = document.getElementById('auditEndDate');
    const fieldInput = document.getElementById('auditFieldFilter');

    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (fieldInput) fieldInput.value = '';

    this.loadAuditLogs();
  }

  /**
   * Export audit logs to CSV
   */
  exportToCSV() {
    if (this.auditLogs.length === 0) {
      alert('No audit logs to export');
      return;
    }

    // Create CSV content
    const headers = ['Timestamp', 'Field', 'Old Value', 'New Value', 'User ID', 'User Email', 'Username'];
    const rows = this.auditLogs.map(log => [
      log.timestamp,
      log.field || log.fieldName || '',
      log.oldValue || '',
      log.newValue || '',
      log.userId || '',
      log.userEmail || '',
      log.username || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${this.options.recordId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuditViewer };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AuditViewer = AuditViewer;
}
