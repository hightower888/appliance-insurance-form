/**
 * History Viewer Component (TASK-2.6.1)
 * Display change history per record with restore functionality
 */

class HistoryViewer {
  constructor(containerId = 'history-viewer', options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`HistoryViewer: Container with id "${containerId}" not found`);
      return;
    }

    this.options = {
      database: null,
      enhancedLogger: null,
      recordId: null,
      onRestore: null,
      ...options
    };

    this.isInitialized = false;
    this.history = [];
    this.init();
  }

  /**
   * Initialize history viewer
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
   * Set record ID to view history for
   * @param {string} recordId - Record ID
   */
  setRecordId(recordId) {
    this.options.recordId = recordId;
    this.loadHistory();
  }

  /**
   * Load history for current record
   */
  async loadHistory() {
    if (!this.options.enhancedLogger) {
      console.warn('HistoryViewer: Enhanced Logger not available');
      return;
    }

    if (!this.options.recordId) {
      this.history = [];
      this.render();
      return;
    }

    try {
      // Use generateAuditTrail from Enhanced Logger
      this.history = await this.options.enhancedLogger.generateAuditTrail(
        this.options.recordId,
        { limit: 100 } // Get last 100 changes
      );

      // Group by timestamp to create versions
      this.history = this.groupIntoVersions(this.history);
      
      this.render();
    } catch (error) {
      console.error('HistoryViewer: Error loading history:', error);
      this.showError('Failed to load history');
    }
  }

  /**
   * Group history changes into versions
   * @param {Array} changes - Array of change entries
   * @returns {Array} Grouped versions
   */
  groupIntoVersions(changes) {
    if (changes.length === 0) return [];

    // Group changes by timestamp (within 1 second = same version)
    const versions = [];
    let currentVersion = null;

    changes.forEach(change => {
      const changeTime = new Date(change.timestamp).getTime();
      
      if (!currentVersion || 
          (changeTime - new Date(currentVersion.timestamp).getTime()) > 1000) {
        // New version
        currentVersion = {
          timestamp: change.timestamp,
          userId: change.userId,
          userEmail: change.userEmail,
          username: change.username,
          changes: [change]
        };
        versions.push(currentVersion);
      } else {
        // Add to current version
        currentVersion.changes.push(change);
      }
    });

    return versions;
  }

  /**
   * Render history viewer
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="history-viewer-container">
        <div class="history-viewer-header">
          <h3>Change History</h3>
          <div class="history-viewer-actions">
            <button class="btn btn-sm btn-secondary" id="refreshHistory">Refresh</button>
          </div>
        </div>
        
        <div class="history-viewer-content">
          ${this.renderHistory()}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render history list
   * @returns {string} HTML string
   */
  renderHistory() {
    if (this.history.length === 0) {
      return `
        <div class="history-viewer-empty">
          <p>No change history found for this record.</p>
        </div>
      `;
    }

    return `
      <div class="history-viewer-list">
        ${this.history.map((version, index) => this.renderVersion(version, index)).join('')}
      </div>
    `;
  }

  /**
   * Render version entry
   * @param {Object} version - Version object
   * @param {number} index - Version index
   * @returns {string} HTML string
   */
  renderVersion(version, index) {
    const timestamp = new Date(version.timestamp).toLocaleString();
    const user = version.username || version.userEmail || version.userId || 'Unknown';
    const isLatest = index === 0;
    const changeCount = version.changes.length;

    return `
      <div class="history-version ${isLatest ? 'latest' : ''}" data-version-index="${index}">
        <div class="history-version-header">
          <div class="history-version-info">
            <span class="history-version-time">${timestamp}</span>
            <span class="history-version-user">by ${this.escapeHtml(user)}</span>
            ${isLatest ? '<span class="history-version-badge">Current</span>' : ''}
          </div>
          <div class="history-version-actions">
            ${!isLatest ? `<button class="btn btn-sm btn-primary history-restore-btn" data-version-index="${index}">Restore</button>` : ''}
            <button class="btn btn-sm btn-secondary history-expand-btn" data-version-index="${index}">
              ${changeCount} change${changeCount === 1 ? '' : 's'}
            </button>
          </div>
        </div>
        <div class="history-version-changes" id="history-changes-${index}" style="display: none;">
          ${version.changes.map(change => this.renderChange(change)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render individual change
   * @param {Object} change - Change object
   * @returns {string} HTML string
   */
  renderChange(change) {
    const field = change.field || change.fieldName || 'Unknown';
    const oldValue = this.formatValue(change.oldValue);
    const newValue = this.formatValue(change.newValue);

    return `
      <div class="history-change">
        <div class="history-change-field">
          <code>${this.escapeHtml(field)}</code>
          ${typeof diffViewer !== 'undefined' && diffViewer ? 
            `<button class="btn btn-xs btn-secondary" onclick="if(typeof diffViewer !== 'undefined' && diffViewer) { diffViewer.render('${this.options.recordId}', '${this.escapeHtml(field)}', ${JSON.stringify(change.oldValue)}, ${JSON.stringify(change.newValue)}); }">View Diff</button>` 
            : ''}
        </div>
        <div class="history-change-values">
          <span class="history-change-old">${oldValue}</span>
          <span class="history-change-arrow">→</span>
          <span class="history-change-new">${newValue}</span>
        </div>
      </div>
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
      return `<code>${this.escapeHtml(JSON.stringify(value).substring(0, 50))}...</code>`;
    }
    const str = String(value);
    if (str.length > 50) {
      return `<code>${this.escapeHtml(str.substring(0, 50))}...</code>`;
    }
    return `<code>${this.escapeHtml(str)}</code>`;
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

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshHistory');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadHistory();
      });
    }

    // Expand/collapse buttons
    const expandBtns = this.container.querySelectorAll('.history-expand-btn');
    expandBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = btn.getAttribute('data-version-index');
        const changesDiv = document.getElementById(`history-changes-${index}`);
        if (changesDiv) {
          const isVisible = changesDiv.style.display !== 'none';
          changesDiv.style.display = isVisible ? 'none' : 'block';
          btn.textContent = isVisible ? 
            `${this.history[index].changes.length} change${this.history[index].changes.length === 1 ? '' : 's'}` :
            'Hide changes';
        }
      });
    });

    // Restore buttons
    const restoreBtns = this.container.querySelectorAll('.history-restore-btn');
    restoreBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.getAttribute('data-version-index'));
        this.restoreVersion(index);
      });
    });
  }

  /**
   * Restore to a previous version
   * @param {number} versionIndex - Version index to restore
   */
  async restoreVersion(versionIndex) {
    if (versionIndex < 0 || versionIndex >= this.history.length) {
      console.error('HistoryViewer: Invalid version index');
      return;
    }

    const version = this.history[versionIndex];
    if (!version || !this.options.recordId) {
      console.error('HistoryViewer: Invalid version or record ID');
      return;
    }

    // Show confirmation
    const confirmed = confirm(
      `Are you sure you want to restore this record to the state from ${new Date(version.timestamp).toLocaleString()}?\n\n` +
      `This will revert ${version.changes.length} change${version.changes.length === 1 ? '' : 's'}.`
    );

    if (!confirmed) return;

    try {
      // Reconstruct previous state from changes
      const restoreData = {};
      version.changes.forEach(change => {
        const field = change.field || change.fieldName;
        if (field) {
          // Set field to old value
          this.setNestedValue(restoreData, field, change.oldValue);
        }
      });

      // Call restore callback
      if (this.options.onRestore) {
        await this.options.onRestore(this.options.recordId, restoreData, version);
      } else {
        // Default: update in database
        if (this.options.database) {
          const updates = {};
          Object.entries(restoreData).forEach(([field, value]) => {
            updates[`sales/${this.options.recordId}/${field}`] = value;
          });
          await this.options.database.ref().update(updates);
        }
      }

      // Reload history
      await this.loadHistory();
      
      // Show success
      this.showSuccess('Record restored successfully');
    } catch (error) {
      console.error('HistoryViewer: Error restoring version:', error);
      this.showError('Failed to restore version');
    }
  }

  /**
   * Set nested value in object
   * @param {Object} obj - Object to set value in
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'alert alert-success';
    msgDiv.textContent = message;
    this.container.appendChild(msgDiv);
    
    setTimeout(() => {
      if (msgDiv.parentNode) {
        msgDiv.parentNode.removeChild(msgDiv);
      }
    }, 3000);
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'alert alert-error';
    msgDiv.textContent = message;
    this.container.appendChild(msgDiv);
    
    setTimeout(() => {
      if (msgDiv.parentNode) {
        msgDiv.parentNode.removeChild(msgDiv);
      }
    }, 5000);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HistoryViewer };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.HistoryViewer = HistoryViewer;
}
