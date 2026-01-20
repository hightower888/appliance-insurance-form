/**
 * Diff Viewer Component (Phase 3)
 * Displays before/after comparison of field changes
 */

class DiffViewer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      logger: options.logger || null,
      onRestore: options.onRestore || null,
      ...options
    };
  }

  /**
   * Render diff view for a record
   * @param {string} recordId - Record ID
   * @param {string} fieldName - Field name to show diff for (optional)
   * @param {Object} oldValue - Old value
   * @param {Object} newValue - New value
   */
  async render(recordId, fieldName = null, oldValue = null, newValue = null) {
    if (!this.container) return;

    // If values provided directly, use them
    if (oldValue !== null && newValue !== null) {
      this.renderDiff(fieldName || 'value', oldValue, newValue);
      return;
    }

    // Otherwise, load from logger
    if (!this.options.logger || !recordId) {
      this.showError('Logger or record ID not provided');
      return;
    }

    try {
      this.showLoading();

      // Get audit trail
      const auditTrail = await this.options.logger.generateAuditTrail(recordId, {
        limit: 50
      });

      if (!auditTrail || auditTrail.length === 0) {
        this.showEmpty('No changes found for this record');
        return;
      }

      // Group changes by field if fieldName not specified
      if (fieldName) {
        const fieldChanges = auditTrail.filter(change => change.fieldName === fieldName);
        if (fieldChanges.length > 0) {
          const latest = fieldChanges[fieldChanges.length - 1];
          this.renderDiff(fieldName, latest.oldValue, latest.newValue);
        } else {
          this.showEmpty(`No changes found for field: ${fieldName}`);
        }
      } else {
        // Show all field changes
        this.renderAllDiffs(auditTrail);
      }
    } catch (error) {
      console.error('Error loading diff:', error);
      this.showError(`Failed to load changes: ${error.message}`);
    }
  }

  /**
   * Render diff for a single field
   * @param {string} fieldName - Field name
   * @param {*} oldValue - Old value
   * @param {*} newValue - New value
   */
  renderDiff(fieldName, oldValue, newValue) {
    if (!this.container) return;

    const oldStr = this.formatValue(oldValue);
    const newStr = this.formatValue(newValue);

    this.container.innerHTML = `
      <div class="diff-viewer-container">
        <div class="diff-viewer-header">
          <h3>Change: ${this.escapeHtml(fieldName)}</h3>
        </div>
        <div class="diff-viewer-content">
          <div class="diff-viewer-side">
            <div class="diff-viewer-label">Before</div>
            <div class="diff-viewer-value diff-viewer-old">
              ${this.highlightRemoved(oldStr)}
            </div>
          </div>
          <div class="diff-viewer-side">
            <div class="diff-viewer-label">After</div>
            <div class="diff-viewer-value diff-viewer-new">
              ${this.highlightAdded(newStr)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render all field diffs
   * @param {Array} auditTrail - Audit trail data
   */
  renderAllDiffs(auditTrail) {
    if (!this.container) return;

    // Group by field
    const fieldGroups = {};
    auditTrail.forEach(change => {
      if (!fieldGroups[change.fieldName]) {
        fieldGroups[change.fieldName] = [];
      }
      fieldGroups[change.fieldName].push(change);
    });

    const diffsHtml = Object.entries(fieldGroups).map(([fieldName, changes]) => {
      const latest = changes[changes.length - 1];
      const oldStr = this.formatValue(latest.oldValue);
      const newStr = this.formatValue(latest.newValue);

      return `
        <div class="diff-viewer-item">
          <div class="diff-viewer-item-header">
            <h4>${this.escapeHtml(fieldName)}</h4>
            <span class="diff-viewer-item-count">${changes.length} change${changes.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="diff-viewer-content">
            <div class="diff-viewer-side">
              <div class="diff-viewer-label">Before</div>
              <div class="diff-viewer-value diff-viewer-old">
                ${this.highlightRemoved(oldStr)}
              </div>
            </div>
            <div class="diff-viewer-side">
              <div class="diff-viewer-label">After</div>
              <div class="diff-viewer-value diff-viewer-new">
                ${this.highlightAdded(newStr)}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="diff-viewer-container">
        <div class="diff-viewer-header">
          <h3>All Changes</h3>
          <div class="diff-viewer-actions">
            <button class="btn btn-sm btn-secondary" id="refreshDiff">Refresh</button>
          </div>
        </div>
        <div class="diff-viewer-list">
          ${diffsHtml}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Format value for display
   * @param {*} value - Value to format
   * @returns {string} Formatted string
   */
  formatValue(value) {
    if (value === null || value === undefined) {
      return '<em>empty</em>';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  /**
   * Highlight removed text
   * @param {string} text - Text to highlight
   * @returns {string} HTML with highlights
   */
  highlightRemoved(text) {
    return `<span class="diff-removed">${this.escapeHtml(text)}</span>`;
  }

  /**
   * Highlight added text
   * @param {string} text - Text to highlight
   * @returns {string} HTML with highlights
   */
  highlightAdded(text) {
    return `<span class="diff-added">${this.escapeHtml(text)}</span>`;
  }

  /**
   * Escape HTML
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="loading-container" style="text-align: center; padding: 40px;">
          <div class="spinner" style="margin: 0 auto 20px;"></div>
          <p style="color: var(--text-secondary);">Loading changes...</p>
        </div>
      `;
    }
  }

  /**
   * Show empty state
   * @param {string} message - Message to display
   */
  showEmpty(message = 'No changes to display') {
    if (this.container) {
      this.container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <p style="font-size: 16px; margin: 0;">${this.escapeHtml(message)}</p>
        </div>
      `;
    }
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  showError(message = 'An error occurred') {
    if (this.container) {
      this.container.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 40px;">
          <p style="color: var(--error-color, #dc2626); font-size: 16px; margin-bottom: 15px;">${this.escapeHtml(message)}</p>
          <button class="btn btn-primary" onclick="location.reload()">Reload</button>
        </div>
      `;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const refreshBtn = this.container.querySelector('#refreshDiff');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        // Re-render if we have the record ID
        const recordId = this.currentRecordId;
        if (recordId) {
          this.render(recordId);
        }
      });
    }
  }

  /**
   * Store current record ID for refresh
   * @param {string} recordId - Record ID
   */
  setRecordId(recordId) {
    this.currentRecordId = recordId;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DiffViewer };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DiffViewer = DiffViewer;
}
