/**
 * Enhanced Logger Service
 * Field-level change tracking and audit logging
 */

class EnhancedLogger {
  constructor() {
    this.database = null;
    this.batchQueue = [];
    this.batchTimer = null;
    this.batchDelay = 1000; // 1 second debounce
    this.maxBatchSize = 50;
    this.isProcessing = false;
  }

  /**
   * Initialize logger with database reference
   * @param {Object} database - Firebase database reference
   */
  initialize(database) {
    this.database = database;
    console.log('Enhanced Logger initialized');
  }

  /**
   * Get current user information
   * @returns {Object} User object with uid, email, username
   */
  getCurrentUser() {
    // Try to get user from auth-db.js
    if (typeof getCurrentUser === 'function') {
      return getCurrentUser();
    }
    
    // Fallback to sessionStorage
    try {
      const userStr = sessionStorage.getItem('currentUser');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    return {
      uid: null,
      email: null,
      username: null
    };
  }

  /**
   * Detect changes between two objects
   * @param {Object} before - Object before changes
   * @param {Object} after - Object after changes
   * @returns {Array} Array of change objects
   */
  detectChanges(before, after) {
    const changes = [];
    
    if (!before || !after) {
      return changes;
    }

    // Helper to get nested value
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    // Helper to set nested value
    const setNestedValue = (obj, path, value) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
      }, obj);
      target[lastKey] = value;
    };

    // Recursively compare objects
    const compareObjects = (beforeObj, afterObj, path = '') => {
      const allKeys = new Set([
        ...Object.keys(beforeObj || {}),
        ...Object.keys(afterObj || {})
      ]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const beforeValue = beforeObj?.[key];
        const afterValue = afterObj?.[key];

        // Handle nested objects
        if (
          beforeValue &&
          afterValue &&
          typeof beforeValue === 'object' &&
          typeof afterValue === 'object' &&
          !Array.isArray(beforeValue) &&
          !Array.isArray(afterValue) &&
          beforeValue.constructor === Object &&
          afterValue.constructor === Object
        ) {
          compareObjects(beforeValue, afterValue, currentPath);
        } else if (beforeValue !== afterValue) {
          // Value changed
          changes.push({
            field: currentPath,
            before: this.serializeValue(beforeValue),
            after: this.serializeValue(afterValue),
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    compareObjects(before, after);
    return changes;
  }

  /**
   * Serialize value for storage
   * @param {*} value - Value to serialize
   * @returns {*} Serialized value
   */
  serializeValue(value) {
    if (value === null || value === undefined) {
      return null;
    }
    
    // Don't serialize passwords or sensitive data
    if (typeof value === 'string' && (
      value.includes('password') ||
      value.includes('token') ||
      value.includes('secret')
    )) {
      return '[REDACTED]';
    }
    
    // For objects, return JSON string (limited length)
    if (typeof value === 'object') {
      try {
        const serialized = JSON.stringify(value);
        // Limit length to prevent huge logs
        return serialized.length > 1000 ? serialized.substring(0, 1000) + '...' : serialized;
      } catch (error) {
        return '[Unable to serialize]';
      }
    }
    
    return value;
  }

  /**
   * Log a single field change (TASK-1.2.1: Field-level logging)
   * @param {string} fieldName - Name of the field that changed
   * @param {*} oldValue - Value before change
   * @param {*} newValue - Value after change
   * @param {string} userId - User ID making the change
   * @param {string} timestamp - ISO timestamp (optional, defaults to now)
   * @param {string} recordId - ID of the record being changed
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async logFieldChange(fieldName, oldValue, newValue, userId = null, timestamp = null, recordId = null, metadata = {}) {
    if (!this.database) {
      console.warn('Enhanced Logger: Database not initialized');
      return;
    }

    if (!userId) {
      const user = this.getCurrentUser();
      userId = user.uid || null;
    }

    if (!timestamp) {
      timestamp = new Date().toISOString();
    }

    if (!recordId) {
      recordId = metadata.recordId || 'unknown';
    }

    // Store field change in Firebase: /audit_logs/{recordId}/changes/{fieldName}/{timestamp}
    const changePath = `audit_logs/${recordId}/changes/${fieldName}/${timestamp}`;
    const changeEntry = {
      fieldName: fieldName,
      oldValue: this.serializeValue(oldValue),
      newValue: this.serializeValue(newValue),
      userId: userId,
      timestamp: timestamp,
      recordId: recordId,
      ...metadata
    };

    try {
      await this.database.ref(changePath).set(changeEntry);
    } catch (error) {
      console.error('Enhanced Logger: Error logging field change:', error);
    }
  }

  /**
   * Log field-level changes (batch version)
   * @param {string} eventType - Type of event (e.g., 'field_changed', 'record_updated')
   * @param {string} recordId - ID of the record being changed
   * @param {Object} before - Object before changes
   * @param {Object} after - Object after changes
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async logFieldChanges(eventType, recordId, before, after, metadata = {}) {
    if (!this.database) {
      console.warn('Enhanced Logger: Database not initialized');
      return;
    }

    const changes = this.detectChanges(before, after);
    
    if (changes.length === 0) {
      return; // No changes detected
    }

    const user = this.getCurrentUser();
    const timestamp = new Date().toISOString();
    const logId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const logEntry = {
      eventType: eventType,
      severity: 'info',
      timestamp: timestamp,
      userId: user.uid || null,
      userEmail: user.email || null,
      username: user.username || null,
      recordId: recordId,
      recordType: metadata.recordType || 'lead', // 'lead', 'customer', etc.
      changes: changes,
      changeCount: changes.length,
      metadata: {
        source: metadata.source || 'unknown', // 'inline_edit', 'bulk_edit', 'form_submit', etc.
        sessionId: metadata.sessionId || null,
        ...metadata
      }
    };

    // Add to batch queue
    this.batchQueue.push({
      logId: logId,
      logEntry: logEntry
    });

    // Process batch if queue is full
    if (this.batchQueue.length >= this.maxBatchSize) {
      await this.processBatch();
    } else {
      // Schedule batch processing
      this.scheduleBatchProcessing();
    }
  }

  /**
   * Schedule batch processing with debounce
   */
  scheduleBatchProcessing() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  /**
   * Process batch queue and write to database
   * @returns {Promise<void>}
   */
  async processBatch() {
    if (this.isProcessing || this.batchQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      const updates = {};
      const timestamp = new Date().toISOString();
      const dateKey = timestamp.split('T')[0]; // YYYY-MM-DD

      for (const item of batch) {
        // Store in security_logs with date-based structure for efficient querying
        // Structure: security_logs/{dateKey}/{logId}
        const logPath = `security_logs/${dateKey}/${item.logId}`;
        updates[logPath] = item.logEntry;

        // Also create index entries for efficient querying
        // Index by recordId: security_logs_index/recordId/{logId}
        if (item.logEntry.recordId) {
          const recordIndexPath = `security_logs_index/recordId/${item.logEntry.recordId}/${item.logId}`;
          updates[recordIndexPath] = {
            timestamp: item.logEntry.timestamp,
            eventType: item.logEntry.eventType,
            dateKey: dateKey
          };
        }

        // Index by userId: security_logs_index/userId/{userId}/{logId}
        if (item.logEntry.userId) {
          const userIndexPath = `security_logs_index/userId/${item.logEntry.userId}/${item.logId}`;
          updates[userIndexPath] = {
            timestamp: item.logEntry.timestamp,
            eventType: item.logEntry.eventType,
            dateKey: dateKey
          };
        }
      }

      // Write all updates in a single transaction
      await this.database.ref().update(updates);

      console.log(`Enhanced Logger: Processed ${batch.length} log entries`);
    } catch (error) {
      console.error('Enhanced Logger: Error processing batch:', error);
      
      // Retry: Add failed items back to queue
      this.batchQueue.unshift(...batch);
      
      // Retry after delay
      setTimeout(() => {
        this.processBatch();
      }, 5000);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Query logs by recordId
   * @param {string} recordId - Record ID to query
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of log entries
   */
  async queryByRecordId(recordId, limit = 100) {
    if (!this.database) {
      console.warn('Enhanced Logger: Database not initialized');
      return [];
    }

    try {
      const indexRef = this.database.ref(`security_logs_index/recordId/${recordId}`);
      const snapshot = await indexRef.limitToLast(limit).once('value');
      
      if (!snapshot.exists()) {
        return [];
      }

      const indexEntries = snapshot.val();
      const logEntries = [];

      // Fetch actual log entries
      for (const [logId, indexData] of Object.entries(indexEntries)) {
        const logPath = `security_logs/${indexData.dateKey}/${logId}`;
        const logSnapshot = await this.database.ref(logPath).once('value');
        
        if (logSnapshot.exists()) {
          logEntries.push(logSnapshot.val());
        }
      }

      // Sort by timestamp descending
      logEntries.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      return logEntries;
    } catch (error) {
      console.error('Enhanced Logger: Error querying by recordId:', error);
      return [];
    }
  }

  /**
   * Query logs by userId
   * @param {string} userId - User ID to query
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of log entries
   */
  async queryByUserId(userId, limit = 100) {
    if (!this.database) {
      console.warn('Enhanced Logger: Database not initialized');
      return [];
    }

    try {
      const indexRef = this.database.ref(`security_logs_index/userId/${userId}`);
      const snapshot = await indexRef.limitToLast(limit).once('value');
      
      if (!snapshot.exists()) {
        return [];
      }

      const indexEntries = snapshot.val();
      const logEntries = [];

      // Fetch actual log entries
      for (const [logId, indexData] of Object.entries(indexEntries)) {
        const logPath = `security_logs/${indexData.dateKey}/${logId}`;
        const logSnapshot = await this.database.ref(logPath).once('value');
        
        if (logSnapshot.exists()) {
          logEntries.push(logSnapshot.val());
        }
      }

      // Sort by timestamp descending
      logEntries.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      return logEntries;
    } catch (error) {
      console.error('Enhanced Logger: Error querying by userId:', error);
      return [];
    }
  }

  /**
   * Query logs by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of log entries
   */
  async queryByDateRange(startDate, endDate, limit = 1000) {
    if (!this.database) {
      console.warn('Enhanced Logger: Database not initialized');
      return [];
    }

    try {
      const logEntries = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dateRef = this.database.ref(`security_logs/${dateKey}`);
        const snapshot = await dateRef.limitToLast(limit).once('value');
        
        if (snapshot.exists()) {
          const logs = snapshot.val();
          for (const log of Object.values(logs)) {
            const logDate = new Date(log.timestamp);
            if (logDate >= startDate && logDate <= endDate) {
              logEntries.push(log);
            }
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Sort by timestamp descending
      logEntries.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      return logEntries.slice(0, limit);
    } catch (error) {
      console.error('Enhanced Logger: Error querying by date range:', error);
      return [];
    }
  }

  /**
   * Query logs by event type
   * @param {string} eventType - Event type to query
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of log entries
   */
  async queryByEventType(eventType, limit = 100) {
    // This is less efficient - would need to scan all logs
    // For better performance, consider adding an eventType index
    if (!this.database) {
      console.warn('Enhanced Logger: Database not initialized');
      return [];
    }

    try {
      // Query recent logs (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const logs = await this.queryByDateRange(startDate, endDate, limit * 10);
      
      // Filter by event type
      return logs
        .filter(log => log.eventType === eventType)
        .slice(0, limit);
    } catch (error) {
      console.error('Enhanced Logger: Error querying by eventType:', error);
      return [];
    }
  }

  /**
   * Generate audit trail for a record (TASK-1.2.2: Audit trail generation)
   * @param {string} recordId - Record ID to generate audit trail for
   * @param {Object} options - Options for audit trail generation
   * @returns {Promise<Array>} Chronological list of all changes
   */
  async generateAuditTrail(recordId, options = {}) {
    if (!this.database) {
      console.warn('Enhanced Logger: Database not initialized');
      return [];
    }

    try {
      // Retrieve all field changes for the record from /audit_logs/{recordId}/changes/
      const changesRef = this.database.ref(`audit_logs/${recordId}/changes`);
      const snapshot = await changesRef.once('value');
      
      if (!snapshot.exists()) {
        return [];
      }

      const allChanges = [];
      const changesData = snapshot.val();

      // Flatten nested structure: changes/{fieldName}/{timestamp}
      for (const [fieldName, timestamps] of Object.entries(changesData)) {
        if (timestamps && typeof timestamps === 'object') {
          for (const [timestamp, changeData] of Object.entries(timestamps)) {
            if (changeData && typeof changeData === 'object') {
              allChanges.push({
                field: fieldName,
                timestamp: timestamp,
                oldValue: changeData.oldValue || null,
                newValue: changeData.newValue || null,
                userId: changeData.userId || null,
                userEmail: changeData.userEmail || null,
                username: changeData.username || null,
                recordId: changeData.recordId || recordId,
                ...changeData
              });
            }
          }
        }
      }

      // Sort chronologically (oldest first)
      allChanges.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeA - timeB;
      });

      // Apply options
      if (options.limit) {
        return allChanges.slice(-options.limit); // Last N changes
      }

      if (options.startDate || options.endDate) {
        const startDate = options.startDate ? new Date(options.startDate).getTime() : 0;
        const endDate = options.endDate ? new Date(options.endDate).getTime() : Date.now();
        
        return allChanges.filter(change => {
          const changeTime = new Date(change.timestamp).getTime();
          return changeTime >= startDate && changeTime <= endDate;
        });
      }

      return allChanges;
    } catch (error) {
      console.error('Enhanced Logger: Error generating audit trail:', error);
      return [];
    }
  }

  /**
   * Flush any pending logs
   * @returns {Promise<void>}
   */
  async flush() {
    if (this.batchQueue.length > 0) {
      await this.processBatch();
    }
  }
}

// Create singleton instance
const enhancedLogger = new EnhancedLogger();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnhancedLogger, enhancedLogger };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.enhancedLogger = enhancedLogger;
  window.EnhancedLogger = EnhancedLogger;
}
