/**
 * Bulk Operations Component
 * Handles bulk delete operations with confirmation and progress tracking
 */

class BulkOperations {
  constructor(options = {}) {
    this.options = {
      onDelete: null,
      onComplete: null,
      onError: null,
      confirmMessage: 'Are you sure you want to delete {count} item(s)?',
      ...options
    };
    this.isProcessing = false;
  }

  /**
   * Show confirmation dialog
   * @param {number} count - Number of items to delete
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   */
  showConfirmation(count, onConfirm, onCancel) {
    if (this.isProcessing) return;
    
    const message = this.options.confirmMessage.replace('{count}', count);
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'bulk-operations-modal';
    modal.innerHTML = `
      <div class="bulk-operations-modal-content">
        <div class="bulk-operations-modal-header">
          <h3>Confirm Bulk Delete</h3>
          <button class="bulk-operations-modal-close" aria-label="Close">×</button>
        </div>
        <div class="bulk-operations-modal-body">
          <p>${this.escapeHtml(message)}</p>
          <p class="bulk-operations-warning">
            <strong>⚠️ Warning:</strong> This action cannot be undone.
          </p>
        </div>
        <div class="bulk-operations-modal-footer">
          <button class="btn btn-secondary bulk-operations-cancel">Cancel</button>
          <button class="btn btn-danger bulk-operations-confirm">Delete {count} Item(s)</button>
        </div>
      </div>
    `;
    
    // Update button text
    modal.querySelector('.bulk-operations-confirm').textContent = `Delete ${count} Item${count === 1 ? '' : 's'}`;
    
    document.body.appendChild(modal);
    
    // Event listeners
    const confirmBtn = modal.querySelector('.bulk-operations-confirm');
    const cancelBtn = modal.querySelector('.bulk-operations-cancel');
    const closeBtn = modal.querySelector('.bulk-operations-modal-close');
    
    const cleanup = () => {
      document.body.removeChild(modal);
    };
    
    confirmBtn.addEventListener('click', () => {
      cleanup();
      if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });
    
    closeBtn.addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
        if (onCancel) onCancel();
      }
    });
    
    // Focus confirm button
    setTimeout(() => confirmBtn.focus(), 100);
  }

  /**
   * Delete selected items
   * @param {Array} itemIds - Array of item IDs to delete
   * @param {Function} onProgress - Progress callback (current, total)
   * @returns {Promise<Object>} Result object
   */
  async deleteSelected(itemIds, onProgress = null) {
    if (this.isProcessing) {
      throw new Error('Delete operation already in progress');
    }
    
    if (!itemIds || itemIds.length === 0) {
      throw new Error('No items selected for deletion');
    }
    
    this.isProcessing = true;
    
    return new Promise((resolve, reject) => {
      // Show confirmation
      this.showConfirmation(
        itemIds.length,
        async () => {
          // User confirmed, proceed with deletion
          try {
            const results = {
              success: [],
              failed: [],
              total: itemIds.length
            };
            
            // Show progress modal
            const progressModal = this.showProgress(0, itemIds.length);
            
            // Delete items one by one
            for (let i = 0; i < itemIds.length; i++) {
              const itemId = itemIds[i];
              
              try {
                if (this.options.onDelete) {
                  await this.options.onDelete(itemId);
                }
                results.success.push(itemId);
              } catch (error) {
                console.error(`Error deleting item ${itemId}:`, error);
                results.failed.push({ id: itemId, error: error.message });
              }
              
              // Update progress
              this.updateProgress(progressModal, i + 1, itemIds.length);
              if (onProgress) {
                onProgress(i + 1, itemIds.length);
              }
            }
            
            // Close progress modal
            this.closeProgress(progressModal);
            
            // Show result
            if (results.failed.length === 0) {
              this.showSuccess(results.success.length);
              if (this.options.onComplete) {
                this.options.onComplete(results);
              }
              resolve(results);
            } else {
              this.showError(`Failed to delete ${results.failed.length} of ${itemIds.length} items`);
              if (this.options.onError) {
                this.options.onError(results);
              }
              resolve(results); // Still resolve, but with failures
            }
          } catch (error) {
            this.showError(error.message);
            if (this.options.onError) {
              this.options.onError({ error: error.message });
            }
            reject(error);
          } finally {
            this.isProcessing = false;
          }
        },
        () => {
          // User cancelled
          this.isProcessing = false;
          reject(new Error('Deletion cancelled by user'));
        }
      );
    });
  }

  /**
   * Show progress modal
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @returns {HTMLElement} Modal element
   */
  showProgress(current, total) {
    const modal = document.createElement('div');
    modal.className = 'bulk-operations-modal bulk-operations-progress-modal';
    modal.innerHTML = `
      <div class="bulk-operations-modal-content">
        <div class="bulk-operations-modal-header">
          <h3>Deleting Items</h3>
        </div>
        <div class="bulk-operations-modal-body">
          <div class="bulk-operations-progress">
            <div class="bulk-operations-progress-bar">
              <div class="bulk-operations-progress-fill" style="width: ${(current / total) * 100}%"></div>
            </div>
            <p class="bulk-operations-progress-text">
              Deleting ${current} of ${total} items...
            </p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Update progress
   * @param {HTMLElement} modal - Progress modal element
   * @param {number} current - Current progress
   * @param {number} total - Total items
   */
  updateProgress(modal, current, total) {
    const fill = modal.querySelector('.bulk-operations-progress-fill');
    const text = modal.querySelector('.bulk-operations-progress-text');
    
    if (fill) {
      fill.style.width = `${(current / total) * 100}%`;
    }
    if (text) {
      text.textContent = `Deleting ${current} of ${total} items...`;
    }
  }

  /**
   * Close progress modal
   * @param {HTMLElement} modal - Progress modal element
   */
  closeProgress(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }

  /**
   * Show success message
   * @param {number} count - Number of items deleted
   */
  showSuccess(count) {
    const message = document.createElement('div');
    message.className = 'bulk-operations-message bulk-operations-success';
    message.innerHTML = `
      <div class="bulk-operations-message-content">
        <span class="bulk-operations-message-icon">✅</span>
        <span class="bulk-operations-message-text">
          Successfully deleted ${count} item${count === 1 ? '' : 's'}
        </span>
      </div>
    `;
    
    document.body.appendChild(message);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  /**
   * Show error message
   * @param {string} errorMessage - Error message
   */
  showError(errorMessage) {
    const message = document.createElement('div');
    message.className = 'bulk-operations-message bulk-operations-error';
    message.innerHTML = `
      <div class="bulk-operations-message-content">
        <span class="bulk-operations-message-icon">❌</span>
        <span class="bulk-operations-message-text">${this.escapeHtml(errorMessage)}</span>
        <button class="bulk-operations-message-close" aria-label="Close">×</button>
      </div>
    `;
    
    document.body.appendChild(message);
    
    // Close button
    const closeBtn = message.querySelector('.bulk-operations-message-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      });
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 5000);
  }

  /**
   * Bulk edit selected items (TASK-2.4.1: Bulk Edit)
   * @param {Array} itemIds - Array of item IDs to edit
   * @param {Object} changes - Changes to apply { field: value }
   * @param {Function} onUpdate - Update callback (itemId, changes)
   * @returns {Promise<Object>} Result object
   */
  async bulkEdit(itemIds, changes, onUpdate = null) {
    if (this.isProcessing) {
      throw new Error('Bulk operation already in progress');
    }
    
    if (!itemIds || itemIds.length === 0) {
      throw new Error('No items selected for editing');
    }
    
    if (!changes || Object.keys(changes).length === 0) {
      throw new Error('No changes specified');
    }
    
    this.isProcessing = true;
    
    return new Promise((resolve, reject) => {
      // Show preview and confirmation
      this.showBulkEditPreview(itemIds.length, changes, async () => {
        try {
          const results = {
            success: [],
            failed: [],
            total: itemIds.length
          };
          
          const progressModal = this.showProgress(0, itemIds.length, 'Updating Items');
          
          for (let i = 0; i < itemIds.length; i++) {
            const itemId = itemIds[i];
            
            try {
              if (onUpdate) {
                await onUpdate(itemId, changes);
              }
              results.success.push(itemId);
            } catch (error) {
              console.error(`Error updating item ${itemId}:`, error);
              results.failed.push({ id: itemId, error: error.message });
            }
            
            this.updateProgress(progressModal, i + 1, itemIds.length, 'Updating Items');
          }
          
          this.closeProgress(progressModal);
          
          if (results.failed.length === 0) {
            this.showSuccess(`Updated ${results.success.length} item${results.success.length === 1 ? '' : 's'}`);
            resolve(results);
          } else {
            this.showError(`Failed to update ${results.failed.length} of ${itemIds.length} items`);
            resolve(results);
          }
        } catch (error) {
          this.showError(error.message);
          reject(error);
        } finally {
          this.isProcessing = false;
        }
      }, () => {
        this.isProcessing = false;
        reject(new Error('Bulk edit cancelled by user'));
      });
    });
  }

  /**
   * Show bulk edit preview
   * @param {number} count - Number of items
   * @param {Object} changes - Changes to apply
   * @param {Function} onConfirm - Confirm callback
   * @param {Function} onCancel - Cancel callback
   */
  showBulkEditPreview(count, changes, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'bulk-operations-modal';
    modal.innerHTML = `
      <div class="bulk-operations-modal-content">
        <div class="bulk-operations-modal-header">
          <h3>Bulk Edit Preview</h3>
          <button class="bulk-operations-modal-close" aria-label="Close">×</button>
        </div>
        <div class="bulk-operations-modal-body">
          <p>You are about to update <strong>${count}</strong> item${count === 1 ? '' : 's'} with the following changes:</p>
          <div class="bulk-edit-preview">
            ${Object.entries(changes).map(([field, value]) => `
              <div class="bulk-edit-preview-item">
                <strong>${field}:</strong> <span>${this.escapeHtml(String(value))}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="bulk-operations-modal-footer">
          <button class="btn btn-secondary bulk-operations-cancel">Cancel</button>
          <button class="btn btn-primary bulk-operations-confirm">Apply to ${count} Item${count === 1 ? '' : 's'}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const cleanup = () => document.body.removeChild(modal);
    modal.querySelector('.bulk-operations-confirm').addEventListener('click', () => { cleanup(); onConfirm(); });
    modal.querySelector('.bulk-operations-cancel').addEventListener('click', () => { cleanup(); onCancel(); });
    modal.querySelector('.bulk-operations-modal-close').addEventListener('click', () => { cleanup(); onCancel(); });
    modal.addEventListener('click', (e) => { if (e.target === modal) { cleanup(); onCancel(); } });
  }

  /**
   * Bulk disposition selected items (TASK-2.5.1: Bulk Disposition)
   * @param {Array} itemIds - Array of item IDs
   * @param {string} disposition - Disposition value
   * @param {Function} onUpdate - Update callback (itemId, disposition)
   * @returns {Promise<Object>} Result object
   */
  async bulkDisposition(itemIds, disposition, onUpdate = null) {
    if (this.isProcessing) {
      throw new Error('Bulk operation already in progress');
    }
    
    if (!itemIds || itemIds.length === 0) {
      throw new Error('No items selected');
    }
    
    if (!disposition) {
      throw new Error('No disposition specified');
    }
    
    this.isProcessing = true;
    
    return new Promise((resolve, reject) => {
      this.showConfirmation(
        itemIds.length,
        async () => {
          try {
            const results = {
              success: [],
              failed: [],
              total: itemIds.length
            };
            
            const progressModal = this.showProgress(0, itemIds.length, 'Setting Disposition');
            
            for (let i = 0; i < itemIds.length; i++) {
              const itemId = itemIds[i];
              
              try {
                if (onUpdate) {
                  await onUpdate(itemId, disposition);
                }
                results.success.push(itemId);
              } catch (error) {
                console.error(`Error setting disposition for ${itemId}:`, error);
                results.failed.push({ id: itemId, error: error.message });
              }
              
              this.updateProgress(progressModal, i + 1, itemIds.length, 'Setting Disposition');
            }
            
            this.closeProgress(progressModal);
            
            if (results.failed.length === 0) {
              this.showSuccess(`Set disposition for ${results.success.length} item${results.success.length === 1 ? '' : 's'}`);
              resolve(results);
            } else {
              this.showError(`Failed to set disposition for ${results.failed.length} of ${itemIds.length} items`);
              resolve(results);
            }
          } catch (error) {
            this.showError(error.message);
            reject(error);
          } finally {
            this.isProcessing = false;
          }
        },
        () => {
          this.isProcessing = false;
          reject(new Error('Bulk disposition cancelled by user'));
        }
      );
    });
  }

  /**
   * Bulk export selected items (TASK-2.6.1: Bulk Export)
   * @param {Array} itemIds - Array of item IDs
   * @param {Array} items - Full item data array
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  async bulkExport(itemIds, items, options = {}) {
    if (!itemIds || itemIds.length === 0) {
      throw new Error('No items selected for export');
    }
    
    const selectedItems = items.filter(item => itemIds.includes(item.id));
    
    if (selectedItems.length === 0) {
      throw new Error('No matching items found');
    }
    
    // Use export service if available
    if (typeof exportService !== 'undefined') {
      const exportOptions = {
        filename: options.filename || `bulk_export_${new Date().toISOString().split('T')[0]}.csv`,
        ...options
      };
      
      await exportService.exportToCSV(selectedItems, exportOptions);
      this.showSuccess(`Exported ${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'}`);
    } else {
      // Fallback: simple CSV export
      this.exportToCSV(selectedItems, options.filename);
    }
  }

  /**
   * Simple CSV export fallback
   * @param {Array} items - Items to export
   * @param {string} filename - Filename
   */
  exportToCSV(items, filename = 'export.csv') {
    if (items.length === 0) return;
    
    // Get all unique keys
    const allKeys = new Set();
    items.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    
    const headers = Array.from(allKeys);
    const rows = items.map(item => {
      return headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/"/g, '""');
      });
    });
    
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Update progress modal with custom title
   * @param {HTMLElement} modal - Progress modal element
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {string} title - Progress title
   */
  updateProgress(modal, current, total, title = 'Processing') {
    const fill = modal.querySelector('.bulk-operations-progress-fill');
    const text = modal.querySelector('.bulk-operations-progress-text');
    const header = modal.querySelector('h3');
    
    if (fill) {
      fill.style.width = `${(current / total) * 100}%`;
    }
    if (text) {
      text.textContent = `${title}: ${current} of ${total} items...`;
    }
    if (header) {
      header.textContent = title;
    }
  }

  /**
   * Show progress modal with custom title
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {string} title - Progress title
   * @returns {HTMLElement} Modal element
   */
  showProgress(current, total, title = 'Processing') {
    const modal = document.createElement('div');
    modal.className = 'bulk-operations-modal bulk-operations-progress-modal';
    modal.innerHTML = `
      <div class="bulk-operations-modal-content">
        <div class="bulk-operations-modal-header">
          <h3>${title}</h3>
        </div>
        <div class="bulk-operations-modal-body">
          <div class="bulk-operations-progress">
            <div class="bulk-operations-progress-bar">
              <div class="bulk-operations-progress-fill" style="width: ${(current / total) * 100}%"></div>
            </div>
            <p class="bulk-operations-progress-text">
              ${title}: ${current} of ${total} items...
            </p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const bulkOperations = new BulkOperations();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BulkOperations, bulkOperations };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.bulkOperations = bulkOperations;
  window.BulkOperations = BulkOperations;
}
