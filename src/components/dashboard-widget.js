/**
 * Dashboard Widget Base Class
 * Abstract base class for all dashboard widgets
 * Provides lifecycle management, event system, and data fetching
 */

class DashboardWidget {
  /**
   * @param {Object} config - Widget configuration
   * @param {string} config.id - Unique widget ID
   * @param {string} config.type - Widget type (metric, chart, list, activity, etc.)
   * @param {string} config.title - Widget title
   * @param {Object} config.options - Widget-specific options
   * @param {HTMLElement} config.container - Container element
   * @param {Object} config.database - Firebase database reference
   */
  constructor(config = {}) {
    if (this.constructor === DashboardWidget) {
      throw new Error('DashboardWidget is abstract and cannot be instantiated directly');
    }

    this.id = config.id || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = config.type || 'unknown';
    this.title = config.title || 'Widget';
    this.options = config.options || {};
    this.container = config.container;
    this.database = config.database || (typeof database !== 'undefined' ? database : null);
    
    this.isRendered = false;
    this.isInitialized = false;
    this.data = null;
    this.error = null;
    this.loading = false;
    
    // Event system
    this.eventListeners = new Map();
    
    // Real-time subscription
    this.realtimeSubscription = null;
    
    // Widget state
    this.state = {
      size: config.size || 'medium', // small, medium, large, full-width
      position: config.position || { x: 0, y: 0 },
      visible: config.visible !== false,
      collapsed: config.collapsed || false
    };
  }

  /**
   * Initialize widget (called once)
   * Override in subclasses for widget-specific initialization
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      await this.onInit();
      this.isInitialized = true;
      this.emit('initialized', { widget: this });
    } catch (error) {
      console.error(`Error initializing widget ${this.id}:`, error);
      this.error = error;
      this.emit('error', { widget: this, error });
    }
  }

  /**
   * Widget-specific initialization
   * Override in subclasses
   */
  async onInit() {
    // Override in subclasses
  }

  /**
   * Render widget
   * Must be implemented by subclasses
   */
  render() {
    throw new Error('render() must be implemented by subclass');
  }

  /**
   * Update widget with new data
   * @param {*} newData - New data to display
   */
  async update(newData) {
    this.data = newData;
    if (this.isRendered) {
      await this.onUpdate(newData);
      this.emit('updated', { widget: this, data: newData });
    }
  }

  /**
   * Widget-specific update logic
   * Override in subclasses
   * @param {*} newData - New data
   */
  async onUpdate(newData) {
    // Override in subclasses
    this.render();
  }

  /**
   * Refresh widget data
   */
  async refresh() {
    this.loading = true;
    this.emit('loading', { widget: this });
    
    try {
      const data = await this.fetchData();
      await this.update(data);
      this.error = null;
    } catch (error) {
      console.error(`Error refreshing widget ${this.id}:`, error);
      this.error = error;
      this.emit('error', { widget: this, error });
    } finally {
      this.loading = false;
      this.emit('loaded', { widget: this });
    }
  }

  /**
   * Fetch widget data
   * Override in subclasses
   * @returns {Promise<*>} Widget data
   */
  async fetchData() {
    // Override in subclasses
    return null;
  }

  /**
   * Subscribe to real-time updates
   * @param {string} path - Firebase path to watch
   * @param {Function} callback - Callback function
   */
  subscribeToRealtime(path, callback) {
    if (!this.database) {
      console.warn('Database not available for real-time subscription');
      return null;
    }

    if (this.realtimeSubscription) {
      this.unsubscribeFromRealtime();
    }

    const ref = this.database.ref(path);
    this.realtimeSubscription = ref.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
      this.update(data);
    }, (error) => {
      console.error(`Real-time subscription error for widget ${this.id}:`, error);
      this.emit('error', { widget: this, error });
    });

    return this.realtimeSubscription;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromRealtime() {
    if (this.realtimeSubscription && this.database) {
      const ref = this.database.ref(this.realtimeSubscription.path);
      ref.off('value', this.realtimeSubscription.callback);
      this.realtimeSubscription = null;
    }
  }

  /**
   * Set widget size
   * @param {string} size - small, medium, large, full-width
   */
  setSize(size) {
    if (['small', 'medium', 'large', 'full-width'].includes(size)) {
      this.state.size = size;
      this.emit('sizeChanged', { widget: this, size });
      if (this.isRendered) {
        this.render();
      }
    }
  }

  /**
   * Set widget position
   * @param {Object} position - { x, y } coordinates
   */
  setPosition(position) {
    this.state.position = { ...this.state.position, ...position };
    this.emit('positionChanged', { widget: this, position: this.state.position });
  }

  /**
   * Toggle widget visibility
   */
  toggleVisibility() {
    this.state.visible = !this.state.visible;
    this.emit('visibilityChanged', { widget: this, visible: this.state.visible });
    if (this.container) {
      this.container.style.display = this.state.visible ? 'block' : 'none';
    }
  }

  /**
   * Toggle widget collapsed state
   */
  toggleCollapsed() {
    this.state.collapsed = !this.state.collapsed;
    this.emit('collapsedChanged', { widget: this, collapsed: this.state.collapsed });
    if (this.isRendered) {
      this.render();
    }
  }

  /**
   * Get widget configuration
   * @returns {Object} Widget configuration
   */
  getConfig() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      options: this.options,
      size: this.state.size,
      position: this.state.position,
      visible: this.state.visible,
      collapsed: this.state.collapsed
    };
  }

  /**
   * Update widget configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.title !== undefined) this.title = config.title;
    if (config.options !== undefined) this.options = { ...this.options, ...config.options };
    if (config.size !== undefined) this.setSize(config.size);
    if (config.position !== undefined) this.setPosition(config.position);
    if (config.visible !== undefined) {
      this.state.visible = config.visible;
      this.toggleVisibility();
    }
    if (config.collapsed !== undefined) {
      this.state.collapsed = config.collapsed;
      if (this.isRendered) this.render();
    }
    
    this.emit('configChanged', { widget: this, config: this.getConfig() });
  }

  /**
   * Event system: Subscribe to event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Event system: Unsubscribe from event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Event system: Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy widget and clean up
   */
  destroy() {
    // Unsubscribe from real-time
    this.unsubscribeFromRealtime();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Call widget-specific cleanup
    this.onDestroy();
    
    this.isRendered = false;
    this.isInitialized = false;
    this.emit('destroyed', { widget: this });
  }

  /**
   * Widget-specific cleanup
   * Override in subclasses
   */
  onDestroy() {
    // Override in subclasses
  }

  /**
   * Get widget HTML
   * Base implementation - override in subclasses
   * @returns {string} HTML string
   */
  getHTML() {
    const sizeClass = `widget-${this.state.size}`;
    const collapsedClass = this.state.collapsed ? 'widget-collapsed' : '';
    const loadingClass = this.loading ? 'widget-loading' : '';
    const errorClass = this.error ? 'widget-error' : '';
    
    return `
      <div class="dashboard-widget ${sizeClass} ${collapsedClass} ${loadingClass} ${errorClass}" data-widget-id="${this.id}">
        <div class="widget-header">
          <h3 class="widget-title">${this.escapeHtml(this.title)}</h3>
          <div class="widget-actions">
            <button class="widget-action-btn" data-action="refresh" title="Refresh">
              <span>🔄</span>
            </button>
            <button class="widget-action-btn" data-action="settings" title="Settings">
              <span>⚙️</span>
            </button>
            <button class="widget-action-btn" data-action="collapse" title="${this.state.collapsed ? 'Expand' : 'Collapse'}">
              <span>${this.state.collapsed ? '▼' : '▲'}</span>
            </button>
            <button class="widget-action-btn" data-action="remove" title="Remove">
              <span>✕</span>
            </button>
          </div>
        </div>
        <div class="widget-content">
          ${this.loading ? '<div class="widget-loading-spinner"></div>' : ''}
          ${this.error ? `<div class="widget-error-message">${this.escapeHtml(this.error.message)}</div>` : ''}
          ${!this.loading && !this.error ? this.getContentHTML() : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get widget content HTML
   * Override in subclasses
   * @returns {string} Content HTML
   */
  getContentHTML() {
    return '<p>Widget content</p>';
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
  module.exports = { DashboardWidget };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DashboardWidget = DashboardWidget;
}
