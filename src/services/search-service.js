/**
 * Search Service (TASK-2.13.1)
 * Advanced search functionality with search builder and history
 */

class SearchService {
  constructor() {
    this.searchHistory = [];
    this.savedSearches = {};
    this.maxHistorySize = 50;
    this.loadFromStorage();
  }

  /**
   * Search data with query
   * @param {string|Object} query - Search query (string for full-text, object for structured)
   * @param {Array} data - Data array to search
   * @param {Object} options - Search options
   * @returns {Array} Filtered results
   */
  search(query, data, options = {}) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    if (!query || (typeof query === 'string' && query.trim() === '')) {
      return data;
    }

    const {
      caseSensitive = false,
      exactMatch = false,
      searchFields = null, // null = search all fields
      limit = null
    } = options;

    let results = data;

    // Handle string query (full-text search)
    if (typeof query === 'string') {
      results = this.fullTextSearch(query, data, { caseSensitive, exactMatch, searchFields });
    }
    // Handle object query (structured search)
    else if (typeof query === 'object') {
      results = this.structuredSearch(query, data, options);
    }

    // Add to search history
    if (query && results.length !== data.length) {
      this.addToHistory(query, results.length);
    }

    // Apply limit
    if (limit && limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  }

  /**
   * Full-text search across all fields
   * @param {string} searchTerm - Search term
   * @param {Array} data - Data array
   * @param {Object} options - Search options
   * @returns {Array} Filtered results
   */
  fullTextSearch(searchTerm, data, options = {}) {
    const { caseSensitive = false, exactMatch = false, searchFields = null } = options;
    
    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const searchRegex = exactMatch ? new RegExp(`^${this.escapeRegex(term)}$`, caseSensitive ? '' : 'i') : 
                                     new RegExp(this.escapeRegex(term), caseSensitive ? '' : 'i');

    return data.filter(item => {
      // Get all searchable fields
      const fields = searchFields || this.getAllFields(item);
      
      return fields.some(field => {
        const value = this.getNestedValue(item, field);
        if (value === null || value === undefined) return false;
        
        const valueStr = String(value);
        const searchValue = caseSensitive ? valueStr : valueStr.toLowerCase();
        
        return searchRegex.test(searchValue);
      });
    });
  }

  /**
   * Structured search with criteria
   * @param {Object} criteria - Search criteria
   * @param {Array} data - Data array
   * @param {Object} options - Search options
   * @returns {Array} Filtered results
   */
  structuredSearch(criteria, data, options = {}) {
    return data.filter(item => {
      return Object.entries(criteria).every(([field, condition]) => {
        const itemValue = this.getNestedValue(item, field);
        
        // Handle different condition types
        if (condition === null || condition === undefined) {
          return itemValue === null || itemValue === undefined;
        }
        
        // Object condition (operators)
        if (typeof condition === 'object' && !Array.isArray(condition)) {
          return this.evaluateCondition(itemValue, condition);
        }
        
        // Array condition (IN operator)
        if (Array.isArray(condition)) {
          return condition.includes(itemValue);
        }
        
        // Simple equality
        return itemValue === condition;
      });
    });
  }

  /**
   * Evaluate condition with operators
   * @param {*} value - Value to evaluate
   * @param {Object} condition - Condition object
   * @returns {boolean} Match result
   */
  evaluateCondition(value, condition) {
    if (condition.$eq !== undefined) return value === condition.$eq;
    if (condition.$ne !== undefined) return value !== condition.$ne;
    if (condition.$gt !== undefined) return value > condition.$gt;
    if (condition.$gte !== undefined) return value >= condition.$gte;
    if (condition.$lt !== undefined) return value < condition.$lt;
    if (condition.$lte !== undefined) return value <= condition.$lte;
    if (condition.$in !== undefined) return Array.isArray(condition.$in) && condition.$in.includes(value);
    if (condition.$nin !== undefined) return Array.isArray(condition.$nin) && !condition.$nin.includes(value);
    if (condition.$contains !== undefined) {
      const valueStr = String(value || '').toLowerCase();
      return valueStr.includes(String(condition.$contains).toLowerCase());
    }
    if (condition.$startsWith !== undefined) {
      const valueStr = String(value || '').toLowerCase();
      return valueStr.startsWith(String(condition.$startsWith).toLowerCase());
    }
    if (condition.$endsWith !== undefined) {
      const valueStr = String(value || '').toLowerCase();
      return valueStr.endsWith(String(condition.$endsWith).toLowerCase());
    }
    
    return false;
  }

  /**
   * Build query from criteria
   * @param {Array} criteria - Array of criterion objects
   * @returns {Object} Query object
   */
  buildQuery(criteria) {
    const query = {};
    
    criteria.forEach(criterion => {
      const { field, operator, value } = criterion;
      
      if (!field || value === null || value === undefined) return;
      
      if (!query[field]) {
        query[field] = {};
      }
      
      switch (operator) {
        case 'equals':
          query[field] = value;
          break;
        case 'notEquals':
          query[field] = { $ne: value };
          break;
        case 'greaterThan':
          query[field] = { $gt: value };
          break;
        case 'greaterThanOrEqual':
          query[field] = { $gte: value };
          break;
        case 'lessThan':
          query[field] = { $lt: value };
          break;
        case 'lessThanOrEqual':
          query[field] = { $lte: value };
          break;
        case 'contains':
          query[field] = { $contains: value };
          break;
        case 'startsWith':
          query[field] = { $startsWith: value };
          break;
        case 'endsWith':
          query[field] = { $endsWith: value };
          break;
        case 'in':
          query[field] = Array.isArray(value) ? value : [value];
          break;
        case 'notIn':
          query[field] = { $nin: Array.isArray(value) ? value : [value] };
          break;
      }
    });
    
    return query;
  }

  /**
   * Get all fields from an object (recursive)
   * @param {Object} obj - Object to extract fields from
   * @param {string} prefix - Field prefix
   * @returns {Array} Array of field paths
   */
  getAllFields(obj, prefix = '') {
    const fields = [];
    
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return fields;
    }
    
    if (Array.isArray(obj)) {
      // For arrays, just add the prefix
      if (prefix) fields.push(prefix);
      return fields;
    }
    
    Object.keys(obj).forEach(key => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      // Add current field
      fields.push(fieldPath);
      
      // Recursively get nested fields
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        fields.push(...this.getAllFields(value, fieldPath));
      }
    });
    
    return fields;
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object
   * @param {string} path - Dot-separated path
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    if (!path) return obj;
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * Escape regex special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Add search to history
   * @param {string|Object} query - Search query
   * @param {number} resultCount - Number of results
   */
  addToHistory(query, resultCount) {
    const historyEntry = {
      query: typeof query === 'string' ? query : JSON.stringify(query),
      resultCount: resultCount,
      timestamp: new Date().toISOString()
    };
    
    this.searchHistory.unshift(historyEntry);
    
    // Limit history size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
    
    this.saveToStorage();
  }

  /**
   * Get search history
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Search history
   */
  getSearchHistory(limit = 10) {
    return this.searchHistory.slice(0, limit);
  }

  /**
   * Clear search history
   */
  clearHistory() {
    this.searchHistory = [];
    this.saveToStorage();
  }

  /**
   * Save search with name
   * @param {string} name - Search name
   * @param {string|Object} query - Search query
   */
  saveSearch(name, query) {
    this.savedSearches[name] = {
      query: typeof query === 'string' ? query : JSON.stringify(query),
      savedAt: new Date().toISOString()
    };
    this.saveToStorage();
  }

  /**
   * Load saved search
   * @param {string} name - Search name
   * @returns {Object|null} Saved search or null
   */
  loadSearch(name) {
    return this.savedSearches[name] || null;
  }

  /**
   * Get all saved searches
   * @returns {Object} Saved searches
   */
  getSavedSearches() {
    return { ...this.savedSearches };
  }

  /**
   * Delete saved search
   * @param {string} name - Search name
   */
  deleteSearch(name) {
    delete this.savedSearches[name];
    this.saveToStorage();
  }

  /**
   * Save to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('searchService_history', JSON.stringify(this.searchHistory));
      localStorage.setItem('searchService_saved', JSON.stringify(this.savedSearches));
    } catch (error) {
      console.warn('Search Service: Error saving to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  loadFromStorage() {
    try {
      const historyStr = localStorage.getItem('searchService_history');
      const savedStr = localStorage.getItem('searchService_saved');
      
      if (historyStr) {
        this.searchHistory = JSON.parse(historyStr);
      }
      if (savedStr) {
        this.savedSearches = JSON.parse(savedStr);
      }
    } catch (error) {
      console.warn('Search Service: Error loading from storage:', error);
    }
  }
}

// Create singleton instance
const searchService = new SearchService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SearchService, searchService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.searchService = searchService;
  window.SearchService = SearchService;
}
