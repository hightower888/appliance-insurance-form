/**
 * Natural Language Search Component
 * Parses natural language queries and converts to filters
 */

class NaturalLanguageSearch {
  /**
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSearch: options.onSearch || null,
      placeholder: options.placeholder || 'Search... (e.g., "show me interested leads from last week")',
      ...options
    };

    this.searchService = options.searchService || (typeof searchService !== 'undefined' ? searchService : null);
    this.suggestions = [];
    this.currentQuery = '';

    this.init();
  }

  /**
   * Initialize natural language search
   */
  init() {
    if (!this.container) {
      throw new Error('NaturalLanguageSearch: Container not set');
    }

    this.render();
  }

  /**
   * Render natural language search UI
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="natural-language-search-container">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            id="naturalLanguageSearchInput" 
            class="natural-language-search-input" 
            placeholder="${this.escapeHtml(this.options.placeholder)}"
            autocomplete="off"
          />
          <button class="btn btn-primary search-btn" id="naturalLanguageSearchBtn">🔍</button>
        </div>
        <div class="search-suggestions" id="searchSuggestions" style="display: none;">
          <!-- Suggestions will be rendered here -->
        </div>
        <div class="search-examples" id="searchExamples">
          <span class="examples-label">Try:</span>
          <span class="example-query" data-query="show interested leads">interested leads</span>
          <span class="example-query" data-query="leads from last week">last week</span>
          <span class="example-query" data-query="new leads today">new today</span>
          <span class="example-query" data-query="call back leads">call back</span>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const input = document.getElementById('naturalLanguageSearchInput');
    const searchBtn = document.getElementById('naturalLanguageSearchBtn');
    const suggestionsContainer = document.getElementById('searchSuggestions');

    if (!input) return;

    // Search button click
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch();
      });
    }

    // Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateSuggestions(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateSuggestions(-1);
      } else if (e.key === 'Escape') {
        this.hideSuggestions();
      }
    });

    // Input change (for suggestions)
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this.currentQuery = query;
      
      if (query.length > 0) {
        this.showSuggestions(query);
      } else {
        this.hideSuggestions();
      }
    });

    // Focus/blur
    input.addEventListener('focus', () => {
      if (this.currentQuery.length > 0) {
        this.showSuggestions(this.currentQuery);
      }
    });

    // Example query clicks
    this.container.querySelectorAll('.example-query').forEach(example => {
      example.addEventListener('click', () => {
        const query = example.getAttribute('data-query');
        input.value = query;
        this.currentQuery = query;
        this.performSearch();
      });
    });
  }

  /**
   * Show search suggestions
   * @param {string} query - Search query
   */
  async showSuggestions(query) {
    if (!this.searchService) {
      return;
    }

    const suggestions = await this.searchService.getSuggestions(query);
    this.suggestions = suggestions;
    this.renderSuggestions(suggestions);

    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (suggestionsContainer && suggestions.length > 0) {
      suggestionsContainer.style.display = 'block';
    }
  }

  /**
   * Hide search suggestions
   */
  hideSuggestions() {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  }

  /**
   * Render suggestions
   * @param {Array} suggestions - Suggestions array
   */
  renderSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer) return;

    if (suggestions.length === 0) {
      suggestionsContainer.innerHTML = '<div class="suggestion-item">No suggestions</div>';
      return;
    }

    suggestionsContainer.innerHTML = suggestions.map((suggestion, index) => `
      <div class="suggestion-item ${index === 0 ? 'selected' : ''}" data-index="${index}" data-query="${this.escapeHtml(suggestion.query)}">
        <span class="suggestion-icon">${suggestion.icon || '🔍'}</span>
        <span class="suggestion-text">${this.escapeHtml(suggestion.text)}</span>
        ${suggestion.description ? `<span class="suggestion-desc">${this.escapeHtml(suggestion.description)}</span>` : ''}
      </div>
    `).join('');

    // Setup suggestion click listeners
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const query = item.getAttribute('data-query');
        const input = document.getElementById('naturalLanguageSearchInput');
        if (input) {
          input.value = query;
          this.currentQuery = query;
          this.performSearch();
        }
      });
    });
  }

  /**
   * Navigate suggestions with keyboard
   * @param {number} direction - 1 for down, -1 for up
   */
  navigateSuggestions(direction) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    if (!suggestionsContainer || this.suggestions.length === 0) return;

    const selected = suggestionsContainer.querySelector('.suggestion-item.selected');
    let nextIndex = 0;

    if (selected) {
      const currentIndex = parseInt(selected.getAttribute('data-index'));
      nextIndex = currentIndex + direction;
      if (nextIndex < 0) nextIndex = this.suggestions.length - 1;
      if (nextIndex >= this.suggestions.length) nextIndex = 0;
    }

    // Update selection
    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.classList.remove('selected');
    });

    const nextItem = suggestionsContainer.querySelector(`[data-index="${nextIndex}"]`);
    if (nextItem) {
      nextItem.classList.add('selected');
    }
  }

  /**
   * Perform search
   */
  async performSearch() {
    const input = document.getElementById('naturalLanguageSearchInput');
    if (!input) return;

    const query = input.value.trim();
    if (!query) {
      return;
    }

    this.currentQuery = query;
    this.hideSuggestions();

    // Parse query using search service
    if (this.searchService) {
      try {
        const filterConfig = await this.searchService.parseQuery(query);
        
        if (this.options.onSearch) {
          this.options.onSearch(filterConfig, query);
        }

        // Also load into filter builder if available
        if (typeof window.filterBuilderInstance !== 'undefined' && filterConfig) {
          window.filterBuilderInstance.loadFilters(filterConfig);
          window.filterBuilderInstance.applyFilters();
        }
      } catch (error) {
        console.error('Error parsing natural language query:', error);
        alert('Could not understand your search. Try rephrasing it.');
      }
    } else {
      // Fallback: simple text search
      if (this.options.onSearch) {
        this.options.onSearch({ query: query }, query);
      }
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    const input = document.getElementById('naturalLanguageSearchInput');
    if (input) {
      input.value = '';
      this.currentQuery = '';
    }
    this.hideSuggestions();

    if (this.options.onSearch) {
      this.options.onSearch(null, '');
    }
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NaturalLanguageSearch };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.NaturalLanguageSearch = NaturalLanguageSearch;
}
