/**
 * Filter Builder Component
 * Visual filter builder UI with AND/OR logic support
 */

class FilterBuilder {
  /**
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      fields: options.fields || this.getDefaultFields(),
      onFilterChange: options.onFilterChange || null,
      initialFilters: options.initialFilters || null,
      ...options
    };

    this.filterGroups = []; // Array of filter groups (each group has AND logic, groups are OR'd)
    this.currentGroupIndex = 0;
    this.isOpen = false;

    this.init();
  }

  /**
   * Initialize filter builder
   */
  init() {
    if (!this.container) {
      throw new Error('FilterBuilder: Container not set');
    }

    this.render();
    
    // Load initial filters if provided
    if (this.options.initialFilters) {
      this.loadFilters(this.options.initialFilters);
    }
  }

  /**
   * Get default field definitions
   * @returns {Array} Field definitions
   */
  getDefaultFields() {
    return [
      {
        id: 'disposition',
        label: 'Disposition',
        type: 'select',
        options: [
          { value: 'interested', label: 'Interested' },
          { value: 'not_interested', label: 'Not Interested' },
          { value: 'no_answer', label: 'No Answer' },
          { value: 'call_back', label: 'Call Back' },
          { value: 'other', label: 'Other' },
          { value: 'none', label: 'Not Set' }
        ]
      },
      {
        id: 'leadStatus',
        label: 'Lead Status',
        type: 'select',
        options: [
          { value: 'new', label: 'New' },
          { value: 'converted', label: 'Converted' },
          { value: 'lost', label: 'Lost' }
        ]
      },
      {
        id: 'agentEmail',
        label: 'Agent',
        type: 'select',
        options: [] // Will be populated dynamically
      },
      {
        id: 'plan.type',
        label: 'Plan Type',
        type: 'select',
        options: [
          { value: 'basic', label: 'Basic' },
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' }
        ]
      },
      {
        id: 'timestamp',
        label: 'Created Date',
        type: 'dateRange'
      },
      {
        id: 'submittedAt',
        label: 'Submitted Date',
        type: 'dateRange'
      },
      {
        id: 'contact.name',
        label: 'Name',
        type: 'text'
      },
      {
        id: 'contact.email',
        label: 'Email',
        type: 'text'
      },
      {
        id: 'contact.phone',
        label: 'Phone',
        type: 'text'
      },
      {
        id: 'applianceCount',
        label: 'Appliance Count',
        type: 'number',
        operators: ['equals', 'greaterThan', 'lessThan']
      },
      {
        id: 'boilerCover',
        label: 'Boiler Cover',
        type: 'select',
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' }
        ]
      }
    ];
  }

  /**
   * Render filter builder
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="filter-builder-container">
        <div class="filter-builder-header">
          <h3>Advanced Filters</h3>
          <div class="filter-builder-actions">
            <button class="btn btn-secondary" id="addFilterGroupBtn">+ Add Group (OR)</button>
            <button class="btn btn-primary" id="applyFiltersBtn">Apply Filters</button>
            <button class="btn btn-secondary" id="clearFiltersBtn">Clear All</button>
            <button class="btn btn-secondary" id="toggleBuilderBtn">${this.isOpen ? '▼' : '▶'}</button>
          </div>
        </div>
        <div class="filter-builder-content" id="filterBuilderContent" style="display: ${this.isOpen ? 'block' : 'none'};">
          <div class="filter-groups" id="filterGroups">
            <!-- Filter groups will be rendered here -->
          </div>
          <div class="filter-builder-footer">
            <div class="filter-summary" id="filterSummary">
              <span>No filters applied</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    this.setupEventListeners();

    // Render initial filter group
    if (this.filterGroups.length === 0) {
      this.addFilterGroup();
    } else {
      this.renderFilterGroups();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add filter group button
    const addGroupBtn = document.getElementById('addFilterGroupBtn');
    if (addGroupBtn) {
      addGroupBtn.addEventListener('click', () => {
        this.addFilterGroup();
      });
    }

    // Apply filters button
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    // Clear filters button
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Toggle builder button
    const toggleBtn = document.getElementById('toggleBuilderBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleBuilder();
      });
    }
  }

  /**
   * Add filter group
   */
  addFilterGroup() {
    const group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filters: [],
      logic: 'AND' // AND logic within group
    };

    this.filterGroups.push(group);
    this.renderFilterGroups();
  }

  /**
   * Remove filter group
   * @param {string} groupId - Group ID
   */
  removeFilterGroup(groupId) {
    this.filterGroups = this.filterGroups.filter(g => g.id !== groupId);
    if (this.filterGroups.length === 0) {
      this.addFilterGroup();
    }
    this.renderFilterGroups();
  }

  /**
   * Add filter to group
   * @param {string} groupId - Group ID
   */
  addFilterToGroup(groupId) {
    const group = this.filterGroups.find(g => g.id === groupId);
    if (!group) return;

    const filter = {
      id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      field: '',
      operator: 'equals',
      value: '',
      groupId: groupId
    };

    group.filters.push(filter);
    this.renderFilterGroups();
  }

  /**
   * Remove filter from group
   * @param {string} groupId - Group ID
   * @param {string} filterId - Filter ID
   */
  removeFilterFromGroup(groupId, filterId) {
    const group = this.filterGroups.find(g => g.id === groupId);
    if (!group) return;

    group.filters = group.filters.filter(f => f.id !== filterId);
    this.renderFilterGroups();
  }

  /**
   * Render filter groups
   */
  renderFilterGroups() {
    const groupsContainer = document.getElementById('filterGroups');
    if (!groupsContainer) return;

    if (this.filterGroups.length === 0) {
      groupsContainer.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No filter groups. Click "Add Group" to get started.</p>';
      return;
    }

    const groupsHTML = this.filterGroups.map((group, groupIndex) => {
      const filtersHTML = group.filters.map((filter, filterIndex) => {
        return this.renderFilterRow(filter, groupIndex, filterIndex);
      }).join('');

      return `
        <div class="filter-group" data-group-id="${group.id}">
          <div class="filter-group-header">
            <span class="filter-group-label">Group ${groupIndex + 1} (AND)</span>
            ${this.filterGroups.length > 1 ? `
              <button class="btn btn-sm btn-danger" onclick="window.filterBuilderInstance?.removeFilterGroup('${group.id}')">Remove Group</button>
            ` : ''}
          </div>
          <div class="filter-group-content">
            ${filtersHTML}
            <button class="btn btn-sm btn-secondary add-filter-btn" onclick="window.filterBuilderInstance?.addFilterToGroup('${group.id}')">
              + Add Filter
            </button>
          </div>
          ${groupIndex < this.filterGroups.length - 1 ? '<div class="filter-group-divider">OR</div>' : ''}
        </div>
      `;
    }).join('');

    groupsContainer.innerHTML = groupsHTML;

    // Setup filter row event listeners
    this.setupFilterRowListeners();

    // Update summary
    this.updateSummary();
  }

  /**
   * Render filter row
   * @param {Object} filter - Filter object
   * @param {number} groupIndex - Group index
   * @param {number} filterIndex - Filter index
   * @returns {string} Filter row HTML
   */
  renderFilterRow(filter, groupIndex, filterIndex) {
    const field = this.options.fields.find(f => f.id === filter.field);
    const fieldLabel = field ? field.label : 'Select Field';
    
    // Get operators for field type
    const operators = this.getOperatorsForField(field);
    const operatorOptions = operators.map(op => {
      const selected = op.value === filter.operator ? 'selected' : '';
      return `<option value="${op.value}" ${selected}>${op.label}</option>`;
    }).join('');

    // Get value input based on field type
    const valueInput = this.renderValueInput(filter, field);

    return `
      <div class="filter-row" data-filter-id="${filter.id}">
        <select class="filter-field-select" data-filter-id="${filter.id}">
          <option value="">Select Field</option>
          ${this.options.fields.map(f => {
            const selected = f.id === filter.field ? 'selected' : '';
            return `<option value="${f.id}" ${selected}>${f.label}</option>`;
          }).join('')}
        </select>
        <select class="filter-operator-select" data-filter-id="${filter.id}">
          ${operatorOptions}
        </select>
        <div class="filter-value-input">
          ${valueInput}
        </div>
        <button class="btn btn-sm btn-danger remove-filter-btn" onclick="window.filterBuilderInstance?.removeFilterFromGroup('${filter.groupId}', '${filter.id}')">
          ✕
        </button>
      </div>
    `;
  }

  /**
   * Get operators for field type
   * @param {Object} field - Field definition
   * @returns {Array} Operators
   */
  getOperatorsForField(field) {
    if (!field) {
      return [{ value: 'equals', label: 'equals' }];
    }

    if (field.type === 'dateRange') {
      return [
        { value: 'between', label: 'between' },
        { value: 'before', label: 'before' },
        { value: 'after', label: 'after' }
      ];
    }

    if (field.type === 'number') {
      return field.operators || [
        { value: 'equals', label: 'equals' },
        { value: 'greaterThan', label: '>' },
        { value: 'lessThan', label: '<' },
        { value: 'greaterThanOrEqual', label: '>=' },
        { value: 'lessThanOrEqual', label: '<=' }
      ];
    }

    if (field.type === 'text') {
      return [
        { value: 'equals', label: 'equals' },
        { value: 'contains', label: 'contains' },
        { value: 'startsWith', label: 'starts with' },
        { value: 'endsWith', label: 'ends with' }
      ];
    }

    // Default for select
    return [
      { value: 'equals', label: 'equals' },
      { value: 'notEquals', label: 'not equals' }
    ];
  }

  /**
   * Render value input based on field type
   * @param {Object} filter - Filter object
   * @param {Object} field - Field definition
   * @returns {string} Value input HTML
   */
  renderValueInput(filter, field) {
    if (!field) {
      return '<input type="text" class="filter-value" data-filter-id="' + filter.id + '" placeholder="Enter value" />';
    }

    if (field.type === 'select' && field.options) {
      const options = field.options.map(opt => {
        const value = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        const selected = filter.value === value ? 'selected' : '';
        return `<option value="${this.escapeHtml(String(value))}" ${selected}>${this.escapeHtml(label)}</option>`;
      }).join('');
      
      return `<select class="filter-value" data-filter-id="${filter.id}"><option value="">Select value</option>${options}</select>`;
    }

    if (field.type === 'dateRange') {
      return `
        <input type="date" class="filter-value filter-value-date-from" data-filter-id="${filter.id}" placeholder="From" />
        <input type="date" class="filter-value filter-value-date-to" data-filter-id="${filter.id}" placeholder="To" />
      `;
    }

    if (field.type === 'number') {
      return `<input type="number" class="filter-value" data-filter-id="${filter.id}" placeholder="Enter number" value="${filter.value || ''}" />`;
    }

    // Default text input
    return `<input type="text" class="filter-value" data-filter-id="${filter.id}" placeholder="Enter value" value="${filter.value || ''}" />`;
  }

  /**
   * Setup filter row event listeners
   */
  setupFilterRowListeners() {
    // Field select change
    this.container.querySelectorAll('.filter-field-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const filterId = select.getAttribute('data-filter-id');
        const fieldId = select.value;
        this.updateFilterField(filterId, fieldId);
      });
    });

    // Operator select change
    this.container.querySelectorAll('.filter-operator-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const filterId = select.getAttribute('data-filter-id');
        const operator = select.value;
        this.updateFilterOperator(filterId, operator);
      });
    });

    // Value input change
    this.container.querySelectorAll('.filter-value').forEach(input => {
      input.addEventListener('change', (e) => {
        const filterId = input.getAttribute('data-filter-id');
        const value = input.value;
        this.updateFilterValue(filterId, value);
      });
    });
  }

  /**
   * Update filter field
   * @param {string} filterId - Filter ID
   * @param {string} fieldId - Field ID
   */
  updateFilterField(filterId, fieldId) {
    const group = this.filterGroups.find(g => g.filters.some(f => f.id === filterId));
    if (!group) return;

    const filter = group.filters.find(f => f.id === filterId);
    if (!filter) return;

    filter.field = fieldId;
    filter.value = ''; // Reset value when field changes

    // Re-render filter row
    this.renderFilterGroups();
  }

  /**
   * Update filter operator
   * @param {string} filterId - Filter ID
   * @param {string} operator - Operator
   */
  updateFilterOperator(filterId, operator) {
    const group = this.filterGroups.find(g => g.filters.some(f => f.id === filterId));
    if (!group) return;

    const filter = group.filters.find(f => f.id === filterId);
    if (!filter) return;

    filter.operator = operator;
  }

  /**
   * Update filter value
   * @param {string} filterId - Filter ID
   * @param {*} value - Value
   */
  updateFilterValue(filterId, value) {
    const group = this.filterGroups.find(g => g.filters.some(f => f.id === filterId));
    if (!group) return;

    const filter = group.filters.find(f => f.id === filterId);
    if (!filter) return;

    // Handle date range
    if (filter.field && this.options.fields.find(f => f.id === filter.field)?.type === 'dateRange') {
      const fromInput = this.container.querySelector(`.filter-value-date-from[data-filter-id="${filterId}"]`);
      const toInput = this.container.querySelector(`.filter-value-date-to[data-filter-id="${filterId}"]`);
      
      if (fromInput && toInput) {
        filter.value = {
          from: fromInput.value,
          to: toInput.value
        };
      }
    } else {
      filter.value = value;
    }

    this.updateSummary();
  }

  /**
   * Get filter configuration
   * @returns {Object} Filter configuration
   */
  getFilters() {
    return {
      groups: this.filterGroups.map(group => ({
        id: group.id,
        logic: group.logic,
        filters: group.filters.filter(f => f.field && f.value !== '').map(f => ({
          field: f.field,
          operator: f.operator,
          value: f.value
        }))
      })).filter(g => g.filters.length > 0)
    };
  }

  /**
   * Load filters from configuration
   * @param {Object} config - Filter configuration
   */
  loadFilters(config) {
    if (!config || !config.groups) {
      return;
    }

    this.filterGroups = config.groups.map(group => ({
      id: group.id || `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      logic: group.logic || 'AND',
      filters: (group.filters || []).map(filter => ({
        id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        field: filter.field,
        operator: filter.operator || 'equals',
        value: filter.value,
        groupId: group.id
      }))
    }));

    if (this.filterGroups.length === 0) {
      this.addFilterGroup();
    }

    this.renderFilterGroups();
  }

  /**
   * Apply filters
   */
  applyFilters() {
    const filters = this.getFilters();
    
    if (this.options.onFilterChange) {
      this.options.onFilterChange(filters);
    }

    this.updateSummary();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filterGroups = [];
    this.addFilterGroup();
    this.renderFilterGroups();
    
    if (this.options.onFilterChange) {
      this.options.onFilterChange({ groups: [] });
    }
  }

  /**
   * Toggle builder visibility
   */
  toggleBuilder() {
    this.isOpen = !this.isOpen;
    const content = document.getElementById('filterBuilderContent');
    const toggleBtn = document.getElementById('toggleBuilderBtn');
    
    if (content) {
      content.style.display = this.isOpen ? 'block' : 'none';
    }
    if (toggleBtn) {
      toggleBtn.textContent = this.isOpen ? '▼' : '▶';
    }
  }

  /**
   * Update filter summary
   */
  updateSummary() {
    const summary = document.getElementById('filterSummary');
    if (!summary) return;

    const filters = this.getFilters();
    const totalFilters = filters.groups.reduce((sum, g) => sum + g.filters.length, 0);

    if (totalFilters === 0) {
      summary.innerHTML = '<span>No filters applied</span>';
    } else {
      summary.innerHTML = `<span>${totalFilters} filter${totalFilters !== 1 ? 's' : ''} across ${filters.groups.length} group${filters.groups.length !== 1 ? 's' : ''}</span>`;
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

// Make available globally for onclick handlers
if (typeof window !== 'undefined') {
  window.FilterBuilder = FilterBuilder;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterBuilder };
}
