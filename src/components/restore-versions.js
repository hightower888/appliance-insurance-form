/**
 * Restore Previous Versions Component (Phase 3 Remaining)
 * Restore records to previous versions using audit trail
 */

class RestoreVersions {
  constructor(options = {}) {
    this.options = {
      recordId: options.recordId || null,
      recordType: options.recordType || 'lead',
      onRestore: options.onRestore || null,
      ...options
    };
    
    this.versions = [];
    this.currentVersion = null;
  }

  /**
   * Load version history for a record
   * @param {string} recordId - Record ID
   * @param {string} recordType - Record type (lead, customer, etc.)
   */
  async loadVersions(recordId, recordType = 'lead') {
    if (!recordId) {
      console.warn('RestoreVersions: Record ID required');
      return;
    }

    this.options.recordId = recordId;
    this.options.recordType = recordType;

    try {
      // Load history from Enhanced Logger
      if (typeof enhancedLogger === 'undefined' || !enhancedLogger) {
        console.warn('RestoreVersions: Enhanced Logger not available');
        return;
      }

      const history = await enhancedLogger.getHistory(recordId, recordType);
      
      if (!history || history.length === 0) {
        this.versions = [];
        return;
      }

      // Group changes by timestamp to create version snapshots
      this.versions = this.groupChangesByVersion(history);
      
      // Get current version from Firebase
      await this.loadCurrentVersion(recordId);
      
      console.log(`RestoreVersions: Loaded ${this.versions.length} versions for ${recordId}`);
    } catch (error) {
      console.error('RestoreVersions: Error loading versions:', error);
      this.versions = [];
    }
  }

  /**
   * Group changes by timestamp to create version snapshots
   * @param {Array} history - History entries
   * @returns {Array} Version snapshots
   */
  groupChangesByVersion(history) {
    const versionMap = new Map();
    
    // Sort by timestamp (oldest first)
    const sortedHistory = [...history].sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    // Build versions by applying changes chronologically
    let currentState = {};
    
    sortedHistory.forEach((entry, index) => {
      const timestamp = entry.timestamp || entry.createdAt;
      const versionKey = new Date(timestamp).toISOString();
      
      // Apply changes to build state at this point
      if (entry.before && entry.after) {
        // Merge after values into current state
        currentState = { ...currentState, ...entry.after };
      }
      
      // Create version snapshot
      const version = {
        id: `version_${index}`,
        timestamp: timestamp,
        date: new Date(timestamp),
        state: JSON.parse(JSON.stringify(currentState)), // Deep clone
        changes: entry.changes || [],
        action: entry.action || 'unknown',
        user: entry.user || entry.metadata?.user || 'Unknown',
        metadata: entry.metadata || {}
      };
      
      versionMap.set(versionKey, version);
    });

    // Convert to array and sort by date (newest first)
    return Array.from(versionMap.values()).sort((a, b) => {
      return b.date.getTime() - a.date.getTime();
    });
  }

  /**
   * Load current version from Firebase
   * @param {string} recordId - Record ID
   */
  async loadCurrentVersion(recordId) {
    try {
      const db = typeof getDatabase === 'function' ? getDatabase() : null;
      if (!db) {
        console.warn('RestoreVersions: Database not available');
        return;
      }

      const path = this.options.recordType === 'lead' ? 'sales' : 'customers';
      const ref = db.ref(`${path}/${recordId}`);
      const snapshot = await ref.once('value');
      const data = snapshot.val();

      if (data) {
        this.currentVersion = {
          id: 'current',
          timestamp: Date.now(),
          date: new Date(),
          state: data,
          changes: [],
          action: 'current',
          user: 'Current',
          metadata: { isCurrent: true }
        };
      }
    } catch (error) {
      console.error('RestoreVersions: Error loading current version:', error);
    }
  }

  /**
   * Render version history UI
   * @param {HTMLElement} container - Container element
   */
  render(container) {
    if (!container) return;

    const allVersions = this.currentVersion 
      ? [this.currentVersion, ...this.versions]
      : this.versions;

    container.innerHTML = `
      <div class="restore-versions-container">
        <div class="restore-versions-header">
          <h3>Version History</h3>
          <div class="restore-versions-info">
            <span>${allVersions.length} version${allVersions.length !== 1 ? 's' : ''} available</span>
          </div>
        </div>
        
        <div class="restore-versions-list">
          ${this.renderVersionsList(allVersions)}
        </div>
      </div>
    `;

    this.setupEventListeners(container);
  }

  /**
   * Render versions list
   * @param {Array} versions - Versions to render
   * @returns {string} HTML string
   */
  renderVersionsList(versions) {
    if (versions.length === 0) {
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No version history available.</p>';
    }

    return versions.map(version => {
      const isCurrent = version.id === 'current' || version.metadata?.isCurrent;
      const timeAgo = this.getTimeAgo(version.date);
      const dateStr = version.date.toLocaleString();
      
      return `
        <div class="restore-version-item ${isCurrent ? 'current' : ''}" data-version-id="${version.id}">
          <div class="restore-version-info">
            <div class="restore-version-header">
              <span class="restore-version-badge ${isCurrent ? 'current' : 'past'}">
                ${isCurrent ? 'Current' : 'Version'}
              </span>
              <span class="restore-version-date">${dateStr}</span>
              <span class="restore-version-time">${timeAgo}</span>
            </div>
            <div class="restore-version-meta">
              <span class="restore-version-user">By: ${this.escapeHtml(version.user)}</span>
              <span class="restore-version-action">${this.escapeHtml(version.action)}</span>
              ${version.changes && version.changes.length > 0 
                ? `<span class="restore-version-changes">${version.changes.length} change${version.changes.length !== 1 ? 's' : ''}</span>`
                : ''}
            </div>
            ${!isCurrent ? `
              <div class="restore-version-preview">
                ${this.renderVersionPreview(version)}
              </div>
            ` : ''}
          </div>
          <div class="restore-version-actions">
            ${!isCurrent ? `
              <button class="btn btn-xs btn-primary" onclick="this.closest('.restore-versions-container').__restoreVersions?.previewVersion('${version.id}')">Preview</button>
              <button class="btn btn-xs btn-secondary" onclick="this.closest('.restore-versions-container').__restoreVersions?.restoreVersion('${version.id}')">Restore</button>
            ` : '<span class="restore-version-current-label">Current Version</span>'}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render version preview
   * @param {Object} version - Version object
   * @returns {string} HTML string
   */
  renderVersionPreview(version) {
    const state = version.state || {};
    const previewFields = ['contact.name', 'contact.email', 'contact.phone', 'leadStatus', 'disposition'];
    const preview = [];
    
    previewFields.forEach(field => {
      const value = this.getNestedValue(state, field);
      if (value) {
        const label = field.split('.').pop();
        preview.push(`${label}: ${this.escapeHtml(String(value))}`);
      }
    });

    return preview.length > 0 
      ? preview.slice(0, 3).join(' • ')
      : 'No preview available';
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object
   * @param {string} path - Dot-separated path
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    if (!path) return null;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Preview a version
   * @param {string} versionId - Version ID
   */
  previewVersion(versionId) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) {
      console.warn('RestoreVersions: Version not found:', versionId);
      return;
    }

    // Show preview in modal or diff viewer
    if (typeof diffViewer !== 'undefined' && diffViewer) {
      // Use diff viewer to show comparison
      const currentState = this.currentVersion?.state || {};
      diffViewer.renderComparison(currentState, version.state);
    } else {
      // Show simple preview
      alert(`Preview Version ${versionId}\n\nDate: ${version.date.toLocaleString()}\n\nPreview:\n${this.renderVersionPreview(version)}`);
    }
  }

  /**
   * Restore a version
   * @param {string} versionId - Version ID
   */
  async restoreVersion(versionId) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) {
      console.warn('RestoreVersions: Version not found:', versionId);
      return;
    }

    if (!confirm(`Restore this record to the version from ${version.date.toLocaleString()}? This will overwrite the current version.`)) {
      return;
    }

    try {
      const db = typeof getDatabase === 'function' ? getDatabase() : null;
      if (!db) {
        throw new Error('Database not available');
      }

      const path = this.options.recordType === 'lead' ? 'sales' : 'customers';
      const ref = db.ref(`${path}/${this.options.recordId}`);
      
      // Update with version state
      await ref.update(version.state);

      // Log restoration
      if (typeof enhancedLogger !== 'undefined' && enhancedLogger) {
        await enhancedLogger.logAction(
          'version_restored',
          this.options.recordId,
          {
            restoredVersionId: versionId,
            restoredTimestamp: version.timestamp,
            recordType: this.options.recordType
          }
        );
      }

      // Reload versions
      await this.loadVersions(this.options.recordId, this.options.recordType);

      // Callback
      if (this.options.onRestore) {
        this.options.onRestore(version, this.options.recordId);
      }

      // Show success message
      if (typeof showCRMMessage === 'function') {
        showCRMMessage('Version restored successfully', 'success');
      }

      // Re-render
      const container = document.querySelector('.restore-versions-container')?.parentElement;
      if (container) {
        this.render(container);
      }

      console.log('RestoreVersions: Version restored:', versionId);
    } catch (error) {
      console.error('RestoreVersions: Error restoring version:', error);
      if (typeof showCRMMessage === 'function') {
        showCRMMessage('Error restoring version: ' + error.message, 'error');
      }
    }
  }

  /**
   * Get time ago string
   * @param {Date} date - Date
   * @returns {string} Time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (months > 0) return `${months}mo ago`;
    if (weeks > 0) return `${weeks}w ago`;
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Setup event listeners
   * @param {HTMLElement} container - Container element
   */
  setupEventListeners(container) {
    // Store reference
    const versionsContainer = container.querySelector('.restore-versions-container');
    if (versionsContainer) {
      versionsContainer.__restoreVersions = this;
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
  module.exports = { RestoreVersions };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RestoreVersions = RestoreVersions;
}
