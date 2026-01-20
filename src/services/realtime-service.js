/**
 * Real-Time Service
 * Manages Firebase Realtime Database listeners and real-time updates
 */

class RealtimeService {
  constructor() {
    this.database = null;
    this.listeners = new Map(); // Map<path, { ref, callbacks: Set, count }>
    this.connectionStatus = 'unknown'; // unknown, connected, disconnected, error
    this.connectionListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Initialize service with database reference
   * @param {Object} database - Firebase database reference
   */
  initialize(database) {
    this.database = database || (typeof database !== 'undefined' ? database : null);
    
    if (!this.database) {
      console.warn('RealtimeService: Database not provided');
      return;
    }

    // Monitor connection status
    this.monitorConnection();
  }

  /**
   * Monitor database connection status
   */
  monitorConnection() {
    if (!this.database) return;

    const connectedRef = this.database.ref('.info/connected');
    
    connectedRef.on('value', (snapshot) => {
      const isConnected = snapshot.val();
      
      if (isConnected) {
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.notifyConnectionChange('connected');
      } else {
        this.connectionStatus = 'disconnected';
        this.notifyConnectionChange('disconnected');
        this.attemptReconnect();
      }
    });

    // Monitor server time offset
    const serverTimeRef = this.database.ref('.info/serverTimeOffset');
    serverTimeRef.on('value', (snapshot) => {
      const offset = snapshot.val();
      if (offset !== null) {
        // Connection is working
        this.connectionStatus = 'connected';
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionStatus = 'error';
      this.notifyConnectionChange('error');
      return;
    }

    this.reconnectAttempts++;
    
    setTimeout(() => {
      // Re-subscribe to all active listeners
      this.reconnectListeners();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Reconnect all listeners
   */
  reconnectListeners() {
    const paths = Array.from(this.listeners.keys());
    
    paths.forEach(path => {
      const listener = this.listeners.get(path);
      if (listener && listener.ref) {
        // Re-subscribe
        this.subscribe(path, Array.from(listener.callbacks));
      }
    });
  }

  /**
   * Subscribe to real-time updates
   * @param {string} path - Firebase path (e.g., 'sales', 'users', 'security_logs')
   * @param {Function} callback - Callback function(data, snapshot)
   * @param {Object} options - Options { eventType: 'value' | 'child_added' | 'child_changed' | 'child_removed' }
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback, options = {}) {
    if (!this.database) {
      console.warn('RealtimeService: Database not initialized');
      return () => {};
    }

    if (!path || typeof callback !== 'function') {
      console.warn('RealtimeService: Invalid path or callback');
      return () => {};
    }

    const eventType = options.eventType || 'value';
    const listenerKey = `${path}:${eventType}`;

    // Get or create listener entry
    let listener = this.listeners.get(listenerKey);
    
    if (!listener) {
      listener = {
        ref: this.database.ref(path),
        callbacks: new Set(),
        count: 0,
        eventType: eventType
      };
      this.listeners.set(listenerKey, listener);
    }

    // Add callback
    listener.callbacks.add(callback);
    listener.count++;

    // Set up listener if this is the first callback
    if (listener.count === 1) {
      this.setupListener(listener);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(path, callback, eventType);
    };
  }

  /**
   * Setup Firebase listener
   * @param {Object} listener - Listener object
   */
  setupListener(listener) {
    if (!listener.ref) return;

    const handler = (snapshot) => {
      let data = null;

      if (listener.eventType === 'value') {
        data = snapshot.val();
      } else if (listener.eventType === 'child_added') {
        data = {
          key: snapshot.key,
          value: snapshot.val()
        };
      } else if (listener.eventType === 'child_changed') {
        data = {
          key: snapshot.key,
          value: snapshot.val()
        };
      } else if (listener.eventType === 'child_removed') {
        data = {
          key: snapshot.key,
          value: snapshot.val()
        };
      }

      // Notify all callbacks
      listener.callbacks.forEach(callback => {
        try {
          callback(data, snapshot);
        } catch (error) {
          console.error('Error in real-time callback:', error);
        }
      });
    };

    // Set up listener based on event type
    if (listener.eventType === 'value') {
      listener.ref.on('value', handler, (error) => {
        console.error(`Real-time listener error for ${listener.ref.path}:`, error);
        this.connectionStatus = 'error';
        this.notifyConnectionChange('error');
      });
    } else {
      listener.ref.on(listener.eventType, handler, (error) => {
        console.error(`Real-time listener error for ${listener.ref.path}:`, error);
        this.connectionStatus = 'error';
        this.notifyConnectionChange('error');
      });
    }

    listener.handler = handler;
  }

  /**
   * Unsubscribe from real-time updates
   * @param {string} path - Firebase path
   * @param {Function} callback - Callback function
   * @param {string} eventType - Event type
   */
  unsubscribe(path, callback, eventType = 'value') {
    const listenerKey = `${path}:${eventType}`;
    const listener = this.listeners.get(listenerKey);

    if (!listener) return;

    // Remove callback
    listener.callbacks.delete(callback);
    listener.count--;

    // Remove listener if no more callbacks
    if (listener.count === 0) {
      if (listener.ref && listener.handler) {
        if (eventType === 'value') {
          listener.ref.off('value', listener.handler);
        } else {
          listener.ref.off(eventType, listener.handler);
        }
      }
      this.listeners.delete(listenerKey);
    }
  }

  /**
   * Subscribe to child events (child_added, child_changed, child_removed)
   * @param {string} path - Firebase path
   * @param {Function} callback - Callback function
   * @param {string} eventType - 'child_added' | 'child_changed' | 'child_removed'
   * @returns {Function} Unsubscribe function
   */
  subscribeToChild(path, callback, eventType = 'child_added') {
    return this.subscribe(path, callback, { eventType });
  }

  /**
   * Subscribe to multiple paths
   * @param {Array<string>} paths - Array of Firebase paths
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToMultiple(paths, callback) {
    const unsubscribers = paths.map(path => this.subscribe(path, callback));
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Get current connection status
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    return this.connectionStatus;
  }

  /**
   * Subscribe to connection status changes
   * @param {Function} callback - Callback function(status)
   * @returns {Function} Unsubscribe function
   */
  onConnectionChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    this.connectionListeners.add(callback);
    
    // Immediately call with current status
    callback(this.connectionStatus);

    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Notify connection status change
   * @param {string} status - New status
   */
  notifyConnectionChange(status) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection status callback:', error);
      }
    });
  }

  /**
   * Get data once (non-real-time)
   * @param {string} path - Firebase path
   * @returns {Promise<*>} Data
   */
  async getDataOnce(path) {
    if (!this.database) {
      throw new Error('RealtimeService: Database not initialized');
    }

    try {
      const ref = this.database.ref(path);
      const snapshot = await ref.once('value');
      return snapshot.val();
    } catch (error) {
      console.error(`Error getting data from ${path}:`, error);
      throw error;
    }
  }

  /**
   * Write data
   * @param {string} path - Firebase path
   * @param {*} data - Data to write
   * @returns {Promise<void>}
   */
  async writeData(path, data) {
    if (!this.database) {
      throw new Error('RealtimeService: Database not initialized');
    }

    try {
      const ref = this.database.ref(path);
      await ref.set(data);
    } catch (error) {
      console.error(`Error writing data to ${path}:`, error);
      throw error;
    }
  }

  /**
   * Update data
   * @param {string} path - Firebase path
   * @param {Object} updates - Updates object
   * @returns {Promise<void>}
   */
  async updateData(path, updates) {
    if (!this.database) {
      throw new Error('RealtimeService: Database not initialized');
    }

    try {
      const ref = this.database.ref(path);
      await ref.update(updates);
    } catch (error) {
      console.error(`Error updating data at ${path}:`, error);
      throw error;
    }
  }

  /**
   * Push data (create new child with auto-generated key)
   * @param {string} path - Firebase path
   * @param {*} data - Data to push
   * @returns {Promise<string>} Generated key
   */
  async pushData(path, data) {
    if (!this.database) {
      throw new Error('RealtimeService: Database not initialized');
    }

    try {
      const ref = this.database.ref(path);
      const newRef = ref.push();
      await newRef.set(data);
      return newRef.key;
    } catch (error) {
      console.error(`Error pushing data to ${path}:`, error);
      throw error;
    }
  }

  /**
   * Remove data
   * @param {string} path - Firebase path
   * @returns {Promise<void>}
   */
  async removeData(path) {
    if (!this.database) {
      throw new Error('RealtimeService: Database not initialized');
    }

    try {
      const ref = this.database.ref(path);
      await ref.remove();
    } catch (error) {
      console.error(`Error removing data at ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get all active listeners
   * @returns {Array} Array of listener info
   */
  getActiveListeners() {
    const listeners = [];
    
    this.listeners.forEach((listener, key) => {
      const [path, eventType] = key.split(':');
      listeners.push({
        path,
        eventType,
        callbackCount: listener.count
      });
    });

    return listeners;
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll() {
    const paths = Array.from(this.listeners.keys());
    
    paths.forEach(key => {
      const [path, eventType] = key.split(':');
      const listener = this.listeners.get(key);
      
      if (listener && listener.ref && listener.handler) {
        if (eventType === 'value') {
          listener.ref.off('value', listener.handler);
        } else {
          listener.ref.off(eventType, listener.handler);
        }
      }
    });

    this.listeners.clear();
  }

  /**
   * Destroy service and clean up
   */
  destroy() {
    this.unsubscribeAll();
    this.connectionListeners.clear();
    this.database = null;
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RealtimeService, realtimeService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RealtimeService = RealtimeService;
  window.realtimeService = realtimeService;
}
