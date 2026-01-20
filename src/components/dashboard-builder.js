/**
 * Dashboard Builder Component
 * Drag-and-drop interface for arranging dashboard widgets
 */

class DashboardBuilder {
  /**
   * @param {HTMLElement} container - Container element for dashboard
   * @param {Object} options - Options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      gridColumns: options.gridColumns || 12,
      widgetGap: options.widgetGap || 20,
      enableResize: options.enableResize !== false,
      enableDrag: options.enableDrag !== false,
      database: options.database || (typeof database !== 'undefined' ? database : null),
      realtimeService: options.realtimeService || (typeof realtimeService !== 'undefined' ? realtimeService : null),
      ...options
    };

    this.widgets = new Map(); // Map<widgetId, widgetInstance>
    this.sortableInstance = null;
    this.isEditMode = false;
    this.onChangeCallback = null;

    // Initialize real-time service
    if (this.options.realtimeService && this.options.database) {
      this.options.realtimeService.initialize(this.options.database);
    }

    // Load SortableJS if not already loaded
    this.loadSortableJS();
  }

  /**
   * Load SortableJS library
   */
  loadSortableJS() {
    if (typeof Sortable !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js';
      script.onload = () => {
        if (typeof Sortable !== 'undefined') {
          resolve();
        } else {
          reject(new Error('SortableJS failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load SortableJS'));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize dashboard builder
   */
  async init() {
    if (!this.container) {
      throw new Error('DashboardBuilder: Container not set');
    }

    // Wait for SortableJS to load
    await this.loadSortableJS();

    // Create dashboard grid
    this.render();
  }

  /**
   * Render dashboard builder
   */
  render() {
    if (!this.container) return;

    // Create dashboard grid container
    this.container.innerHTML = `
      <div class="dashboard-builder-container">
        <div class="dashboard-toolbar">
          <div class="toolbar-left">
            <button class="btn btn-primary" id="addWidgetBtn">
              <span>➕</span> Add Widget
            </button>
            <button class="btn btn-secondary" id="toggleEditModeBtn">
              <span>✏️</span> Edit Layout
            </button>
            <button class="btn btn-secondary" id="saveDashboardBtn" style="display: none;">
              <span>💾</span> Save Layout
            </button>
            <button class="btn btn-secondary" id="resetDashboardBtn" style="display: none;">
              <span>↺</span> Reset
            </button>
          </div>
          <div class="toolbar-right">
            <span class="widget-count">0 widgets</span>
          </div>
        </div>
        <div class="dashboard-grid" id="dashboardGrid">
          <!-- Widgets will be added here -->
        </div>
        <div class="dashboard-empty" id="dashboardEmpty" style="display: none;">
          <div class="empty-state">
            <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 10px;">No widgets yet</p>
            <p style="color: var(--text-tertiary); margin-bottom: 20px;">Click "Add Widget" to get started</p>
            <button class="btn btn-primary" onclick="document.getElementById('addWidgetBtn')?.click()">
              Add Your First Widget
            </button>
          </div>
        </div>
      </div>
    `;

    // Setup event listeners
    this.setupEventListeners();

    // Initialize SortableJS
    this.initSortable();

    // Update empty state
    this.updateEmptyState();
  }

  /**
   * Initialize SortableJS for drag-and-drop
   */
  initSortable() {
    const grid = document.getElementById('dashboardGrid');
    if (!grid || typeof Sortable === 'undefined') {
      console.warn('DashboardBuilder: SortableJS not available or grid not found');
      return;
    }

    // Destroy existing instance
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
    }

    // Create new Sortable instance
    this.sortableInstance = new Sortable(grid, {
      animation: 150,
      handle: this.isEditMode ? '.widget-drag-handle' : null,
      filter: '.widget-action-btn, .widget-content',
      draggable: '.dashboard-widget',
      ghostClass: 'widget-ghost',
      chosenClass: 'widget-chosen',
      dragClass: 'widget-dragging',
      forceFallback: false,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      group: 'dashboard-widgets',
      onStart: (evt) => {
        this.onDragStart(evt);
      },
      onEnd: (evt) => {
        this.onDragEnd(evt);
      },
      onAdd: (evt) => {
        this.onWidgetAdd(evt);
      },
      onRemove: (evt) => {
        this.onWidgetRemove(evt);
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add widget button
    const addBtn = document.getElementById('addWidgetBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showWidgetLibrary();
      });
    }

    // Toggle edit mode button
    const editBtn = document.getElementById('toggleEditModeBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.toggleEditMode();
      });
    }

    // Save dashboard button
    const saveBtn = document.getElementById('saveDashboardBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveDashboard();
      });
    }

    // Reset dashboard button
    const resetBtn = document.getElementById('resetDashboardBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetDashboard();
      });
    }
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    const grid = document.getElementById('dashboardGrid');
    if (grid) {
      if (this.isEditMode) {
        grid.classList.add('edit-mode');
        // Show drag handles
        grid.querySelectorAll('.dashboard-widget').forEach(widget => {
          const handle = document.createElement('div');
          handle.className = 'widget-drag-handle';
          handle.innerHTML = '☰';
          widget.prepend(handle);
        });
        // Show resize handles
        if (this.options.enableResize) {
          this.addResizeHandles();
        }
      } else {
        grid.classList.remove('edit-mode');
        // Remove drag handles
        grid.querySelectorAll('.widget-drag-handle').forEach(handle => handle.remove());
        // Remove resize handles
        this.removeResizeHandles();
      }
    }

    // Update SortableJS configuration
    this.initSortable();

    // Update button states
    const editBtn = document.getElementById('toggleEditModeBtn');
    const saveBtn = document.getElementById('saveDashboardBtn');
    const resetBtn = document.getElementById('resetDashboardBtn');
    
    if (editBtn) {
      editBtn.textContent = this.isEditMode ? '✏️ Done Editing' : '✏️ Edit Layout';
    }
    if (saveBtn) {
      saveBtn.style.display = this.isEditMode ? 'inline-block' : 'none';
    }
    if (resetBtn) {
      resetBtn.style.display = this.isEditMode ? 'inline-block' : 'none';
    }
  }

  /**
   * Add resize handles to widgets
   */
  addResizeHandles() {
    this.widgets.forEach((widget, widgetId) => {
      const widgetEl = this.container.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widgetEl && !widgetEl.querySelector('.widget-resize-handle')) {
        const handle = document.createElement('div');
        handle.className = 'widget-resize-handle';
        handle.innerHTML = '↘';
        widgetEl.appendChild(handle);
        
        // Add resize functionality
        this.setupResizeHandle(handle, widgetEl, widget);
      }
    });
  }

  /**
   * Remove resize handles
   */
  removeResizeHandles() {
    this.container.querySelectorAll('.widget-resize-handle').forEach(handle => handle.remove());
  }

  /**
   * Setup resize handle functionality
   * @param {HTMLElement} handle - Resize handle element
   * @param {HTMLElement} widgetEl - Widget element
   * @param {DashboardWidget} widget - Widget instance
   */
  setupResizeHandle(handle, widgetEl, widget) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = widgetEl.offsetWidth;
      startHeight = widgetEl.offsetHeight;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });

    const onMouseMove = (e) => {
      if (!isResizing) return;
      
      const width = startWidth + (e.clientX - startX);
      const height = startHeight + (e.clientY - startY);
      
      // Constrain to grid
      const minWidth = 200;
      const minHeight = 150;
      const maxWidth = widgetEl.parentElement.offsetWidth;
      
      widgetEl.style.width = Math.max(minWidth, Math.min(width, maxWidth)) + 'px';
      widgetEl.style.height = Math.max(minHeight, height) + 'px';
      
      // Update widget size state
      const newSize = this.calculateSizeFromDimensions(widgetEl.offsetWidth, widgetEl.offsetHeight);
      widget.setSize(newSize);
    };

    const onMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Trigger onChange
      if (this.onChangeCallback) {
        this.onChangeCallback();
      }
    };
  }

  /**
   * Calculate size from dimensions
   * @param {number} width - Widget width
   * @param {number} height - Widget height
   * @returns {string} Size (small, medium, large, full-width)
   */
  calculateSizeFromDimensions(width, height) {
    const gridWidth = this.container.offsetWidth;
    const widthPercent = (width / gridWidth) * 100;
    
    if (widthPercent >= 90) return 'full-width';
    if (widthPercent >= 60) return 'large';
    if (widthPercent >= 40) return 'medium';
    return 'small';
  }

  /**
   * Add widget to dashboard
   * @param {DashboardWidget} widget - Widget instance
   */
  addWidget(widget) {
    if (!widget || !(widget instanceof DashboardWidget)) {
      console.error('DashboardBuilder: Invalid widget');
      return;
    }

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'dashboard-widget-container';
    widgetContainer.setAttribute('data-widget-id', widget.id);
    
    // Set widget container and database
    widget.container = widgetContainer;
    if (this.options.database && !widget.database) {
      widget.database = this.options.database;
    }
    
    // Initialize and render widget
    widget.init().then(() => {
      widget.render();
      
      // Connect to real-time service if available
      if (this.options.realtimeService && widget.subscribeToRealtime) {
        this.connectWidgetToRealtime(widget);
      }
      
      // Add to grid
      const grid = document.getElementById('dashboardGrid');
      if (grid) {
        grid.appendChild(widgetContainer);
        this.widgets.set(widget.id, widget);
        
        // Setup widget event listeners
        this.setupWidgetEvents(widget);
        
        // Update empty state
        this.updateEmptyState();
        
        // Update widget count
        this.updateWidgetCount();
        
        // Add drag handle if in edit mode
        if (this.isEditMode) {
          const handle = document.createElement('div');
          handle.className = 'widget-drag-handle';
          handle.innerHTML = '☰';
          widgetContainer.querySelector('.dashboard-widget')?.prepend(handle);
        }
        
        // Add resize handle if enabled
        if (this.isEditMode && this.options.enableResize) {
          this.addResizeHandles();
        }
      }
    }).catch(error => {
      console.error('Error adding widget:', error);
    });
  }

  /**
   * Connect widget to real-time service
   * @param {DashboardWidget} widget - Widget instance
   */
  connectWidgetToRealtime(widget) {
    if (!this.options.realtimeService || !widget) return;

    // Determine real-time path based on widget type
    let realtimePath = null;
    
    switch (widget.type) {
      case 'metric':
      case 'chart':
        // Subscribe to sales data for metrics/charts
        realtimePath = 'sales';
        break;
      case 'list':
        // Subscribe to sales data for lists
        realtimePath = 'sales';
        break;
      case 'activity':
        // Subscribe to security_logs for activity
        realtimePath = 'security_logs';
        break;
    }

    if (realtimePath) {
      // Use real-time service to subscribe
      const unsubscribe = this.options.realtimeService.subscribe(realtimePath, (data) => {
        // Refresh widget when data changes
        if (widget.refresh) {
          widget.refresh();
        }
      });

      // Store unsubscribe function
      if (!widget.realtimeUnsubscribe) {
        widget.realtimeUnsubscribe = unsubscribe;
      }
    }
  }

  /**
   * Remove widget from dashboard
   * @param {string} widgetId - Widget ID
   */
  removeWidget(widgetId) {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.destroy();
      this.widgets.delete(widgetId);
      
      const widgetEl = this.container.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widgetEl) {
        widgetEl.remove();
      }
      
      this.updateEmptyState();
      this.updateWidgetCount();
      
      if (this.onChangeCallback) {
        this.onChangeCallback();
      }
    }
  }

  /**
   * Setup widget event listeners
   * @param {DashboardWidget} widget - Widget instance
   */
  setupWidgetEvents(widget) {
    // Listen for remove event
    widget.on('remove', () => {
      this.removeWidget(widget.id);
    });
  }

  /**
   * Show widget library modal
   */
  showWidgetLibrary() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>Add Widget</h2>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="widget-library">
            <div class="widget-option" data-widget-type="metric">
              <div class="widget-option-icon">📊</div>
              <div class="widget-option-info">
                <h3>Metric Widget</h3>
                <p>Display KPI values and metrics</p>
              </div>
            </div>
            <div class="widget-option" data-widget-type="chart">
              <div class="widget-option-icon">📈</div>
              <div class="widget-option-info">
                <h3>Chart Widget</h3>
                <p>Display data visualizations</p>
              </div>
            </div>
            <div class="widget-option" data-widget-type="list">
              <div class="widget-option-icon">📋</div>
              <div class="widget-option-info">
                <h3>List Widget</h3>
                <p>Display data lists</p>
              </div>
            </div>
            <div class="widget-option" data-widget-type="activity">
              <div class="widget-option-icon">📝</div>
              <div class="widget-option-info">
                <h3>Activity Widget</h3>
                <p>Display activity feed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup widget option clicks
    modal.querySelectorAll('.widget-option').forEach(option => {
      option.addEventListener('click', () => {
        const widgetType = option.getAttribute('data-widget-type');
        this.createWidgetFromType(widgetType);
        modal.remove();
      });
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Create widget from type
   * @param {string} type - Widget type
   */
  createWidgetFromType(type) {
    const db = this.options.database || (typeof database !== 'undefined' ? database : null);
    
    let widget = null;
    const config = {
      database: db,
      container: null, // Will be set by addWidget
      options: {}
    };

    switch (type) {
      case 'metric':
        if (typeof MetricWidget !== 'undefined') {
          config.title = 'Conversion Rate';
          config.options.metricType = 'conversionRate';
          widget = new MetricWidget(config);
        }
        break;
      case 'chart':
        if (typeof ChartWidget !== 'undefined') {
          config.title = 'Disposition Breakdown';
          config.options.chartType = 'pie';
          config.options.dataType = 'disposition';
          widget = new ChartWidget(config);
        }
        break;
      case 'list':
        if (typeof ListWidget !== 'undefined') {
          config.title = 'Recent Leads';
          config.options.listType = 'recent';
          config.options.limit = 10;
          widget = new ListWidget(config);
        }
        break;
      case 'activity':
        if (typeof ActivityWidget !== 'undefined') {
          config.title = 'Recent Activity';
          config.options.limit = 10;
          widget = new ActivityWidget(config);
        }
        break;
    }

    if (widget) {
      this.addWidget(widget);
    } else {
      console.error(`Widget type ${type} not available`);
    }
  }

  /**
   * Get dashboard configuration
   * @returns {Object} Dashboard configuration
   */
  getConfig() {
    const widgets = [];
    this.widgets.forEach((widget, widgetId) => {
      const widgetEl = this.container.querySelector(`[data-widget-id="${widgetId}"]`);
      if (widgetEl) {
        const rect = widgetEl.getBoundingClientRect();
        const gridRect = widgetEl.parentElement.getBoundingClientRect();
        
        widgets.push({
          id: widgetId,
          config: widget.getConfig(),
          position: {
            x: rect.left - gridRect.left,
            y: rect.top - gridRect.top,
            width: rect.width,
            height: rect.height
          }
        });
      }
    });

    return {
      widgets: widgets,
      layout: 'grid',
      gridColumns: this.options.gridColumns
    };
  }

  /**
   * Load dashboard configuration
   * @param {Object} config - Dashboard configuration
   */
  async loadConfig(config) {
    // Clear existing widgets
    this.widgets.forEach((widget) => {
      widget.destroy();
    });
    this.widgets.clear();
    
    const grid = document.getElementById('dashboardGrid');
    if (grid) {
      grid.innerHTML = '';
    }

    // Load widgets from config
    if (config.widgets && Array.isArray(config.widgets)) {
      for (const widgetConfig of config.widgets) {
        await this.loadWidgetFromConfig(widgetConfig);
      }
    }

    this.updateEmptyState();
    this.updateWidgetCount();
  }

  /**
   * Load widget from configuration
   * @param {Object} widgetConfig - Widget configuration
   */
  async loadWidgetFromConfig(widgetConfig) {
    const { config, position } = widgetConfig;
    const db = this.options.database || (typeof database !== 'undefined' ? database : null);
    
    let widget = null;
    const widgetOptions = {
      ...config,
      database: db,
      container: null
    };

    switch (config.type) {
      case 'metric':
        if (typeof MetricWidget !== 'undefined') {
          widget = new MetricWidget(widgetOptions);
        }
        break;
      case 'chart':
        if (typeof ChartWidget !== 'undefined') {
          widget = new ChartWidget(widgetOptions);
        }
        break;
      case 'list':
        if (typeof ListWidget !== 'undefined') {
          widget = new ListWidget(widgetOptions);
        }
        break;
      case 'activity':
        if (typeof ActivityWidget !== 'undefined') {
          widget = new ActivityWidget(widgetOptions);
        }
        break;
    }

    if (widget) {
      this.addWidget(widget);
      
      // Restore position if provided
      if (position) {
        const widgetEl = this.container.querySelector(`[data-widget-id="${widget.id}"]`);
        if (widgetEl) {
          widgetEl.style.position = 'absolute';
          widgetEl.style.left = position.x + 'px';
          widgetEl.style.top = position.y + 'px';
          widgetEl.style.width = position.width + 'px';
          widgetEl.style.height = position.height + 'px';
        }
      }
    }
  }

  /**
   * Save dashboard
   */
  saveDashboard() {
    const config = this.getConfig();
    
    if (this.onChangeCallback) {
      this.onChangeCallback(config);
    }
    
    // Also save to localStorage as backup
    try {
      localStorage.setItem('dashboard_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save dashboard to localStorage:', e);
    }
  }

  /**
   * Reset dashboard
   */
  resetDashboard() {
    if (confirm('Reset dashboard to default layout? This cannot be undone.')) {
      // Clear all widgets
      this.widgets.forEach((widget) => {
        widget.destroy();
      });
      this.widgets.clear();
      
      const grid = document.getElementById('dashboardGrid');
      if (grid) {
        grid.innerHTML = '';
      }
      
      this.updateEmptyState();
      this.updateWidgetCount();
    }
  }

  /**
   * Update empty state visibility
   */
  updateEmptyState() {
    const empty = document.getElementById('dashboardEmpty');
    const grid = document.getElementById('dashboardGrid');
    
    if (empty && grid) {
      empty.style.display = this.widgets.size === 0 ? 'flex' : 'none';
    }
  }

  /**
   * Update widget count
   */
  updateWidgetCount() {
    const countEl = document.querySelector('.widget-count');
    if (countEl) {
      countEl.textContent = `${this.widgets.size} widget${this.widgets.size !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Set onChange callback
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.onChangeCallback = callback;
  }

  /**
   * Drag event handlers
   */
  onDragStart(evt) {
    evt.item.classList.add('dragging');
  }

  onDragEnd(evt) {
    evt.item.classList.remove('dragging');
    
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  onWidgetAdd(evt) {
    // Widget added via drag from library
  }

  onWidgetRemove(evt) {
    // Widget removed
  }

  /**
   * Destroy dashboard builder
   */
  destroy() {
    // Destroy all widgets and unsubscribe from real-time
    this.widgets.forEach((widget) => {
      // Unsubscribe from real-time if connected
      if (widget.realtimeUnsubscribe && typeof widget.realtimeUnsubscribe === 'function') {
        widget.realtimeUnsubscribe();
      }
      widget.destroy();
    });
    this.widgets.clear();

    // Destroy Sortable instance
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
      this.sortableInstance = null;
    }

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DashboardBuilder };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DashboardBuilder = DashboardBuilder;
}
