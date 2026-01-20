/**
 * Offline Cache Service (Phase 4A)
 * Cache critical data for offline access
 */

class OfflineCache {
  constructor(options = {}) {
    this.options = {
      storageKey: options.storageKey || 'crm_offline_cache',
      maxAge: options.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      ...options
    };

    this.cachedData = this.loadCache();
    this.syncQueue = [];
  }

  /**
   * Cache critical data
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  cache(key, data) {
    this.cachedData[key] = {
      data: data,
      timestamp: Date.now()
    };
    this.saveCache();
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {*} Cached data or null
   */
  get(key) {
    const cached = this.cachedData[key];
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.options.maxAge) {
      delete this.cachedData[key];
      this.saveCache();
      return null;
    }

    return cached.data;
  }

  /**
   * Queue sync operation
   * @param {string} operation - Operation type
   * @param {Object} data - Operation data
   */
  queueSync(operation, data) {
    this.syncQueue.push({ operation, data, timestamp: Date.now() });
    this.saveSyncQueue();
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        await this.syncItem(item);
      } catch (error) {
        console.error('OfflineCache: Sync failed, re-queuing:', error);
        this.syncQueue.push(item); // Re-queue on failure
      }
    }

    this.saveSyncQueue();
  }

  /**
   * Sync a single item
   * @param {Object} item - Sync item
   */
  async syncItem(item) {
    // Implementation would sync with Firebase
    console.log('OfflineCache: Syncing item:', item);
  }

  /**
   * Load cache from storage
   * @returns {Object} Cached data
   */
  loadCache() {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('OfflineCache: Error loading cache:', error);
      return {};
    }
  }

  /**
   * Save cache to storage
   */
  saveCache() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.cachedData));
    } catch (error) {
      console.error('OfflineCache: Error saving cache:', error);
    }
  }

  /**
   * Save sync queue
   */
  saveSyncQueue() {
    try {
      localStorage.setItem('crm_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('OfflineCache: Error saving sync queue:', error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfflineCache };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.OfflineCache = OfflineCache;
}
