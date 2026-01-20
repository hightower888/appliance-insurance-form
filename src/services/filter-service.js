/**
 * Filter Service
 * Processes filter configurations and applies them to data
 */

class FilterService {
  constructor() {
    this.fieldCache = new Map();
  }

  /**
   * Apply filter configuration to data
   * @param {Array} data - Data array to filter
   * @param {Object} filterConfig - Filter configuration from FilterBuilder
   * @returns {Array} Filtered data
   */
  applyFilters(data, filterConfig) {
    if (!filterConfig || !filterConfig.groups || filterConfig.groups.length === 0) {
      return data;
    }

    if (!Array.isArray(data) || data.length === 0) {
      return data;
    }

    // Filter groups use OR logic (if any group matches, item passes)
    return data.filter(item => {
      return filterConfig.groups.some(group => {
        // Within group, use AND logic (all filters must match)
        return group.filters.every(filter => {
          return this.evaluateFilter(item, filter);
        });
      });
    });
  }

  /**
   * Evaluate a single filter against an item
   * @param {Object} item - Data item
   * @param {Object} filter - Filter object { field, operator, value }
   * @returns {boolean} Whether item matches filter
   */
  evaluateFilter(item, filter) {
    if (!filter.field || filter.value === '' || filter.value === null || filter.value === undefined) {
      return true; // Empty filter passes
    }

    const itemValue = this.getNestedValue(item, filter.field);
    const operator = filter.operator || 'equals';
    const filterValue = filter.value;

    switch (operator) {
      case 'equals':
        return this.compareEquals(itemValue, filterValue);
      
      case 'notEquals':
        return !this.compareEquals(itemValue, filterValue);
      
      case 'contains':
        return this.compareContains(itemValue, filterValue);
      
      case 'startsWith':
        return this.compareStartsWith(itemValue, filterValue);
      
      case 'endsWith':
        return this.compareEndsWith(itemValue, filterValue);
      
      case 'greaterThan':
        return this.compareGreaterThan(itemValue, filterValue);
      
      case 'lessThan':
        return this.compareLessThan(itemValue, filterValue);
      
      case 'greaterThanOrEqual':
        return this.compareGreaterThanOrEqual(itemValue, filterValue);
      
      case 'lessThanOrEqual':
        return this.compareLessThanOrEqual(itemValue, filterValue);
      
      case 'between':
        return this.compareBetween(itemValue, filterValue);
      
      case 'before':
        return this.compareBefore(itemValue, filterValue);
      
      case 'after':
        return this.compareAfter(itemValue, filterValue);
      
      default:
        return this.compareEquals(itemValue, filterValue);
    }
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object
   * @param {string} path - Dot notation path (e.g., 'contact.name')
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    if (!path || !obj) return null;

    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }

    return value;
  }

  /**
   * Compare equals
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareEquals(itemValue, filterValue) {
    if (itemValue == null && filterValue == null) return true;
    if (itemValue == null || filterValue == null) return false;
    
    // String comparison (case-insensitive)
    if (typeof itemValue === 'string' && typeof filterValue === 'string') {
      return itemValue.toLowerCase() === filterValue.toLowerCase();
    }
    
    // Boolean comparison
    if (typeof itemValue === 'boolean' || typeof filterValue === 'boolean') {
      return Boolean(itemValue) === Boolean(filterValue);
    }
    
    // Number comparison
    if (typeof itemValue === 'number' || typeof filterValue === 'number') {
      return Number(itemValue) === Number(filterValue);
    }
    
    // Default strict equality
    return itemValue === filterValue;
  }

  /**
   * Compare contains
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareContains(itemValue, filterValue) {
    if (itemValue == null || filterValue == null) return false;
    const itemStr = String(itemValue).toLowerCase();
    const filterStr = String(filterValue).toLowerCase();
    return itemStr.includes(filterStr);
  }

  /**
   * Compare starts with
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareStartsWith(itemValue, filterValue) {
    if (itemValue == null || filterValue == null) return false;
    const itemStr = String(itemValue).toLowerCase();
    const filterStr = String(filterValue).toLowerCase();
    return itemStr.startsWith(filterStr);
  }

  /**
   * Compare ends with
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareEndsWith(itemValue, filterValue) {
    if (itemValue == null || filterValue == null) return false;
    const itemStr = String(itemValue).toLowerCase();
    const filterStr = String(filterValue).toLowerCase();
    return itemStr.endsWith(filterStr);
  }

  /**
   * Compare greater than
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareGreaterThan(itemValue, filterValue) {
    const itemNum = Number(itemValue);
    const filterNum = Number(filterValue);
    if (isNaN(itemNum) || isNaN(filterNum)) return false;
    return itemNum > filterNum;
  }

  /**
   * Compare less than
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareLessThan(itemValue, filterValue) {
    const itemNum = Number(itemValue);
    const filterNum = Number(filterValue);
    if (isNaN(itemNum) || isNaN(filterNum)) return false;
    return itemNum < filterNum;
  }

  /**
   * Compare greater than or equal
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareGreaterThanOrEqual(itemValue, filterValue) {
    const itemNum = Number(itemValue);
    const filterNum = Number(filterValue);
    if (isNaN(itemNum) || isNaN(filterNum)) return false;
    return itemNum >= filterNum;
  }

  /**
   * Compare less than or equal
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareLessThanOrEqual(itemValue, filterValue) {
    const itemNum = Number(itemValue);
    const filterNum = Number(filterValue);
    if (isNaN(itemNum) || isNaN(filterNum)) return false;
    return itemNum <= filterNum;
  }

  /**
   * Compare between (for date ranges)
   * @param {*} itemValue - Item value
   * @param {Object} filterValue - Filter value { from, to }
   * @returns {boolean}
   */
  compareBetween(itemValue, filterValue) {
    if (!filterValue || typeof filterValue !== 'object') return false;
    if (!filterValue.from && !filterValue.to) return true;

    const itemDate = this.parseDate(itemValue);
    if (!itemDate) return false;

    if (filterValue.from) {
      const fromDate = this.parseDate(filterValue.from);
      if (fromDate && itemDate < fromDate) return false;
    }

    if (filterValue.to) {
      const toDate = this.parseDate(filterValue.to);
      if (toDate) {
        // Set to end of day
        toDate.setHours(23, 59, 59, 999);
        if (itemDate > toDate) return false;
      }
    }

    return true;
  }

  /**
   * Compare before (for dates)
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareBefore(itemValue, filterValue) {
    const itemDate = this.parseDate(itemValue);
    const filterDate = this.parseDate(filterValue);
    if (!itemDate || !filterDate) return false;
    return itemDate < filterDate;
  }

  /**
   * Compare after (for dates)
   * @param {*} itemValue - Item value
   * @param {*} filterValue - Filter value
   * @returns {boolean}
   */
  compareAfter(itemValue, filterValue) {
    const itemDate = this.parseDate(itemValue);
    const filterDate = this.parseDate(filterValue);
    if (!itemDate || !filterDate) return false;
    return itemDate > filterDate;
  }

  /**
   * Parse date from various formats
   * @param {*} value - Date value
   * @returns {Date|null} Parsed date
   */
  parseDate(value) {
    if (!value) return null;
    
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'number') {
      return new Date(value);
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  }

  /**
   * Convert filter configuration to query string (for URL sharing)
   * @param {Object} filterConfig - Filter configuration
   * @returns {string} Query string
   */
  toQueryString(filterConfig) {
    if (!filterConfig || !filterConfig.groups) {
      return '';
    }

    try {
      const encoded = encodeURIComponent(JSON.stringify(filterConfig));
      return `filters=${encoded}`;
    } catch (error) {
      console.error('Error encoding filters:', error);
      return '';
    }
  }

  /**
   * Parse filter configuration from query string
   * @param {string} queryString - Query string
   * @returns {Object|null} Filter configuration
   */
  fromQueryString(queryString) {
    if (!queryString) return null;

    try {
      const params = new URLSearchParams(queryString);
      const filtersParam = params.get('filters');
      if (!filtersParam) return null;

      const decoded = decodeURIComponent(filtersParam);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error parsing filters from query string:', error);
      return null;
    }
  }

  /**
   * Validate filter configuration
   * @param {Object} filterConfig - Filter configuration
   * @returns {Object} Validation result { valid, errors }
   */
  validateFilterConfig(filterConfig) {
    const errors = [];

    if (!filterConfig) {
      return { valid: false, errors: ['Filter configuration is required'] };
    }

    if (!Array.isArray(filterConfig.groups)) {
      errors.push('Filter groups must be an array');
    } else {
      filterConfig.groups.forEach((group, groupIndex) => {
        if (!group.filters || !Array.isArray(group.filters)) {
          errors.push(`Group ${groupIndex + 1}: Filters must be an array`);
        } else {
          group.filters.forEach((filter, filterIndex) => {
            if (!filter.field) {
              errors.push(`Group ${groupIndex + 1}, Filter ${filterIndex + 1}: Field is required`);
            }
            if (filter.value === '' || filter.value === null || filter.value === undefined) {
              errors.push(`Group ${groupIndex + 1}, Filter ${filterIndex + 1}: Value is required`);
            }
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// Create singleton instance
const filterService = new FilterService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterService, filterService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.FilterService = FilterService;
  window.filterService = filterService;
}
