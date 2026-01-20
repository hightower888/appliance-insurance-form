/**
 * Query Optimizer Service (Phase 4A)
 * Optimize Firebase queries with pagination, filtering, and caching
 */

class QueryOptimizer {
  constructor(options = {}) {
    this.options = {
      defaultPageSize: options.defaultPageSize || 50,
      cacheQueries: options.cacheQueries !== false,
      cacheTTL: options.cacheTTL || 5 * 60 * 1000, // 5 minutes
      ...options
    };

    this.queryCache = new Map();
  }

  /**
   * Optimize Firebase query with pagination
   * @param {Object} ref - Firebase reference
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async paginatedQuery(ref, options = {}) {
    const {
      page = 1,
      pageSize = this.options.defaultPageSize,
      orderBy = null,
      orderByChild = null,
      startAt = null,
      endAt = null,
      equalTo = null,
      limitToFirst = null,
      limitToLast = null
    } = options;

    // Build query
    let query = ref;

    if (orderBy) {
      query = query.orderByChild(orderBy);
    } else if (orderByChild) {
      query = query.orderByChild(orderByChild);
    } else {
      query = query.orderByKey();
    }

    // Apply filters
    if (startAt !== null) query = query.startAt(startAt);
    if (endAt !== null) query = query.endAt(endAt);
    if (equalTo !== null) query = query.equalTo(equalTo);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    if (limitToFirst) {
      query = query.limitToFirst(Math.min(limitToFirst, pageSize));
    } else if (limitToLast) {
      query = query.limitToLast(Math.min(limitToLast, pageSize));
    } else {
      query = query.limitToFirst(pageSize);
    }

    // Check cache
    const cacheKey = this.getCacheKey(ref.toString(), options);
    if (this.options.cacheQueries) {
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute query
    const snapshot = await query.once('value');
    const data = snapshot.val() || {};
    const items = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    const result = {
      items,
      page,
      pageSize,
      total: items.length, // Note: Firebase doesn't provide total count
      hasMore: items.length === pageSize
    };

    // Cache result
    if (this.options.cacheQueries) {
      this.setCached(cacheKey, result);
    }

    return result;
  }

  /**
   * Optimize query with filtering
   * @param {Object} ref - Firebase reference
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Filtered items
   */
  async filteredQuery(ref, filters = {}) {
    // Build query based on filters
    let query = ref;

    // Apply filters (Firebase requires indexed fields)
    if (filters.orderBy) {
      query = query.orderByChild(filters.orderBy);
      
      if (filters.startAt !== undefined) {
        query = query.startAt(filters.startAt);
      }
      if (filters.endAt !== undefined) {
        query = query.endAt(filters.endAt);
      }
      if (filters.equalTo !== undefined) {
        query = query.equalTo(filters.equalTo);
      }
    }

    // Apply limit
    if (filters.limit) {
      query = query.limitToFirst(filters.limit);
    }

    // Check cache
    const cacheKey = this.getCacheKey(ref.toString(), filters);
    if (this.options.cacheQueries) {
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute query
    const snapshot = await query.once('value');
    const data = snapshot.val() || {};
    const items = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    // Apply client-side filters if needed
    let filteredItems = items;
    if (filters.clientSideFilters) {
      filteredItems = this.applyClientSideFilters(items, filters.clientSideFilters);
    }

    // Cache result
    if (this.options.cacheQueries) {
      this.setCached(cacheKey, filteredItems);
    }

    return filteredItems;
  }

  /**
   * Apply client-side filters
   * @param {Array} items - Items to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered items
   */
  applyClientSideFilters(items, filters) {
    return items.filter(item => {
      for (const [key, value] of Object.entries(filters)) {
        if (item[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get cache key
   * @param {string} ref - Reference string
   * @param {Object} options - Options
   * @returns {string} Cache key
   */
  getCacheKey(ref, options) {
    return `${ref}:${JSON.stringify(options)}`;
  }

  /**
   * Get cached result
   * @param {string} key - Cache key
   * @returns {*} Cached result or null
   */
  getCached(key) {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.options.cacheTTL) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached result
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  setCached(key, data) {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate cache
   * @param {string} pattern - Pattern to match
   */
  invalidateCache(pattern) {
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.queryCache.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueryOptimizer };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.QueryOptimizer = QueryOptimizer;
}
