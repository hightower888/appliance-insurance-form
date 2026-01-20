/**
 * View Controller Base Class
 * Abstract base class for all view types (table, kanban, timeline, card)
 */

class ViewController {
  /**
   * @param {string} type - View type ('table', 'kanban', 'timeline', 'card')
   * @param {HTMLElement} container - Container element for the view
   * @param {Array} data - Data array to display
   * @param {Object} options - View options
   */
  constructor(type, container, data = [], options = {}) {
    if (this.constructor === ViewController) {
      throw new Error('ViewController is abstract and cannot be instantiated directly');
    }

    this.type = type;
    this.container = container;
    this.data = data;
    this.options = {
      pageSize: 50,
      currentPage: 1,
      filters: {},
      sort: {
        field: null,
        direction: 'asc'
      },
      ...options
    };

    this.isRendered = false;
    this.eventListeners = [];
    
    // Subscribe to state manager if available
    if (typeof crmState !== 'undefined') {
      this.stateUnsubscribe = crmState.subscribe((state) => {
        this.onStateChange(state);
      });
    }

    // TASK-1.3.1: Enhanced view switching logic
    this.setupViewSwitching();
  }

  /**
   * Setup view switching (TASK-1.3.1: View switching logic)
   */
  setupViewSwitching() {
    // Listen for view change events
    if (typeof window !== 'undefined') {
      window.addEventListener('view-changed', (event) => {
        const newView = event.detail?.view;
        if (newView && newView === this.type) {
          // This view is now active
          this.render();
        }
      });
    }
  }

  /**
   * Switch to this view (TASK-1.3.1)
   */
  switchToView() {
    if (typeof crmState !== 'undefined') {
      crmState.setView(this.type);
    }
    this.render();
  }

  /**
   * Render the view
   * Must be implemented by subclasses
   */
  render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Update the view with new data
   * @param {Array} newData - New data array
   */
  update(newData) {
    this.data = newData || this.data;
    this.render();
  }

  /**
   * Destroy the view and clean up
   */
  destroy() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      if (element && handler) {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners = [];

    // Unsubscribe from state manager
    if (this.stateUnsubscribe) {
      this.stateUnsubscribe();
      this.stateUnsubscribe = null;
    }

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }

    this.isRendered = false;
  }

  /**
   * Handle state changes from state manager
   * @param {Object} state - New state
   */
  onStateChange(state) {
    // Override in subclasses if needed
    // Default: update filters and sort from state
    if (state.filters && JSON.stringify(state.filters) !== JSON.stringify(this.options.filters)) {
      this.options.filters = { ...state.filters };
      this.render();
    }

    if (state.sort && JSON.stringify(state.sort) !== JSON.stringify(this.options.sort)) {
      this.options.sort = { ...state.sort };
      this.render();
    }
  }

  /**
   * Apply filters to data
   * @param {Array} data - Data to filter
   * @returns {Array} Filtered data
   */
  applyFilters(data) {
    if (!this.options.filters || Object.keys(this.options.filters).length === 0) {
      return data;
    }

    return data.filter(item => {
      for (const [key, value] of Object.entries(this.options.filters)) {
        if (value === null || value === undefined || value === '') {
          continue; // Skip empty filters
        }

        const itemValue = this.getNestedValue(item, key);
        
        // Handle different filter types
        if (Array.isArray(value)) {
          // Multiple values (OR)
          if (!value.includes(itemValue)) {
            return false;
          }
        } else if (typeof value === 'string') {
          // String search (case-insensitive)
          const searchValue = value.toLowerCase();
          const itemStr = String(itemValue || '').toLowerCase();
          if (!itemStr.includes(searchValue)) {
            return false;
          }
        } else {
          // Exact match
          if (itemValue !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  /**
   * Apply sorting to data
   * @param {Array} data - Data to sort
   * @returns {Array} Sorted data
   */
  applySorting(data) {
    if (!this.options.sort || !this.options.sort.field) {
      return data;
    }

    const { field, direction } = this.options.sort;
    const sorted = [...data];

    sorted.sort((a, b) => {
      const aValue = this.getNestedValue(a, field);
      const bValue = this.getNestedValue(b, field);

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Apply pagination to data
   * @param {Array} data - Data to paginate
   * @returns {Object} { paginatedData, totalPages, currentPage }
   */
  applyPagination(data) {
    const pageSize = this.options.pageSize || 50;
    const currentPage = this.options.currentPage || 1;
    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalPages,
      currentPage,
      totalItems: data.length
    };
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object to get value from
   * @param {string} path - Dot-separated path (e.g., 'contact.name')
   * @returns {*} Value or undefined
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
   * Add event listener (tracked for cleanup)
   * @param {HTMLElement} element - Element to attach listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  addEventListener(element, event, handler) {
    if (element && handler) {
      element.addEventListener(event, handler);
      this.eventListeners.push({ element, event, handler });
    }
  }

  /**
   * Update options
   * @param {Object} newOptions - New options to merge
   */
  setOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.render();
  }

  /**
   * Get current options
   * @returns {Object} Current options
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.container) {
      this.container.innerHTML = `
        <div class="loading-container" style="text-align: center; padding: 40px;">
          <div class="skeleton" style="width: 100%; height: 200px; margin-bottom: 10px;"></div>
          <div class="skeleton" style="width: 80%; height: 200px; margin: 0 auto;"></div>
        </div>
      `;
    }
  }

  /**
   * Show empty state
   * @param {string} message - Message to display
   */
  showEmpty(message = 'No data available') {
    if (this.container) {
      this.container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <p style="font-size: 16px; margin: 0;">${message}</p>
        </div>
      `;
    }
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  showError(message = 'An error occurred') {
    if (this.container) {
      this.container.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 40px;">
          <p style="color: var(--error-color, #dc2626); font-size: 16px; margin-bottom: 15px;">${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Reload</button>
        </div>
      `;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ViewController };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ViewController = ViewController;
}
