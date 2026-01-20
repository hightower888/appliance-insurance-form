/**
 * Saved Views Component (Phase 3 Additional)
 * Save and manage filter/view combinations
 */

class SavedViews {
  constructor(options = {}) {
    this.options = {
      storageKey: options.storageKey || 'crm_saved_views',
      onLoad: options.onLoad || null,
      onSave: options.onSave || null,
      ...options
    };
    
    this.savedViews = this.loadSavedViews();
  }

  /**
   * Save current view/filter combination
   * @param {string} name - View name
   * @param {Object} viewData - View data (filters, sort, columns, etc.)
   * @returns {boolean} Success
   */
  saveView(name, viewData = {}) {
    if (!name || name.trim() === '') {
      console.warn('SavedViews: View name is required');
      return false;
    }

    // Get current filter state
    let filters = {};
    if (typeof filterComponentInstance !== 'undefined' && filterComponentInstance) {
      filters = filterComponentInstance.getAdvancedFilters();
    }

    // Get current sort state
    const sortState = {
      column: typeof currentSortColumn !== 'undefined' ? currentSortColumn : null,
      direction: typeof currentSortDirection !== 'undefined' ? currentSortDirection : 'desc'
    };

    // Get current view state
    const viewState = {
      currentTab: typeof currentTab !== 'undefined' ? currentTab : 'leads',
      currentPage: typeof currentPage !== 'undefined' ? currentPage : 1,
      pageSize: typeof pageSize !== 'undefined' ? pageSize : 50
    };

    const view = {
      id: `view_${Date.now()}`,
      name: name.trim(),
      filters: viewData.filters || filters,
      sort: viewData.sort || sortState,
      viewState: viewData.viewState || viewState,
      columns: viewData.columns || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...viewData
    };

    // Check if view with same name exists
    const existingIndex = this.savedViews.findIndex(v => v.name.toLowerCase() === name.toLowerCase());
    if (existingIndex >= 0) {
      // Update existing
      view.id = this.savedViews[existingIndex].id;
      view.createdAt = this.savedViews[existingIndex].createdAt;
      this.savedViews[existingIndex] = view;
    } else {
      // Add new
      this.savedViews.push(view);
    }

    this.saveSavedViews();

    if (this.options.onSave) {
      this.options.onSave(view);
    }

    console.log('Saved view:', name);
    return true;
  }

  /**
   * Load a saved view
   * @param {string} viewId - View ID or name
   * @returns {Object|null} View data or null
   */
  loadView(viewId) {
    const view = typeof viewId === 'string' && viewId.startsWith('view_')
      ? this.savedViews.find(v => v.id === viewId)
      : this.savedViews.find(v => v.name.toLowerCase() === viewId.toLowerCase());

    if (!view) {
      console.warn('SavedViews: View not found:', viewId);
      return null;
    }

    // Apply filters
    if (view.filters && typeof filterComponentInstance !== 'undefined' && filterComponentInstance) {
      filterComponentInstance.setFilters(view.filters);
    }

    // Apply sort
    if (view.sort && view.sort.column) {
      if (typeof sortLeads === 'function') {
        sortLeads(view.sort.column, view.sort.direction);
      }
    }

    // Apply view state
    if (view.viewState) {
      if (view.viewState.currentTab && typeof switchTab === 'function') {
        switchTab(view.viewState.currentTab);
      }
      if (view.viewState.currentPage && typeof currentPage !== 'undefined') {
        window.currentPage = view.viewState.currentPage;
      }
      if (view.viewState.pageSize && typeof pageSize !== 'undefined') {
        window.pageSize = view.viewState.pageSize;
      }
    }

    if (this.options.onLoad) {
      this.options.onLoad(view);
    }

    console.log('Loaded view:', view.name);
    return view;
  }

  /**
   * Delete a saved view
   * @param {string} viewId - View ID
   * @returns {boolean} Success
   */
  deleteView(viewId) {
    const index = this.savedViews.findIndex(v => v.id === viewId);
    if (index < 0) {
      console.warn('SavedViews: View not found:', viewId);
      return false;
    }

    this.savedViews.splice(index, 1);
    this.saveSavedViews();
    console.log('Deleted view:', viewId);
    return true;
  }

  /**
   * Get all saved views
   * @returns {Array} Saved views
   */
  getSavedViews() {
    return [...this.savedViews];
  }

  /**
   * Get a saved view by ID
   * @param {string} viewId - View ID
   * @returns {Object|null} View or null
   */
  getView(viewId) {
    return this.savedViews.find(v => v.id === viewId) || null;
  }

  /**
   * Render saved views UI
   * @param {HTMLElement} container - Container element
   */
  render(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="saved-views-container">
        <div class="saved-views-header">
          <h3>Saved Views</h3>
          <button class="btn btn-sm btn-primary" id="saveCurrentViewBtn">Save Current View</button>
        </div>
        
        <div class="saved-views-list">
          ${this.renderSavedViewsList()}
        </div>
        
        <div id="saveViewModal" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h4>Save View</h4>
              <button class="modal-close" onclick="this.closest('.modal').style.display='none'">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>View Name</label>
                <input type="text" id="viewNameInput" class="form-control" placeholder="My Custom View">
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="saveFiltersCheck" checked> Save Filters
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="saveSortCheck" checked> Save Sort Order
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" id="saveViewStateCheck" checked> Save View State
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="document.getElementById('saveViewModal').style.display='none'">Cancel</button>
              <button class="btn btn-primary" id="confirmSaveViewBtn">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
  }

  /**
   * Render saved views list
   * @returns {string} HTML string
   */
  renderSavedViewsList() {
    if (this.savedViews.length === 0) {
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No saved views. Save your current filters and view settings for quick access.</p>';
    }

    return this.savedViews.map(view => `
      <div class="saved-view-item" data-view-id="${view.id}">
        <div class="saved-view-info">
          <div class="saved-view-name">${this.escapeHtml(view.name)}</div>
          <div class="saved-view-meta">
            <span>Created: ${new Date(view.createdAt).toLocaleDateString()}</span>
            ${view.filters && Object.keys(view.filters).length > 0 ? '<span class="badge badge-info">Filters</span>' : ''}
            ${view.sort && view.sort.column ? '<span class="badge badge-info">Sorted</span>' : ''}
          </div>
        </div>
        <div class="saved-view-actions">
          <button class="btn btn-xs btn-primary" onclick="this.closest('.saved-views-container').__savedViews?.loadView('${view.id}')">Load</button>
          <button class="btn btn-xs btn-secondary" onclick="this.closest('.saved-views-container').__savedViews?.editView('${view.id}')">Edit</button>
          <button class="btn btn-xs btn-danger" onclick="this.closest('.saved-views-container').__savedViews?.deleteView('${view.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Edit a saved view
   * @param {string} viewId - View ID
   */
  editView(viewId) {
    const view = this.getView(viewId);
    if (!view) return;

    // Show modal with current name
    const modal = document.getElementById('saveViewModal');
    const nameInput = document.getElementById('viewNameInput');
    if (modal && nameInput) {
      nameInput.value = view.name;
      modal.style.display = 'block';
      modal.dataset.editingViewId = viewId;
    }
  }

  /**
   * Setup event listeners
   * @param {HTMLElement} container - Container element
   */
  setupEventListeners(container) {
    // Store reference
    const viewsContainer = container.querySelector('.saved-views-container');
    if (viewsContainer) {
      viewsContainer.__savedViews = this;
    }

    // Save current view button
    const saveBtn = document.getElementById('saveCurrentViewBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const modal = document.getElementById('saveViewModal');
        if (modal) {
          modal.style.display = 'block';
          delete modal.dataset.editingViewId;
          const nameInput = document.getElementById('viewNameInput');
          if (nameInput) nameInput.value = '';
        }
      });
    }

    // Confirm save button
    const confirmBtn = document.getElementById('confirmSaveViewBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('viewNameInput');
        const saveFilters = document.getElementById('saveFiltersCheck')?.checked ?? true;
        const saveSort = document.getElementById('saveSortCheck')?.checked ?? true;
        const saveViewState = document.getElementById('saveViewStateCheck')?.checked ?? true;

        if (!nameInput || !nameInput.value.trim()) {
          alert('Please enter a view name');
          return;
        }

        const viewData = {};
        if (!saveFilters) viewData.filters = {};
        if (!saveSort) viewData.sort = {};
        if (!saveViewState) viewData.viewState = {};

        const modal = document.getElementById('saveViewModal');
        const editingId = modal?.dataset.editingViewId;
        
        if (editingId) {
          // Update existing
          const view = this.getView(editingId);
          if (view) {
            this.saveView(nameInput.value.trim(), { ...view, ...viewData });
          }
        } else {
          // Save new
          this.saveView(nameInput.value.trim(), viewData);
        }

        if (modal) modal.style.display = 'none';
        
        // Re-render list
        const listContainer = container.querySelector('.saved-views-list');
        if (listContainer) {
          listContainer.innerHTML = this.renderSavedViewsList();
          this.setupEventListeners(container); // Re-setup for new items
        }
      });
    }
  }

  /**
   * Load saved views from storage
   * @returns {Array} Saved views
   */
  loadSavedViews() {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('SavedViews: Error loading saved views:', error);
      return [];
    }
  }

  /**
   * Save views to storage
   */
  saveSavedViews() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.savedViews));
    } catch (error) {
      console.error('SavedViews: Error saving views:', error);
    }
  }

  /**
   * Escape HTML
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SavedViews };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SavedViews = SavedViews;
}
