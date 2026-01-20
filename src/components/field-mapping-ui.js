/**
 * Field Mapping UI Component
 * Configuration UI for CSV export field mappings
 */

class FieldMappingUI {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSave: null,
      onPreview: null,
      initialMappings: {},
      ...options
    };
    this.mappings = { ...this.options.initialMappings };
    this.isRendered = false;
  }

  /**
   * Render field mapping UI
   * @param {Object} mappings - Initial field mappings
   */
  render(mappings = {}) {
    if (!this.container) return;
    
    this.mappings = { ...mappings };
    
    this.container.innerHTML = `
      <div class="field-mapping-ui">
        <div class="field-mapping-header">
          <h3>CSV Field Mapping Configuration</h3>
          <p class="field-mapping-description">
            Map internal field names to custom CSV column names. Leave blank to use default names.
          </p>
        </div>
        
        <div class="field-mapping-controls">
          <select id="fieldMappingPreset" class="field-mapping-preset">
            <option value="">Select Preset...</option>
            <option value="default">Default Mapping</option>
            <option value="crm-standard">CRM Standard</option>
            <option value="custom">Custom</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="fieldMappingPreviewBtn">Preview CSV</button>
          <button class="btn btn-primary btn-sm" id="fieldMappingSaveBtn">Save Mappings</button>
        </div>
        
        <div class="field-mapping-table-container">
          <table class="field-mapping-table">
            <thead>
              <tr>
                <th>Internal Field Name</th>
                <th>CSV Column Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="fieldMappingTableBody">
              <!-- Mappings will be populated here -->
            </tbody>
          </table>
        </div>
        
        <div class="field-mapping-add">
          <button class="btn btn-outline btn-sm" id="fieldMappingAddBtn">+ Add Custom Mapping</button>
        </div>
      </div>
    `;
    
    this.renderMappings();
    this.setupEventListeners();
    this.isRendered = true;
  }

  /**
   * Render mappings table
   */
  renderMappings() {
    const tbody = document.getElementById('fieldMappingTableBody');
    if (!tbody) return;
    
    // Get all available fields (from export service if available)
    const allFields = this.getAllAvailableFields();
    
    tbody.innerHTML = allFields.map(fieldName => {
      const csvName = this.mappings[fieldName] || fieldName;
      return `
        <tr data-field="${this.escapeHtml(fieldName)}">
          <td class="field-name-cell">
            <code>${this.escapeHtml(fieldName)}</code>
          </td>
          <td class="field-mapping-cell">
            <input 
              type="text" 
              class="field-mapping-input" 
              value="${this.escapeHtml(csvName)}"
              data-field="${this.escapeHtml(fieldName)}"
              placeholder="CSV column name"
            >
          </td>
          <td class="field-actions-cell">
            ${this.mappings[fieldName] ? `
              <button class="btn-icon btn-reset" data-field="${this.escapeHtml(fieldName)}" title="Reset to default">
                ↺
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
    
    // Set up input listeners
    const inputs = tbody.querySelectorAll('.field-mapping-input');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        const fieldName = input.dataset.field;
        const csvName = input.value.trim();
        if (csvName && csvName !== fieldName) {
          this.mappings[fieldName] = csvName;
        } else {
          delete this.mappings[fieldName];
        }
        this.updateResetButtons();
      });
    });
  }

  /**
   * Get all available fields
   * @returns {Array} Array of field names
   */
  getAllAvailableFields() {
    // Use export service if available, otherwise use default list
    if (typeof exportService !== 'undefined' && exportService.getAllFieldNames) {
      return exportService.getAllFieldNames();
    }
    
    // Default field list
    return [
      'customerTitle', 'customerFirstName', 'customerLastName', 'customerFullName',
      'email', 'phone', 'mobile', 'address', 'city', 'postcode',
      'sortCode', 'accountNumber', 'accountName', 'directDebitDate',
      'totalPlanCost', 'planNumber', 'planType', 'agentEmail',
      'leadSource', 'paymentMethod', 'processor', 'customerReference',
      'notes', 'createdAt', 'submittedAt'
    ];
  }

  /**
   * Update reset buttons visibility
   */
  updateResetButtons() {
    const rows = document.querySelectorAll('#fieldMappingTableBody tr');
    rows.forEach(row => {
      const fieldName = row.dataset.field;
      const actionsCell = row.querySelector('.field-actions-cell');
      const input = row.querySelector('.field-mapping-input');
      
      if (this.mappings[fieldName] && input.value !== fieldName) {
        if (!actionsCell.querySelector('.btn-reset')) {
          actionsCell.innerHTML = `
            <button class="btn-icon btn-reset" data-field="${this.escapeHtml(fieldName)}" title="Reset to default">
              ↺
            </button>
          `;
          const resetBtn = actionsCell.querySelector('.btn-reset');
          resetBtn.addEventListener('click', () => {
            this.resetField(fieldName);
          });
        }
      } else {
        actionsCell.innerHTML = '';
      }
    });
  }

  /**
   * Reset field to default
   * @param {string} fieldName - Field name to reset
   */
  resetField(fieldName) {
    delete this.mappings[fieldName];
    const input = document.querySelector(`.field-mapping-input[data-field="${this.escapeHtml(fieldName)}"]`);
    if (input) {
      input.value = fieldName;
    }
    this.updateResetButtons();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Preset selector
    const presetSelect = document.getElementById('fieldMappingPreset');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.loadPreset(e.target.value);
      });
    }
    
    // Save button
    const saveBtn = document.getElementById('fieldMappingSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveMappings();
      });
    }
    
    // Preview button
    const previewBtn = document.getElementById('fieldMappingPreviewBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.previewCSV();
      });
    }
    
    // Add custom mapping button
    const addBtn = document.getElementById('fieldMappingAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.addCustomMapping();
      });
    }
  }

  /**
   * Load preset mappings
   * @param {string} presetName - Preset name
   */
  loadPreset(presetName) {
    const presets = {
      'default': {},
      'crm-standard': {
        'customerFirstName': 'First Name',
        'customerLastName': 'Last Name',
        'customerFullName': 'Full Name',
        'email': 'Email Address',
        'phone': 'Phone Number',
        'address': 'Street Address',
        'postcode': 'Postal Code',
        'sortCode': 'Bank Sort Code',
        'accountNumber': 'Bank Account Number',
        'directDebitDate': 'Direct Debit Date',
        'totalPlanCost': 'Monthly Premium',
        'planType': 'Coverage Type'
      }
    };
    
    if (presets[presetName]) {
      this.mappings = { ...presets[presetName] };
      this.renderMappings();
    }
  }

  /**
   * Get current mappings
   * @returns {Object} Current mappings
   */
  getMappings() {
    return { ...this.mappings };
  }

  /**
   * Set mappings
   * @param {Object} mappings - Mappings to set
   */
  setMappings(mappings) {
    this.mappings = { ...mappings };
    if (this.isRendered) {
      this.renderMappings();
    }
  }

  /**
   * Save mappings
   */
  saveMappings() {
    if (this.options.onSave) {
      this.options.onSave(this.getMappings());
    }
  }

  /**
   * Preview CSV
   */
  previewCSV() {
    if (this.options.onPreview) {
      this.options.onPreview(this.getMappings());
    }
  }

  /**
   * Add custom mapping
   */
  addCustomMapping() {
    const fieldName = prompt('Enter internal field name:');
    if (fieldName && fieldName.trim()) {
      const csvName = prompt('Enter CSV column name:');
      if (csvName && csvName.trim()) {
        this.mappings[fieldName.trim()] = csvName.trim();
        this.renderMappings();
      }
    }
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy component
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isRendered = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FieldMappingUI };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.FieldMappingUI = FieldMappingUI;
}
