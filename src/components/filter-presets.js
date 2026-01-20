/**
 * Filter Presets Component
 * Manages saved filter presets
 */

class FilterPresets {
  /**
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      storageKey: options.storageKey || 'filter_presets',
      onPresetLoad: options.onPresetLoad || null,
      onPresetSave: options.onPresetSave || null,
      ...options
    };

    this.presets = [];
    this.database = options.database || (typeof database !== 'undefined' ? database : null);
    this.currentUserId = this.getCurrentUserId();

    this.init();
  }

  /**
   * Initialize filter presets
   */
  async init() {
    await this.loadPresets();
    this.render();
  }

  /**
   * Get current user ID
   * @returns {string|null} User ID
   */
  getCurrentUserId() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) return user.uid;
    }
    
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.uid || user.email || null;
      }
    } catch (e) {
      // Ignore
    }
    
    return 'anonymous';
  }

  /**
   * Load presets from storage
   * @returns {Promise<void>}
   */
  async loadPresets() {
    try {
      // Try Firebase first
      if (this.database && this.currentUserId) {
        const presetsRef = this.database.ref(`user_filter_presets/${this.currentUserId}`);
        const snapshot = await presetsRef.once('value');
        
        if (snapshot.exists()) {
          const presetsData = snapshot.val();
          this.presets = Object.keys(presetsData).map(key => ({
            id: key,
            ...presetsData[key]
          }));
          return;
        }
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        this.presets = JSON.parse(stored);
      } else {
        this.presets = [];
      }
    } catch (error) {
      console.error('Error loading filter presets:', error);
      this.presets = [];
    }
  }

  /**
   * Save presets to storage
   * @returns {Promise<void>}
   */
  async savePresets() {
    try {
      // Try Firebase first
      if (this.database && this.currentUserId) {
        const presetsRef = this.database.ref(`user_filter_presets/${this.currentUserId}`);
        const updates = {};
        
        this.presets.forEach(preset => {
          const { id, ...presetData } = preset;
          updates[id] = presetData;
        });
        
        await presetsRef.set(updates);
        return;
      }

      // Fallback to localStorage
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.presets));
    } catch (error) {
      console.error('Error saving filter presets:', error);
    }
  }

  /**
   * Render filter presets UI
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="filter-presets-container">
        <div class="filter-presets-header">
          <h4>Saved Filters</h4>
          <button class="btn btn-sm btn-primary" id="saveCurrentPresetBtn">
            💾 Save Current
          </button>
        </div>
        <div class="filter-presets-list" id="filterPresetsList">
          ${this.renderPresetsList()}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render presets list
   * @returns {string} HTML
   */
  renderPresetsList() {
    if (this.presets.length === 0) {
      return '<p style="color: var(--text-secondary); padding: 10px; text-align: center;">No saved filters</p>';
    }

    return this.presets.map(preset => `
      <div class="filter-preset-item" data-preset-id="${preset.id}">
        <div class="preset-info">
          <span class="preset-name">${this.escapeHtml(preset.name || 'Unnamed Filter')}</span>
          ${preset.description ? `<span class="preset-description">${this.escapeHtml(preset.description)}</span>` : ''}
        </div>
        <div class="preset-actions">
          <button class="btn btn-sm btn-primary load-preset-btn" data-preset-id="${preset.id}" title="Load filter">
            📂 Load
          </button>
          <button class="btn btn-sm btn-secondary edit-preset-btn" data-preset-id="${preset.id}" title="Edit name">
            ✏️
          </button>
          <button class="btn btn-sm btn-danger delete-preset-btn" data-preset-id="${preset.id}" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Save current preset button
    const saveBtn = document.getElementById('saveCurrentPresetBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.showSavePresetModal();
      });
    }

    // Load preset buttons
    this.container.querySelectorAll('.load-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = btn.getAttribute('data-preset-id');
        this.loadPreset(presetId);
      });
    });

    // Edit preset buttons
    this.container.querySelectorAll('.edit-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = btn.getAttribute('data-preset-id');
        this.editPreset(presetId);
      });
    });

    // Delete preset buttons
    this.container.querySelectorAll('.delete-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = btn.getAttribute('data-preset-id');
        this.deletePreset(presetId);
      });
    });
  }

  /**
   * Show save preset modal
   */
  showSavePresetModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Save Filter Preset</h3>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="presetName">Name *</label>
            <input type="text" id="presetName" class="form-control" placeholder="e.g., Interested Leads" required />
          </div>
          <div class="form-group">
            <label for="presetDescription">Description</label>
            <textarea id="presetDescription" class="form-control" placeholder="Optional description" rows="2"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn btn-primary" id="confirmSavePresetBtn">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Confirm save button
    const confirmBtn = document.getElementById('confirmSavePresetBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const name = document.getElementById('presetName').value.trim();
        const description = document.getElementById('presetDescription').value.trim();
        
        if (!name) {
          alert('Please enter a name for the preset');
          return;
        }

        this.saveCurrentPreset(name, description);
        modal.remove();
      });
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Save current filter as preset
   * @param {string} name - Preset name
   * @param {string} description - Preset description
   * @returns {Promise<void>}
   */
  async saveCurrentPreset(name, description = '') {
    // Get current filter from filter builder if available
    let currentFilter = null;
    if (typeof window.filterBuilderInstance !== 'undefined') {
      currentFilter = window.filterBuilderInstance.getFilters();
    }

    if (!currentFilter || !currentFilter.groups || currentFilter.groups.length === 0) {
      alert('No filters to save. Please create some filters first.');
      return;
    }

    const preset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      description: description,
      filterConfig: currentFilter,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.presets.push(preset);
    await this.savePresets();
    this.render();

    if (this.options.onPresetSave) {
      this.options.onPresetSave(preset);
    }
  }

  /**
   * Load preset
   * @param {string} presetId - Preset ID
   */
  loadPreset(presetId) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) {
      alert('Preset not found');
      return;
    }

    // Load into filter builder if available
    if (typeof window.filterBuilderInstance !== 'undefined') {
      window.filterBuilderInstance.loadFilters(preset.filterConfig);
      window.filterBuilderInstance.applyFilters();
    }

    if (this.options.onPresetLoad) {
      this.options.onPresetLoad(preset);
    }
  }

  /**
   * Edit preset
   * @param {string} presetId - Preset ID
   */
  async editPreset(presetId) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) {
      alert('Preset not found');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Edit Filter Preset</h3>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="editPresetName">Name *</label>
            <input type="text" id="editPresetName" class="form-control" value="${this.escapeHtml(preset.name)}" required />
          </div>
          <div class="form-group">
            <label for="editPresetDescription">Description</label>
            <textarea id="editPresetDescription" class="form-control" rows="2">${this.escapeHtml(preset.description || '')}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn btn-primary" id="confirmEditPresetBtn">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Confirm edit button
    const confirmBtn = document.getElementById('confirmEditPresetBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        const name = document.getElementById('editPresetName').value.trim();
        const description = document.getElementById('editPresetDescription').value.trim();
        
        if (!name) {
          alert('Please enter a name for the preset');
          return;
        }

        preset.name = name;
        preset.description = description;
        preset.updatedAt = Date.now();

        await this.savePresets();
        this.render();
        modal.remove();
      });
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Delete preset
   * @param {string} presetId - Preset ID
   */
  async deletePreset(presetId) {
    if (!confirm('Are you sure you want to delete this filter preset?')) {
      return;
    }

    this.presets = this.presets.filter(p => p.id !== presetId);
    await this.savePresets();
    this.render();
  }

  /**
   * Get quick filter shortcuts
   * @returns {Array} Quick filter definitions
   */
  getQuickFilters() {
    return [
      {
        id: 'quick_new',
        name: 'New Leads',
        filterConfig: {
          groups: [{
            id: 'group-1',
            logic: 'AND',
            filters: [{
              field: 'leadStatus',
              operator: 'equals',
              value: 'new'
            }]
          }]
        }
      },
      {
        id: 'quick_interested',
        name: 'Interested',
        filterConfig: {
          groups: [{
            id: 'group-1',
            logic: 'AND',
            filters: [{
              field: 'disposition',
              operator: 'equals',
              value: 'interested'
            }]
          }]
        }
      },
      {
        id: 'quick_call_back',
        name: 'Call Back',
        filterConfig: {
          groups: [{
            id: 'group-1',
            logic: 'AND',
            filters: [{
              field: 'disposition',
              operator: 'equals',
              value: 'call_back'
            }]
          }]
        }
      },
      {
        id: 'quick_converted',
        name: 'Converted',
        filterConfig: {
          groups: [{
            id: 'group-1',
            logic: 'AND',
            filters: [{
              field: 'leadStatus',
              operator: 'equals',
              value: 'converted'
            }]
          }]
        }
      }
    ];
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
  module.exports = { FilterPresets };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.FilterPresets = FilterPresets;
}
