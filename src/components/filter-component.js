/**
 * Filter Component
 * Quick filter pills/badges for common filters
 */

class FilterComponent {
  constructor(containerId = 'filterPills', options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      // Create container if it doesn't exist
      const parent = document.querySelector('.admin-tab-content') || document.body;
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'filter-pills-container';
      parent.insertBefore(this.container, parent.firstChild);
    }

    this.options = {
      filters: [],
      onFilterChange: null,
      ...options
    };

    this.activeFilters = new Set();
    this.isInitialized = false;

    // Get initial filters from state manager if available
    if (typeof crmState !== 'undefined') {
      const stateFilters = crmState.getState('filters');
      if (stateFilters) {
        Object.keys(stateFilters).forEach(key => {
          if (stateFilters[key]) {
            this.activeFilters.add(key);
          }
        });
      }
    }

    this.init();
  }

  /**
   * Initialize filter component
   */
  init() {
    if (this.isInitialized) return;

    this.render();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  /**
   * Get default filters
   * @returns {Array} Default filter definitions
   */
  getDefaultFilters() {
    return [
      {
        id: 'status_new',
        label: 'New',
        value: 'new',
        field: 'leadStatus',
        color: 'blue'
      },
      {
        id: 'status_contacted',
        label: 'Contacted',
        value: 'contacted',
        field: 'leadStatus',
        color: 'yellow'
      },
      {
        id: 'status_dispositioned',
        label: 'Dispositioned',
        value: 'dispositioned',
        field: 'leadStatus',
        color: 'green'
      },
      {
        id: 'disposition_interested',
        label: 'Interested',
        value: 'interested',
        field: 'disposition',
        color: 'green'
      },
      {
        id: 'disposition_call_back',
        label: 'Call Back',
        value: 'call_back',
        field: 'disposition',
        color: 'orange'
      },
      {
        id: 'disposition_not_interested',
        label: 'Not Interested',
        value: 'not_interested',
        field: 'disposition',
        color: 'red'
      },
      {
        id: 'disposition_no_answer',
        label: 'No Answer',
        value: 'no_answer',
        field: 'disposition',
        color: 'gray'
      }
    ];
  }

  /**
   * Render filter pills
   */
  render() {
    if (!this.container) return;

    const filters = this.options.filters.length > 0 
      ? this.options.filters 
      : this.getDefaultFilters();

    this.container.innerHTML = `
      <div class="filter-pills">
        ${filters.map(filter => this.renderFilterPill(filter)).join('')}
        ${this.activeFilters.size > 0 ? this.renderClearButton() : ''}
      </div>
      ${this.renderAdvancedFilters()}
    `;
  }

  /**
   * Render advanced filters section
   * @returns {string} HTML string
   */
  renderAdvancedFilters() {
    return `
      <div class="advanced-filters-section">
        <div class="advanced-filters-header">
          <h4>Advanced Filters</h4>
          <button class="btn-link btn-sm" id="toggleAdvancedFilters" aria-label="Toggle advanced filters">
            <span id="advancedFiltersToggleIcon">▼</span>
          </button>
        </div>
        <div class="advanced-filters-content" id="advancedFiltersContent" style="display: none;">
          <div class="advanced-filters-grid">
            <!-- Agent Filter -->
            <div class="advanced-filter-group">
              <label for="filterAgent">Agent</label>
              <select id="filterAgent" class="advanced-filter-select">
                <option value="">All Agents</option>
              </select>
            </div>
            
            <!-- Date Range Filter -->
            <div class="advanced-filter-group">
              <label>Sales Date Range</label>
              <div id="filterDateRange"></div>
            </div>
            
            <!-- DD Date Range Filter -->
            <div class="advanced-filter-group">
              <label>Direct Debit Date Range</label>
              <div id="filterDDDateRange"></div>
            </div>
            
            <!-- Plan Type Filter -->
            <div class="advanced-filter-group">
              <label for="filterPlanType">Plan Type</label>
              <select id="filterPlanType" class="advanced-filter-select">
                <option value="">All Plans</option>
                <option value="Appliance">Appliance Only</option>
                <option value="Appliance + Boiler">Appliance + Boiler</option>
                <option value="Boiler">Boiler Only</option>
              </select>
            </div>
            
            <!-- Appliance Count Filter -->
            <div class="advanced-filter-group">
              <label for="filterApplianceCount">Appliance Count</label>
              <select id="filterApplianceCount" class="advanced-filter-select">
                <option value="">All Counts</option>
                <option value="1">1 Appliance</option>
                <option value="2-3">2-3 Appliances</option>
                <option value="4-5">4-5 Appliances</option>
                <option value="6+">6+ Appliances</option>
              </select>
            </div>
            
            <!-- Boiler Cover Filter -->
            <div class="advanced-filter-group">
              <label for="filterBoilerCover">Boiler Cover</label>
              <select id="filterBoilerCover" class="advanced-filter-select">
                <option value="">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render individual filter pill
   * @param {Object} filter - Filter definition
   * @returns {string} HTML string
   */
  renderFilterPill(filter) {
    const isActive = this.activeFilters.has(filter.id);
    const colorClass = `filter-pill-${filter.color || 'default'}`;
    
    return `
      <button 
        class="filter-pill ${colorClass} ${isActive ? 'active' : ''}"
        data-filter-id="${filter.id}"
        data-filter-field="${filter.field}"
        data-filter-value="${filter.value}"
        aria-pressed="${isActive}"
        title="${filter.label}">
        ${filter.label}
      </button>
    `;
  }

  /**
   * Render clear all button
   * @returns {string} HTML string
   */
  renderClearButton() {
    return `
      <button 
        class="filter-pill filter-pill-clear"
        id="clearAllFilters"
        title="Clear all filters">
        Clear All
      </button>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Filter pill clicks
    const pills = this.container.querySelectorAll('.filter-pill:not(.filter-pill-clear)');
    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        const filterId = pill.getAttribute('data-filter-id');
        this.toggleFilter(filterId);
      });
    });

    // Clear all button
    const clearBtn = this.container.querySelector('#clearAllFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // Advanced filters toggle
    const toggleBtn = this.container.querySelector('#toggleAdvancedFilters');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleAdvancedFilters();
      });
    }

    // Advanced filter inputs
    this.setupAdvancedFilterListeners();
  }

  /**
   * Setup advanced filter event listeners
   */
  setupAdvancedFilterListeners() {
    // Agent filter
    const agentSelect = document.getElementById('filterAgent');
    if (agentSelect) {
      agentSelect.addEventListener('change', () => {
        this.notifyFilterChange();
      });
    }

    // Plan type filter
    const planTypeSelect = document.getElementById('filterPlanType');
    if (planTypeSelect) {
      planTypeSelect.addEventListener('change', () => {
        this.notifyFilterChange();
      });
    }

    // Appliance count filter
    const applianceCountSelect = document.getElementById('filterApplianceCount');
    if (applianceCountSelect) {
      applianceCountSelect.addEventListener('change', () => {
        this.notifyFilterChange();
      });
    }

    // Boiler cover filter
    const boilerCoverSelect = document.getElementById('filterBoilerCover');
    if (boilerCoverSelect) {
      boilerCoverSelect.addEventListener('change', () => {
        this.notifyFilterChange();
      });
    }

    // Date range pickers
    this.setupDateRangePickers();
  }

  /**
   * Setup date range pickers
   */
  setupDateRangePickers() {
    // Sales date range
    const dateRangeContainer = document.getElementById('filterDateRange');
    if (dateRangeContainer && typeof DateRangePicker !== 'undefined') {
      this.salesDateRangePicker = new DateRangePicker(dateRangeContainer, {
        fromLabel: 'From',
        toLabel: 'To',
        fromId: 'filterDateFrom',
        toId: 'filterDateTo',
        onDateChange: () => {
          this.notifyFilterChange();
        }
      });
      this.salesDateRangePicker.render();
    }

    // DD date range
    const ddDateRangeContainer = document.getElementById('filterDDDateRange');
    if (ddDateRangeContainer && typeof DateRangePicker !== 'undefined') {
      this.ddDateRangePicker = new DateRangePicker(ddDateRangeContainer, {
        fromLabel: 'From',
        toLabel: 'To',
        fromId: 'filterDDDateFrom',
        toId: 'filterDDDateTo',
        onDateChange: () => {
          this.notifyFilterChange();
        }
      });
      this.ddDateRangePicker.render();
    }
  }

  /**
   * Toggle advanced filters visibility
   */
  toggleAdvancedFilters() {
    const content = document.getElementById('advancedFiltersContent');
    const icon = document.getElementById('advancedFiltersToggleIcon');
    
    if (content && icon) {
      const isVisible = content.style.display !== 'none';
      content.style.display = isVisible ? 'none' : 'block';
      icon.textContent = isVisible ? '▶' : '▼';
    }
  }

  /**
   * Load agents for agent filter
   * @param {Array} sales - Array of sales to extract agents from
   */
  loadAgents(sales = []) {
    const agentSelect = document.getElementById('filterAgent');
    if (!agentSelect) return;

    const agents = new Set();
    sales.forEach(sale => {
      if (sale.agentEmail) {
        agents.add(sale.agentEmail);
      }
    });

    // Clear existing options except "All Agents"
    agentSelect.innerHTML = '<option value="">All Agents</option>';
    
    // Add agent options
    Array.from(agents).sort().forEach(agentEmail => {
      const option = document.createElement('option');
      option.value = agentEmail;
      option.textContent = agentEmail;
      agentSelect.appendChild(option);
    });
  }

  /**
   * Get advanced filter values
   * @returns {Object} Advanced filter values
   */
  getAdvancedFilters() {
    return {
      agent: document.getElementById('filterAgent')?.value || '',
      dateFrom: document.getElementById('filterDateFrom')?.value || '',
      dateTo: document.getElementById('filterDateTo')?.value || '',
      ddDateFrom: document.getElementById('filterDDDateFrom')?.value || '',
      ddDateTo: document.getElementById('filterDDDateTo')?.value || '',
      planType: document.getElementById('filterPlanType')?.value || '',
      applianceCount: document.getElementById('filterApplianceCount')?.value || '',
      boilerCover: document.getElementById('filterBoilerCover')?.value || ''
    };
  }

  /**
   * Toggle filter
   * @param {string} filterId - Filter ID to toggle
   */
  toggleFilter(filterId) {
    if (this.activeFilters.has(filterId)) {
      this.activeFilters.delete(filterId);
    } else {
      this.activeFilters.add(filterId);
    }

    this.updateState();
    this.render();
    this.setupEventListeners();
    this.notifyFilterChange();
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.activeFilters.clear();
    this.updateState();
    this.render();
    this.setupEventListeners();
    this.notifyFilterChange();
  }

  /**
   * Update state manager
   */
  updateState() {
    if (typeof crmState === 'undefined') return;

    const filters = {};
    const filterDefs = this.options.filters.length > 0 
      ? this.options.filters 
      : this.getDefaultFilters();

    // Build filter object from active filters
    filterDefs.forEach(filter => {
      if (this.activeFilters.has(filter.id)) {
        if (!filters[filter.field]) {
          filters[filter.field] = [];
        }
        if (Array.isArray(filters[filter.field])) {
          filters[filter.field].push(filter.value);
        }
      }
    });

    crmState.setState('filters', filters);
  }

  /**
   * Notify filter change
   */
  notifyFilterChange() {
    const filterDefs = this.options.filters.length > 0 
      ? this.options.filters 
      : this.getDefaultFilters();

    const activeFilterValues = {};
    filterDefs.forEach(filter => {
      if (this.activeFilters.has(filter.id)) {
        if (!activeFilterValues[filter.field]) {
          activeFilterValues[filter.field] = [];
        }
        activeFilterValues[filter.field].push(filter.value);
      }
    });

    // Add advanced filters
    const advancedFilters = this.getAdvancedFilters();
    Object.assign(activeFilterValues, {
      agent: advancedFilters.agent ? [advancedFilters.agent] : [],
      dateRange: advancedFilters.dateFrom || advancedFilters.dateTo ? {
        from: advancedFilters.dateFrom,
        to: advancedFilters.dateTo
      } : null,
      ddDateRange: advancedFilters.ddDateFrom || advancedFilters.ddDateTo ? {
        from: advancedFilters.ddDateFrom,
        to: advancedFilters.ddDateTo
      } : null,
      planType: advancedFilters.planType ? [advancedFilters.planType] : [],
      applianceCount: advancedFilters.applianceCount ? [advancedFilters.applianceCount] : [],
      boilerCover: advancedFilters.boilerCover ? [advancedFilters.boilerCover] : []
    });

    // Update state
    if (typeof crmState !== 'undefined') {
      crmState.setState('filters', activeFilterValues);
    }

    // Call custom callback if provided
    if (this.options.onFilterChange && typeof this.options.onFilterChange === 'function') {
      this.options.onFilterChange(activeFilterValues);
    }

    // Trigger existing filter function if available
    if (typeof filterLeads === 'function') {
      filterLeads();
    }
  }

  /**
   * Set filters programmatically
   * @param {Array} filterIds - Array of filter IDs to activate
   */
  setFilters(filterIds) {
    this.activeFilters = new Set(filterIds);
    this.updateState();
    this.render();
    this.setupEventListeners();
    this.notifyFilterChange();
  }

  /**
   * Get active filters
   * @returns {Object} Active filter values by field
   */
  getActiveFilters() {
    const filterDefs = this.options.filters.length > 0 
      ? this.options.filters 
      : this.getDefaultFilters();

    const activeFilterValues = {};
    filterDefs.forEach(filter => {
      if (this.activeFilters.has(filter.id)) {
        if (!activeFilterValues[filter.field]) {
          activeFilterValues[filter.field] = [];
        }
        activeFilterValues[filter.field].push(filter.value);
      }
    });

    return activeFilterValues;
  }

  /**
   * Update filter definitions
   * @param {Array} filters - New filter definitions
   */
  updateFilters(filters) {
    this.options.filters = filters;
    this.render();
    this.setupEventListeners();
  }

  /**
   * Destroy filter component
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isInitialized = false;
  }
}

// Create singleton instance (will be initialized when needed)
let filterComponentInstance = null;

/**
 * Initialize filter component
 * @param {string} containerId - Container ID
 * @param {Object} options - Options
 */
function initFilterComponent(containerId = 'filterPills', options = {}) {
  if (!filterComponentInstance) {
    filterComponentInstance = new FilterComponent(containerId, options);
  }
  return filterComponentInstance;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterComponent, filterComponentInstance, initFilterComponent };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.FilterComponent = FilterComponent;
  window.filterComponentInstance = filterComponentInstance;
  window.initFilterComponent = initFilterComponent;
}
