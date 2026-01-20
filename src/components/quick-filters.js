/**
 * Quick Filters Component (TASK-1.7.1)
 * Pills/badges for quick filter toggles
 */

class QuickFilters {
  constructor(containerId = 'quick-filters', options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`QuickFilters: Container with id "${containerId}" not found`);
      return;
    }

    this.options = {
      filters: [],
      activeFilters: new Set(),
      onFilterChange: null,
      ...options
    };

    this.isInitialized = false;
    this.init();
  }

  /**
   * Initialize quick filters
   */
  init() {
    if (this.isInitialized) return;

    this.render();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  /**
   * Set filters
   * @param {Array} filters - Array of filter objects { id, label, value, active }
   */
  setFilters(filters) {
    this.options.filters = filters || [];
    this.updateActiveFilters();
    this.render();
  }

  /**
   * Update active filters from filter objects
   */
  updateActiveFilters() {
    this.options.activeFilters.clear();
    this.options.filters.forEach(filter => {
      if (filter.active) {
        this.options.activeFilters.add(filter.id || filter.value);
      }
    });
  }

  /**
   * Render quick filters
   */
  render() {
    if (!this.container) return;

    const filters = this.options.filters;
    
    if (filters.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    this.container.innerHTML = `
      <div class="quick-filters-container">
        ${filters.map(filter => this.renderFilterPill(filter)).join('')}
      </div>
    `;
  }

  /**
   * Render filter pill
   * @param {Object} filter - Filter object
   * @returns {string} HTML string
   */
  renderFilterPill(filter) {
    const filterId = filter.id || filter.value;
    const isActive = this.options.activeFilters.has(filterId) || filter.active;
    const activeClass = isActive ? 'active' : '';
    const label = filter.label || filter.value || filterId;

    return `
      <button 
        class="quick-filter-pill ${activeClass}" 
        data-filter-id="${filterId}"
        data-filter-value="${filter.value || filterId}"
        aria-pressed="${isActive}"
        title="${filter.tooltip || label}">
        ${filter.icon ? `<span class="filter-icon">${filter.icon}</span>` : ''}
        <span class="filter-label">${label}</span>
        ${filter.count !== undefined ? `<span class="filter-count">${filter.count}</span>` : ''}
      </button>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const pills = this.container.querySelectorAll('.quick-filter-pill');
    
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const filterId = pill.getAttribute('data-filter-id');
        const filterValue = pill.getAttribute('data-filter-value');
        
        this.toggleFilter(filterId, filterValue);
      });
    });
  }

  /**
   * Toggle filter
   * @param {string} filterId - Filter ID
   * @param {string} filterValue - Filter value
   */
  toggleFilter(filterId, filterValue) {
    const isActive = this.options.activeFilters.has(filterId);
    
    if (isActive) {
      this.options.activeFilters.delete(filterId);
    } else {
      this.options.activeFilters.add(filterId);
    }

    // Update filter object
    const filter = this.options.filters.find(f => (f.id || f.value) === filterId);
    if (filter) {
      filter.active = !isActive;
    }

    // Update UI
    this.render();
    this.setupEventListeners();

    // Trigger callback
    if (this.options.onFilterChange) {
      this.options.onFilterChange({
        filterId: filterId,
        filterValue: filterValue,
        active: !isActive,
        activeFilters: Array.from(this.options.activeFilters)
      });
    }

    // Update state manager if available
    if (typeof crmState !== 'undefined') {
      const currentFilters = crmState.getState('filters') || {};
      if (!isActive) {
        currentFilters[filterId] = filterValue;
      } else {
        delete currentFilters[filterId];
      }
      crmState.setState('filters', currentFilters);
    }
  }

  /**
   * Set filter active state
   * @param {string} filterId - Filter ID
   * @param {boolean} active - Active state
   */
  setFilterActive(filterId, active) {
    if (active) {
      this.options.activeFilters.add(filterId);
    } else {
      this.options.activeFilters.delete(filterId);
    }

    const filter = this.options.filters.find(f => (f.id || f.value) === filterId);
    if (filter) {
      filter.active = active;
    }

    this.render();
    this.setupEventListeners();
  }

  /**
   * Get active filters
   * @returns {Array} Array of active filter IDs
   */
  getActiveFilters() {
    return Array.from(this.options.activeFilters);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.options.activeFilters.clear();
    this.options.filters.forEach(filter => {
      filter.active = false;
    });
    this.render();
    this.setupEventListeners();

    if (this.options.onFilterChange) {
      this.options.onFilterChange({
        activeFilters: []
      });
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QuickFilters };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.QuickFilters = QuickFilters;
}
