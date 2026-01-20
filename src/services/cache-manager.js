/**
 * Cache Manager Service
 * Provides caching functionality with TTL support
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    this.cleanupInterval = 60 * 1000; // Cleanup every minute
    this.cleanupTimer = null;
    this.startCleanupTimer();
  }

  /**
   * Start automatic cleanup timer
   */
  startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = ttl > 0 ? Date.now() + ttl : null;
    
    this.cache.set(key, {
      value: value,
      expiresAt: expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Check if key exists in cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key was deleted
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Invalidate cache entries matching pattern
   * @param {string|RegExp} pattern - Key pattern or regex
   */
  invalidate(pattern) {
    if (typeof pattern === 'string') {
      // Simple prefix/suffix matching
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        for (const key of this.cache.keys()) {
          if (key.startsWith(prefix)) {
            this.cache.delete(key);
          }
        }
      } else if (pattern.startsWith('*')) {
        const suffix = pattern.slice(1);
        for (const key of this.cache.keys()) {
          if (key.endsWith(suffix)) {
            this.cache.delete(key);
          }
        }
      } else {
        // Exact match
        this.cache.delete(pattern);
      }
    } else if (pattern instanceof RegExp) {
      // Regex matching
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Get or set value (get if exists, otherwise compute and set)
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute value if not cached
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<*>} Cached or computed value
   */
  async getOrSet(key, computeFn, ttl = this.defaultTTL) {
    if (this.has(key)) {
      return this.get(key);
    }

    const value = await computeFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cache Manager: Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active: active,
      expired: expired,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage (rough estimate)
   * @returns {number} Estimated size in bytes
   */
  estimateMemoryUsage() {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Key size
      size += key.length * 2; // UTF-16 encoding
      
      // Value size (rough estimate)
      try {
        const valueStr = JSON.stringify(entry.value);
        size += valueStr.length * 2;
      } catch (error) {
        // If can't stringify, estimate
        size += 100; // Rough estimate
      }
      
      // Entry metadata
      size += 50; // Rough estimate for entry object
    }
    
    return size;
  }

  /**
   * Set default TTL
   * @param {number} ttl - Time to live in milliseconds
   */
  setDefaultTTL(ttl) {
    this.defaultTTL = ttl;
  }

  /**
   * TASK-1.4.1: Enhanced cache invalidation strategies
   * Invalidate cache by pattern with different strategies
   * @param {string|RegExp} pattern - Key pattern
   * @param {string} strategy - Invalidation strategy ('immediate', 'lazy', 'on-demand')
   */
  invalidateWithStrategy(pattern, strategy = 'immediate') {
    if (strategy === 'immediate') {
      this.invalidate(pattern);
    } else if (strategy === 'lazy') {
      // Mark for lazy invalidation (invalidate on next access)
      // This would require additional tracking, simplified for now
      this.invalidate(pattern);
    } else if (strategy === 'on-demand') {
      // Invalidate when explicitly requested
      this.invalidate(pattern);
    }
  }

  /**
   * TASK-1.4.1: Cache UI/UX data with appropriate TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {string} dataType - Type of data ('view', 'filter', 'state', 'ui')
   */
  setUIUXData(key, value, dataType = 'ui') {
    // Different TTLs for different data types
    const ttlMap = {
      'view': 30 * 60 * 1000,      // 30 minutes for view data
      'filter': 10 * 60 * 1000,     // 10 minutes for filter data
      'state': 5 * 60 * 1000,       // 5 minutes for state data
      'ui': 15 * 60 * 1000          // 15 minutes for general UI data
    };

    const ttl = ttlMap[dataType] || this.defaultTTL;
    this.set(key, value, ttl);
  }

  /**
   * Phase 4A: Intelligent cache invalidation
   * Invalidate related cache entries based on dependencies
   * @param {string} key - Cache key that changed
   * @param {Array} dependencies - Dependency map
   */
  invalidateDependencies(key, dependencies = {}) {
    // Invalidate the key itself
    this.delete(key);

    // Invalidate dependent keys
    if (dependencies[key]) {
      dependencies[key].forEach(depKey => {
        this.delete(depKey);
      });
    }

    // Invalidate keys that match pattern
    const keyPattern = key.split(':')[0]; // Get prefix
    this.invalidate(`${keyPattern}:*`);
  }

  /**
   * Phase 4A: Cache warming - preload critical data
   * @param {Array} warmKeys - Array of {key, computeFn, ttl} objects
   */
  async warmCache(warmKeys = []) {
    const warmPromises = warmKeys.map(async ({ key, computeFn, ttl }) => {
      if (!this.has(key)) {
        try {
          const value = await computeFn();
          this.set(key, value, ttl || this.defaultTTL);
          return { key, success: true };
        } catch (error) {
          console.error(`CacheManager: Failed to warm cache for ${key}:`, error);
          return { key, success: false, error };
        }
      }
      return { key, success: true, cached: true };
    });

    return Promise.all(warmPromises);
  }

  /**
   * Phase 4A: Predictive cache warming based on user patterns
   * @param {string} currentKey - Current cache key being accessed
   * @param {Object} patterns - Access patterns {key: [nextKeys]}
   */
  async predictiveWarm(currentKey, patterns = {}) {
    if (patterns[currentKey]) {
      const nextKeys = patterns[currentKey];
      const warmKeys = nextKeys.map(key => ({
        key,
        computeFn: async () => {
          // This would be provided by the caller
          return null;
        },
        ttl: this.defaultTTL
      }));
      // Note: computeFn would need to be provided by caller
      // This is a placeholder for the pattern
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CacheManager, cacheManager };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.cacheManager = cacheManager;
  window.CacheManager = CacheManager;
}
