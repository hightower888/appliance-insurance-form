/**
 * CRM State Manager
 * Centralized state management with undo/redo functionality
 */

class CRMStateManager {
  constructor() {
    this.state = {
      leads: [],
      customers: [],
      filteredLeads: [],
      filteredCustomers: [],
      currentLeadIndex: 0,
      currentCustomerIndex: 0,
      editingLeadId: null,
      isEditMode: false,
      currentPage: 1,
      pageSize: 50,
      totalPages: 1,
      currentTab: 'leads',
      selectedItems: [],
      filters: {},
      sort: {
        field: null,
        direction: 'asc'
      },
      view: 'table', // 'table', 'kanban', 'timeline', 'card'
      currentView: 'table', // Current active view (TASK-1.1.1)
      sidebarCollapsed: false,
      sidebarState: { collapsed: false }, // TASK-1.1.1
      layoutState: { type: 'default', columns: 1 }, // TASK-1.1.1
      userPreferences: {}
    };

    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    this.subscribers = new Set();
    this.isUndoing = false;
    this.isRedoing = false;
  }

  /**
   * Get current state
   * @param {string} path - Optional path to specific state property (e.g., 'leads', 'filters.status')
   * @returns {*} State value or entire state object
   */
  getState(path = null) {
    if (!path) {
      return JSON.parse(JSON.stringify(this.state)); // Deep clone
    }

    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * Set state value
   * @param {string|Object} pathOrState - Path to property or state object
   * @param {*} value - Value to set (if path is string)
   * @param {boolean} skipHistory - Skip adding to history (for undo/redo operations)
   */
  setState(pathOrState, value = undefined, skipHistory = false) {
    // Prevent adding to history during undo/redo operations
    if (this.isUndoing || this.isRedoing) {
      skipHistory = true;
    }

    let oldState;
    if (typeof pathOrState === 'string') {
      // Set specific property
      oldState = this.getState(pathOrState);
      const keys = pathOrState.split('.');
      let target = this.state;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }
      
      target[keys[keys.length - 1]] = value;
    } else {
      // Merge state object
      oldState = JSON.parse(JSON.stringify(this.state));
      this.state = { ...this.state, ...pathOrState };
    }

    // Add to history if not skipping
    if (!skipHistory) {
      this.addToHistory(oldState);
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Add current state to history
   * @param {Object} previousState - Previous state snapshot
   */
  addToHistory(previousState) {
    // Remove any history after current index (when undoing and then making new changes)
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new state to history
    this.history.push({
      state: JSON.parse(JSON.stringify(this.state)),
      timestamp: Date.now()
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex = this.history.length - 1;
    }
  }

  /**
   * Undo last state change
   * @returns {boolean} True if undo was successful
   */
  undo() {
    if (this.historyIndex <= 0) {
      return false; // No history to undo
    }

    this.isUndoing = true;
    this.historyIndex--;
    const previousState = this.history[this.historyIndex].state;
    this.state = JSON.parse(JSON.stringify(previousState));
    this.notifySubscribers();
    this.isUndoing = false;

    return true;
  }

  /**
   * Redo last undone state change
   * @returns {boolean} True if redo was successful
   */
  redo() {
    if (this.historyIndex >= this.history.length - 1) {
      return false; // No history to redo
    }

    this.isRedoing = true;
    this.historyIndex++;
    const nextState = this.history[this.historyIndex].state;
    this.state = JSON.parse(JSON.stringify(nextState));
    this.notifySubscribers();
    this.isRedoing = false;

    return true;
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function to call on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Subscriber must be a function');
    }

    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Unsubscribe from state changes
   * @param {Function} callback - Callback function to remove
   */
  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of state changes
   */
  notifySubscribers() {
    const state = this.getState();
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  /**
   * Reset state to initial values
   */
  reset() {
    const initialState = {
      leads: [],
      customers: [],
      filteredLeads: [],
      filteredCustomers: [],
      currentLeadIndex: 0,
      currentCustomerIndex: 0,
      editingLeadId: null,
      isEditMode: false,
      currentPage: 1,
      pageSize: 50,
      totalPages: 1,
      currentTab: 'leads',
      selectedItems: [],
      filters: {},
      sort: {
        field: null,
        direction: 'asc'
      },
      view: 'table',
      sidebarCollapsed: false,
      userPreferences: {}
    };

    this.setState(initialState, undefined, true); // Skip history
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * Save state to localStorage
   * @param {string} key - Storage key (default: 'crm_state')
   */
  saveToStorage(key = 'crm_state') {
    try {
      const stateToSave = {
        userPreferences: this.state.userPreferences,
        sidebarCollapsed: this.state.sidebarCollapsed,
        view: this.state.view,
        pageSize: this.state.pageSize
      };
      localStorage.setItem(key, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   * @param {string} key - Storage key (default: 'crm_state')
   */
  loadFromStorage(key = 'crm_state') {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const savedState = JSON.parse(saved);
        this.setState({
          userPreferences: savedState.userPreferences || {},
          sidebarCollapsed: savedState.sidebarCollapsed || false,
          view: savedState.view || 'table',
          pageSize: savedState.pageSize || 50
        }, undefined, true); // Skip history
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * Get history size
   * @returns {number}
   */
  getHistorySize() {
    return this.history.length;
  }

  /**
   * Set current view (TASK-1.1.1: View state management)
   * @param {string} viewName - View name ('table', 'kanban', 'timeline', 'card')
   */
  setView(viewName) {
    this.setState('currentView', viewName);
    this.setState('view', viewName); // Also update legacy view property
  }

  /**
   * Get current view (TASK-1.1.1)
   * @returns {string} Current view name
   */
  getCurrentView() {
    return this.getState('currentView') || this.getState('view') || 'table';
  }

  /**
   * Set sidebar state (TASK-1.1.1: Sidebar state management)
   * @param {boolean} collapsed - Whether sidebar is collapsed
   */
  setSidebarState(collapsed) {
    this.setState('sidebarCollapsed', collapsed);
    this.setState('sidebarState', { collapsed: collapsed });
  }

  /**
   * Get sidebar state (TASK-1.1.1)
   * @returns {Object} Sidebar state object
   */
  getSidebarState() {
    const collapsed = this.getState('sidebarCollapsed') || false;
    return { collapsed: collapsed };
  }

  /**
   * Set layout state (TASK-1.1.1: Layout state management)
   * @param {Object} layoutConfig - Layout configuration { type, columns, etc. }
   */
  setLayoutState(layoutConfig) {
    this.setState('layoutState', { ...this.getState('layoutState'), ...layoutConfig });
  }

  /**
   * Get layout state (TASK-1.1.1)
   * @returns {Object} Layout state object
   */
  getLayoutState() {
    return this.getState('layoutState') || { type: 'default', columns: 1 };
  }
}

// Create singleton instance
const crmState = new CRMStateManager();

// Load persisted preferences on initialization
if (typeof window !== 'undefined') {
  crmState.loadFromStorage();
  
  // Save preferences on page unload
  window.addEventListener('beforeunload', () => {
    crmState.saveToStorage();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CRMStateManager, crmState };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.crmState = crmState;
  window.CRMStateManager = CRMStateManager;
}
