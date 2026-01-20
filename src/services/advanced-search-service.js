/**
 * Advanced Search Service (Phase 4C)
 * Natural language search and advanced filter builder
 */

class AdvancedSearchService {
  constructor() {
    this.searchHistory = this.loadSearchHistory();
    this.searchIndex = new Map(); // In-memory search index
    this.init();
  }

  /**
   * Initialize search service
   */
  init() {
    // Build search index from existing data
    this.rebuildIndex();
  }

  /**
   * Rebuild search index
   * @param {Array} leads - Leads array to index
   */
  rebuildIndex(leads = null) {
    if (!leads) {
      // Load from Firebase or existing data
      return;
    }

    this.searchIndex.clear();
    leads.forEach((lead, index) => {
      const searchableText = this.extractSearchableText(lead);
      this.searchIndex.set(lead.id || index, {
        lead,
        searchableText,
        tokens: this.tokenize(searchableText)
      });
    });
  }

  /**
   * Extract searchable text from lead
   * @param {Object} lead - Lead object
   * @returns {string} Searchable text
   */
  extractSearchableText(lead) {
    const parts = [
      lead.contact?.name || '',
      lead.contact?.email || '',
      lead.contact?.phone || '',
      lead.contact?.postcode || '',
      lead.contact?.address || '',
      lead.status || '',
      lead.disposition || '',
      lead.notes || '',
      lead.appliances?.map(a => `${a.type} ${a.make} ${a.model}`).join(' ') || ''
    ];
    return parts.join(' ').toLowerCase();
  }

  /**
   * Tokenize text for search
   * @param {string} text - Text to tokenize
   * @returns {Array<string>} Tokens
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 2)
      .map(token => token.replace(/[^\w]/g, ''));
  }

  /**
   * Natural language search
   * @param {string} query - Natural language query
   * @param {Array} leads - Leads to search
   * @returns {Array} Filtered leads
   */
  naturalLanguageSearch(query, leads) {
    if (!query || query.trim().length === 0) {
      return leads;
    }

    const queryLower = query.toLowerCase();
    const queryTokens = this.tokenize(query);

    // Parse natural language patterns
    const patterns = this.parseNaturalLanguage(query);

    // Filter leads based on patterns
    return leads.filter(lead => {
      const searchableText = this.extractSearchableText(lead);
      const leadTokens = this.tokenize(searchableText);

      // Exact phrase match
      if (searchableText.includes(queryLower)) {
        return true;
      }

      // Token matching
      const matchingTokens = queryTokens.filter(qt => 
        leadTokens.some(lt => lt.includes(qt) || qt.includes(lt))
      );
      if (matchingTokens.length === queryTokens.length) {
        return true;
      }

      // Pattern matching
      if (this.matchesPatterns(lead, patterns)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Parse natural language query into patterns
   * @param {string} query - Natural language query
   * @returns {Object} Parsed patterns
   */
  parseNaturalLanguage(query) {
    const patterns = {
      status: null,
      disposition: null,
      dateRange: null,
      fieldFilters: {}
    };

    // Status patterns
    const statusPatterns = {
      'new': /new|recent|just added/i,
      'contacted': /contacted|called|reached/i,
      'dispositioned': /dispositioned|closed|resolved/i,
      'converted': /converted|sold|customer/i
    };

    for (const [status, pattern] of Object.entries(statusPatterns)) {
      if (pattern.test(query)) {
        patterns.status = status;
        break;
      }
    }

    // Disposition patterns
    const dispositionPatterns = {
      'interested': /interested|yes|wants/i,
      'not_interested': /not interested|no|declined/i,
      'call_back': /call back|callback|later/i,
      'no_answer': /no answer|no response|unavailable/i
    };

    for (const [disposition, pattern] of Object.entries(dispositionPatterns)) {
      if (pattern.test(query)) {
        patterns.disposition = disposition;
        break;
      }
    }

    // Date patterns
    const datePatterns = {
      today: /today/i,
      yesterday: /yesterday/i,
      thisWeek: /this week|past 7 days/i,
      thisMonth: /this month|past 30 days/i,
      lastWeek: /last week/i,
      lastMonth: /last month/i
    };

    for (const [range, pattern] of Object.entries(datePatterns)) {
      if (pattern.test(query)) {
        patterns.dateRange = range;
        break;
      }
    }

    return patterns;
  }

  /**
   * Check if lead matches patterns
   * @param {Object} lead - Lead object
   * @param {Object} patterns - Parsed patterns
   * @returns {boolean} Matches
   */
  matchesPatterns(lead, patterns) {
    if (patterns.status && lead.status !== patterns.status) {
      return false;
    }

    if (patterns.disposition && lead.disposition !== patterns.disposition) {
      return false;
    }

    if (patterns.dateRange) {
      const date = new Date(lead.timestamp || 0);
      const now = new Date();
      const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      switch (patterns.dateRange) {
        case 'today':
          if (daysDiff !== 0) return false;
          break;
        case 'yesterday':
          if (daysDiff !== 1) return false;
          break;
        case 'thisWeek':
          if (daysDiff > 7) return false;
          break;
        case 'thisMonth':
          if (daysDiff > 30) return false;
          break;
        case 'lastWeek':
          if (daysDiff < 7 || daysDiff > 14) return false;
          break;
        case 'lastMonth':
          if (daysDiff < 30 || daysDiff > 60) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Advanced filter builder
   * @param {Object} filters - Filter configuration
   * @param {Array} leads - Leads to filter
   * @returns {Array} Filtered leads
   */
  advancedFilter(filters, leads) {
    if (!filters || Object.keys(filters).length === 0) {
      return leads;
    }

    return leads.filter(lead => {
      for (const [field, filterConfig] of Object.entries(filters)) {
        if (!this.matchesFilter(lead, field, filterConfig)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Check if lead matches a filter
   * @param {Object} lead - Lead object
   * @param {string} field - Field name
   * @param {Object} filterConfig - Filter configuration
   * @returns {boolean} Matches
   */
  matchesFilter(lead, field, filterConfig) {
    const { operator, value } = filterConfig;
    let fieldValue = this.getNestedValue(lead, field);

    // Handle different data types
    if (fieldValue === null || fieldValue === undefined) {
      fieldValue = '';
    }

    const fieldStr = String(fieldValue).toLowerCase();
    const valueStr = String(value).toLowerCase();

    switch (operator) {
      case 'equals':
        return fieldStr === valueStr;
      case 'not_equals':
        return fieldStr !== valueStr;
      case 'contains':
        return fieldStr.includes(valueStr);
      case 'not_contains':
        return !fieldStr.includes(valueStr);
      case 'starts_with':
        return fieldStr.startsWith(valueStr);
      case 'ends_with':
        return fieldStr.endsWith(valueStr);
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'greater_equal':
        return Number(fieldValue) >= Number(value);
      case 'less_equal':
        return Number(fieldValue) <= Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      case 'is_empty':
        return !fieldValue || fieldValue.length === 0;
      case 'is_not_empty':
        return fieldValue && fieldValue.length > 0;
      default:
        return true;
    }
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object
   * @param {string} path - Dot-separated path
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Save search to history
   * @param {string} query - Search query
   * @param {Object} filters - Applied filters
   */
  saveSearchHistory(query, filters = {}) {
    const search = {
      query,
      filters,
      timestamp: Date.now()
    };

    this.searchHistory.unshift(search);
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50);
    }

    this.saveSearchHistoryToStorage();
  }

  /**
   * Load search history from storage
   * @returns {Array} Search history
   */
  loadSearchHistory() {
    try {
      const stored = localStorage.getItem('searchHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save search history to storage
   */
  saveSearchHistoryToStorage() {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }

  /**
   * Get search suggestions
   * @param {string} query - Partial query
   * @param {Array} leads - Leads to search
   * @returns {Array} Suggestions
   */
  getSuggestions(query, leads) {
    if (!query || query.length < 2) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const suggestions = new Set();

    // From search history
    this.searchHistory.forEach(search => {
      if (search.query.toLowerCase().includes(queryLower)) {
        suggestions.add(search.query);
      }
    });

    // From lead data
    leads.forEach(lead => {
      const name = lead.contact?.name || '';
      const email = lead.contact?.email || '';
      const phone = lead.contact?.phone || '';

      if (name.toLowerCase().includes(queryLower)) {
        suggestions.add(name);
      }
      if (email.toLowerCase().includes(queryLower)) {
        suggestions.add(email);
      }
      if (phone.includes(query)) {
        suggestions.add(phone);
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Get search analytics
   * @returns {Object} Search analytics
   */
  getSearchAnalytics() {
    const analytics = {
      totalSearches: this.searchHistory.length,
      popularQueries: {},
      searchFrequency: {},
      averageResults: 0
    };

    this.searchHistory.forEach(search => {
      const query = search.query.toLowerCase();
      analytics.popularQueries[query] = (analytics.popularQueries[query] || 0) + 1;
    });

    // Sort popular queries
    analytics.popularQueries = Object.entries(analytics.popularQueries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    return analytics;
  }
}

// Create singleton instance
const advancedSearchService = new AdvancedSearchService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdvancedSearchService, advancedSearchService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AdvancedSearchService = AdvancedSearchService;
  window.advancedSearchService = advancedSearchService;
}
