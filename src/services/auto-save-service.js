/**
 * Auto-Save Service (Phase 3)
 * Automatically saves changes with conflict detection and resolution
 */

class AutoSaveService {
  constructor(options = {}) {
    this.options = {
      debounceMs: options.debounceMs || 2000, // 2 seconds default
      logger: options.logger || null,
      database: options.database || null,
      onSave: options.onSave || null,
      onConflict: options.onConflict || null,
      onError: options.onError || null,
      ...options
    };

    this.pendingChanges = new Map(); // recordId -> { data, timestamp }
    this.saveTimers = new Map(); // recordId -> timer
    this.lastSavedVersions = new Map(); // recordId -> version hash
    this.isSaving = new Map(); // recordId -> boolean
  }

  /**
   * Initialize the service
   */
  initialize() {
    console.log('Auto-Save Service initialized');
  }

  /**
   * Register a change for auto-save
   * @param {string} recordId - Record ID
   * @param {Object} data - Changed data
   * @param {Object} metadata - Optional metadata
   */
  registerChange(recordId, data, metadata = {}) {
    if (!recordId || !data) {
      console.warn('AutoSave: Invalid recordId or data');
      return;
    }

    // Store pending change
    this.pendingChanges.set(recordId, {
      data: { ...data },
      timestamp: Date.now(),
      metadata
    });

    // Clear existing timer
    if (this.saveTimers.has(recordId)) {
      clearTimeout(this.saveTimers.get(recordId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.save(recordId);
    }, this.options.debounceMs);

    this.saveTimers.set(recordId, timer);
  }

  /**
   * Save changes immediately
   * @param {string} recordId - Record ID
   */
  async save(recordId) {
    if (!this.pendingChanges.has(recordId)) {
      return; // No pending changes
    }

    if (this.isSaving.get(recordId)) {
      console.log(`AutoSave: Already saving ${recordId}, skipping`);
      return; // Already saving
    }

    const change = this.pendingChanges.get(recordId);
    this.isSaving.set(recordId, true);

    try {
      // Check for conflicts
      const conflict = await this.checkConflict(recordId, change.data);
      if (conflict) {
        await this.handleConflict(recordId, conflict, change.data);
        return;
      }

      // Save to database
      if (this.options.database) {
        const db = this.options.database;
        const ref = db.ref(`sales/${recordId}`);
        
        // Get current data
        const snapshot = await ref.once('value');
        const currentData = snapshot.val() || {};

        // Merge changes
        const updatedData = {
          ...currentData,
          ...change.data,
          lastModified: Date.now()
        };

        // Save
        await ref.set(updatedData);

        // Log changes
        if (this.options.logger) {
          for (const [field, value] of Object.entries(change.data)) {
            const oldValue = currentData[field];
            if (oldValue !== value) {
              await this.options.logger.logFieldChange(
                field,
                oldValue,
                value,
                this.getCurrentUserId(),
                Date.now(),
                recordId,
                { ...change.metadata, source: 'auto_save' }
              );
            }
          }
        }

        // Update last saved version
        this.lastSavedVersions.set(recordId, this.getVersionHash(updatedData));

        // Clear pending change
        this.pendingChanges.delete(recordId);
        if (this.saveTimers.has(recordId)) {
          clearTimeout(this.saveTimers.get(recordId));
          this.saveTimers.delete(recordId);
        }

        // Callback
        if (this.options.onSave) {
          this.options.onSave(recordId, updatedData);
        }

        console.log(`AutoSave: Saved ${recordId}`);
      } else if (this.options.onSave) {
        // Use custom save handler
        await this.options.onSave(recordId, change.data);
        this.pendingChanges.delete(recordId);
      }
    } catch (error) {
      console.error(`AutoSave: Error saving ${recordId}:`, error);
      
      if (this.options.onError) {
        this.options.onError(recordId, error, change.data);
      }
    } finally {
      this.isSaving.set(recordId, false);
    }
  }

  /**
   * Check for conflicts
   * @param {string} recordId - Record ID
   * @param {Object} newData - New data to save
   * @returns {Object|null} Conflict info or null
   */
  async checkConflict(recordId, newData) {
    if (!this.options.database) {
      return null; // Can't check conflicts without database
    }

    try {
      const db = this.options.database;
      const ref = db.ref(`sales/${recordId}`);
      const snapshot = await ref.once('value');
      const currentData = snapshot.val();

      if (!currentData) {
        return null; // No existing data, no conflict
      }

      const currentVersion = this.getVersionHash(currentData);
      const lastSaved = this.lastSavedVersions.get(recordId);

      // Check if data was modified since last save
      if (lastSaved && currentVersion !== lastSaved) {
        // Find conflicting fields
        const conflicts = {};
        for (const [field, newValue] of Object.entries(newData)) {
          if (currentData[field] !== undefined && 
              currentData[field] !== newValue &&
              currentData[field] !== this.getPendingValue(recordId, field)) {
            conflicts[field] = {
              local: newValue,
              remote: currentData[field]
            };
          }
        }

        if (Object.keys(conflicts).length > 0) {
          return {
            recordId,
            conflicts,
            currentData,
            newData
          };
        }
      }

      return null;
    } catch (error) {
      console.error('AutoSave: Error checking conflict:', error);
      return null;
    }
  }

  /**
   * Handle conflict
   * @param {string} recordId - Record ID
   * @param {Object} conflict - Conflict info
   * @param {Object} newData - New data
   */
  async handleConflict(recordId, conflict, newData) {
    console.warn(`AutoSave: Conflict detected for ${recordId}:`, conflict);

    if (this.options.onConflict) {
      const resolution = await this.options.onConflict(recordId, conflict, newData);
      
      if (resolution === 'use_local') {
        // Use local changes, overwrite remote
        await this.forceSave(recordId, newData);
      } else if (resolution === 'use_remote') {
        // Use remote, discard local
        this.pendingChanges.delete(recordId);
        this.lastSavedVersions.set(recordId, this.getVersionHash(conflict.currentData));
      } else if (resolution === 'merge') {
        // Merge changes
        const merged = { ...conflict.currentData, ...newData };
        await this.forceSave(recordId, merged);
      }
    } else {
      // Default: use local changes
      await this.forceSave(recordId, newData);
    }
  }

  /**
   * Force save (overwrite conflicts)
   * @param {string} recordId - Record ID
   * @param {Object} data - Data to save
   */
  async forceSave(recordId, data) {
    if (!this.options.database) {
      return;
    }

    const db = this.options.database;
    const ref = db.ref(`sales/${recordId}`);
    await ref.set({
      ...data,
      lastModified: Date.now()
    });

    this.lastSavedVersions.set(recordId, this.getVersionHash(data));
    this.pendingChanges.delete(recordId);
  }

  /**
   * Get pending value for a field
   * @param {string} recordId - Record ID
   * @param {string} field - Field name
   * @returns {*} Pending value or undefined
   */
  getPendingValue(recordId, field) {
    const change = this.pendingChanges.get(recordId);
    return change?.data[field];
  }

  /**
   * Get version hash for data
   * @param {Object} data - Data object
   * @returns {string} Hash string
   */
  getVersionHash(data) {
    // Simple hash based on key data fields
    const key = JSON.stringify({
      timestamp: data.timestamp,
      lastModified: data.lastModified,
      version: data.version
    });
    return btoa(key).substring(0, 16);
  }

  /**
   * Get current user ID
   * @returns {string} User ID
   */
  getCurrentUserId() {
    if (typeof getCurrentUser === 'function') {
      const user = getCurrentUser();
      return user?.uid || user?.id || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Cancel pending save for a record
   * @param {string} recordId - Record ID
   */
  cancel(recordId) {
    if (this.saveTimers.has(recordId)) {
      clearTimeout(this.saveTimers.get(recordId));
      this.saveTimers.delete(recordId);
    }
    this.pendingChanges.delete(recordId);
  }

  /**
   * Cancel all pending saves
   */
  cancelAll() {
    this.saveTimers.forEach(timer => clearTimeout(timer));
    this.saveTimers.clear();
    this.pendingChanges.clear();
  }

  /**
   * Get pending changes count
   * @returns {number} Count of pending changes
   */
  getPendingCount() {
    return this.pendingChanges.size;
  }

  /**
   * Check if record has pending changes
   * @param {string} recordId - Record ID
   * @returns {boolean} True if has pending changes
   */
  hasPending(recordId) {
    return this.pendingChanges.has(recordId);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AutoSaveService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AutoSaveService = AutoSaveService;
}
