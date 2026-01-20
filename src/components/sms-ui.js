/**
 * SMS UI Component
 * Interface for sending SMS messages with templates and bulk sending
 */

class SMSUI {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onSend: null,
      onBulkSend: null,
      sales: [],
      ...options
    };
    this.selectedRecipients = new Set();
    this.isRendered = false;
  }

  /**
   * Render SMS UI
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="sms-ui">
        <div class="sms-ui-header">
          <h3>📱 SMS Messaging</h3>
          <p class="sms-ui-description">Send SMS messages to customers with templates and bulk sending support.</p>
        </div>
        
        <div class="sms-ui-tabs">
          <button class="sms-tab active" data-tab="single">Single Message</button>
          <button class="sms-tab" data-tab="bulk">Bulk Message</button>
          <button class="sms-tab" data-tab="templates">Templates</button>
        </div>
        
        <!-- Single Message Tab -->
        <div id="smsSingleTab" class="sms-tab-content active">
          <div class="sms-form">
            <div class="form-group">
              <label for="smsPhone">Phone Number</label>
              <input type="tel" id="smsPhone" class="form-input" placeholder="+441234567890">
            </div>
            <div class="form-group">
              <label for="smsMessage">Message</label>
              <textarea id="smsMessage" class="form-textarea" rows="4" placeholder="Enter your message..."></textarea>
              <small class="form-hint">160 characters per SMS. Messages longer than 160 characters will be split.</small>
            </div>
            <div class="form-group">
              <label for="smsTemplateSelect">Use Template (Optional)</label>
              <select id="smsTemplateSelect" class="form-select">
                <option value="">No Template</option>
              </select>
            </div>
            <button class="btn btn-primary" id="smsSendBtn">Send SMS</button>
          </div>
        </div>
        
        <!-- Bulk Message Tab -->
        <div id="smsBulkTab" class="sms-tab-content" style="display: none;">
          <div class="sms-bulk-form">
            <div class="form-group">
              <label>Select Recipients</label>
              <div class="sms-recipient-selection">
                <div class="sms-recipient-controls">
                  <button class="btn btn-secondary btn-sm" id="smsSelectAllBtn">Select All</button>
                  <button class="btn btn-secondary btn-sm" id="smsDeselectAllBtn">Deselect All</button>
                  <span class="sms-selection-count">0 selected</span>
                </div>
                <div class="sms-recipient-list" id="smsRecipientList">
                  <!-- Recipients will be populated here -->
                </div>
              </div>
            </div>
            <div class="form-group">
              <label for="smsBulkMessage">Message</label>
              <textarea id="smsBulkMessage" class="form-textarea" rows="4" placeholder="Enter your message..."></textarea>
              <small class="form-hint">Use {{variableName}} for dynamic content (e.g., {{name}}, {{planNumber}}).</small>
            </div>
            <div class="form-group">
              <label for="smsBulkTemplateSelect">Use Template (Optional)</label>
              <select id="smsBulkTemplateSelect" class="form-select">
                <option value="">No Template</option>
              </select>
            </div>
            <button class="btn btn-primary" id="smsBulkSendBtn">Send Bulk SMS</button>
          </div>
        </div>
        
        <!-- Templates Tab -->
        <div id="smsTemplatesTab" class="sms-tab-content" style="display: none;">
          <div class="sms-templates">
            <div class="sms-templates-header">
              <h4>Manage Templates</h4>
              <button class="btn btn-primary btn-sm" id="smsCreateTemplateBtn">+ Create Template</button>
            </div>
            <div class="sms-templates-list" id="smsTemplatesList">
              <!-- Templates will be populated here -->
            </div>
          </div>
        </div>
        
        <!-- Progress Modal -->
        <div id="smsProgressModal" class="bulk-operations-modal" style="display: none;">
          <div class="bulk-operations-modal-content">
            <div class="bulk-operations-modal-header">
              <h3>Sending SMS Messages</h3>
            </div>
            <div class="bulk-operations-modal-body">
              <div class="bulk-operations-progress">
                <div class="bulk-operations-progress-bar">
                  <div class="bulk-operations-progress-fill" id="smsProgressFill" style="width: 0%"></div>
                </div>
                <p class="bulk-operations-progress-text" id="smsProgressText">Preparing...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
    this.loadTemplates();
    this.loadRecipients();
    this.isRendered = true;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab switching
    const tabs = this.container.querySelectorAll('.sms-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Single SMS send
    const sendBtn = document.getElementById('smsSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendSingleSMS());
    }

    // Bulk SMS send
    const bulkSendBtn = document.getElementById('smsBulkSendBtn');
    if (bulkSendBtn) {
      bulkSendBtn.addEventListener('click', () => this.sendBulkSMS());
    }

    // Template selection
    const templateSelect = document.getElementById('smsTemplateSelect');
    if (templateSelect) {
      templateSelect.addEventListener('change', (e) => {
        this.applyTemplate(e.target.value, 'single');
      });
    }

    const bulkTemplateSelect = document.getElementById('smsBulkTemplateSelect');
    if (bulkTemplateSelect) {
      bulkTemplateSelect.addEventListener('change', (e) => {
        this.applyTemplate(e.target.value, 'bulk');
      });
    }

    // Recipient selection
    const selectAllBtn = document.getElementById('smsSelectAllBtn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAllRecipients());
    }

    const deselectAllBtn = document.getElementById('smsDeselectAllBtn');
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => this.deselectAllRecipients());
    }

    // Create template
    const createTemplateBtn = document.getElementById('smsCreateTemplateBtn');
    if (createTemplateBtn) {
      createTemplateBtn.addEventListener('click', () => this.showCreateTemplateModal());
    }
  }

  /**
   * Switch tabs
   * @param {string} tabName - Tab name
   */
  switchTab(tabName) {
    // Update tab buttons
    const tabs = this.container.querySelectorAll('.sms-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update tab content
    const tabContents = this.container.querySelectorAll('.sms-tab-content');
    tabContents.forEach(content => {
      if (content.id === `sms${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`) {
        content.style.display = 'block';
        content.classList.add('active');
      } else {
        content.style.display = 'none';
        content.classList.remove('active');
      }
    });
  }

  /**
   * Load templates
   */
  async loadTemplates() {
    if (typeof smsService === 'undefined') return;
    
    try {
      const templates = smsService.getTemplates();
      this.populateTemplateSelects(templates);
      this.renderTemplatesList(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  /**
   * Populate template selects
   * @param {Array} templates - Array of templates
   */
  populateTemplateSelects(templates) {
    const singleSelect = document.getElementById('smsTemplateSelect');
    const bulkSelect = document.getElementById('smsBulkTemplateSelect');
    
    const options = templates.map(t => 
      `<option value="${t.id}">${this.escapeHtml(t.name)}</option>`
    ).join('');
    
    if (singleSelect) {
      singleSelect.innerHTML = '<option value="">No Template</option>' + options;
    }
    if (bulkSelect) {
      bulkSelect.innerHTML = '<option value="">No Template</option>' + options;
    }
  }

  /**
   * Apply template to message
   * @param {string} templateId - Template ID
   * @param {string} type - 'single' or 'bulk'
   */
  applyTemplate(templateId, type) {
    if (!templateId || typeof smsService === 'undefined') return;
    
    const template = smsService.getTemplate(templateId);
    if (!template) return;
    
    const messageField = type === 'single' 
      ? document.getElementById('smsMessage')
      : document.getElementById('smsBulkMessage');
    
    if (messageField) {
      messageField.value = template.content;
    }
  }

  /**
   * Load recipients from sales
   */
  loadRecipients() {
    const recipientList = document.getElementById('smsRecipientList');
    if (!recipientList || !this.options.sales) return;
    
    recipientList.innerHTML = this.options.sales.map(sale => {
      const contact = sale.contact || {};
      const phone = contact.phone || '';
      const name = contact.name || 'Unknown';
      
      return `
        <div class="sms-recipient-item">
          <input 
            type="checkbox" 
            class="sms-recipient-checkbox" 
            data-sale-id="${sale.id || sale.saleId}"
            data-phone="${this.escapeHtml(phone)}"
            data-name="${this.escapeHtml(name)}"
          >
          <label>
            <strong>${this.escapeHtml(name)}</strong>
            <span class="sms-recipient-phone">${this.escapeHtml(phone)}</span>
          </label>
        </div>
      `;
    }).join('');
    
    // Add checkbox listeners
    const checkboxes = recipientList.querySelectorAll('.sms-recipient-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectionCount();
      });
    });
  }

  /**
   * Select all recipients
   */
  selectAllRecipients() {
    const checkboxes = document.querySelectorAll('.sms-recipient-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = true;
      this.selectedRecipients.add(cb.getAttribute('data-sale-id'));
    });
    this.updateSelectionCount();
  }

  /**
   * Deselect all recipients
   */
  deselectAllRecipients() {
    const checkboxes = document.querySelectorAll('.sms-recipient-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    this.selectedRecipients.clear();
    this.updateSelectionCount();
  }

  /**
   * Update selection count
   */
  updateSelectionCount() {
    const count = document.querySelectorAll('.sms-recipient-checkbox:checked').length;
    const countSpan = document.querySelector('.sms-selection-count');
    if (countSpan) {
      countSpan.textContent = `${count} selected`;
    }
    
    // Update selected recipients set
    this.selectedRecipients.clear();
    document.querySelectorAll('.sms-recipient-checkbox:checked').forEach(cb => {
      this.selectedRecipients.add(cb.getAttribute('data-sale-id'));
    });
  }

  /**
   * Send single SMS
   */
  async sendSingleSMS() {
    const phone = document.getElementById('smsPhone')?.value.trim();
    const message = document.getElementById('smsMessage')?.value.trim();
    
    if (!phone || !message) {
      alert('Please enter phone number and message');
      return;
    }
    
    if (this.options.onSend) {
      await this.options.onSend(phone, message);
    } else if (typeof smsService !== 'undefined') {
      try {
        await smsService.sendSMS(phone, message);
        alert('SMS sent successfully');
        document.getElementById('smsPhone').value = '';
        document.getElementById('smsMessage').value = '';
      } catch (error) {
        alert('Error sending SMS: ' + error.message);
      }
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS() {
    const message = document.getElementById('smsBulkMessage')?.value.trim();
    const selectedCheckboxes = document.querySelectorAll('.sms-recipient-checkbox:checked');
    
    if (!message) {
      alert('Please enter a message');
      return;
    }
    
    if (selectedCheckboxes.length === 0) {
      alert('Please select at least one recipient');
      return;
    }
    
    const recipients = Array.from(selectedCheckboxes).map(cb => ({
      phone: cb.getAttribute('data-phone'),
      saleId: cb.getAttribute('data-sale-id'),
      name: cb.getAttribute('data-name')
    }));
    
    if (this.options.onBulkSend) {
      await this.options.onBulkSend(recipients, message);
    } else if (typeof smsService !== 'undefined') {
      try {
        this.showProgress();
        const result = await smsService.sendBulkSMS(recipients, message, {
          onProgress: (current, total) => {
            this.updateProgress(current, total);
          }
        });
        this.hideProgress();
        alert(`Sent ${result.success.length} SMS messages${result.failed.length > 0 ? `, ${result.failed.length} failed` : ''}`);
      } catch (error) {
        this.hideProgress();
        alert('Error sending bulk SMS: ' + error.message);
      }
    }
  }

  /**
   * Show progress modal
   */
  showProgress() {
    const modal = document.getElementById('smsProgressModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Update progress
   * @param {number} current - Current progress
   * @param {number} total - Total count
   */
  updateProgress(current, total) {
    const fill = document.getElementById('smsProgressFill');
    const text = document.getElementById('smsProgressText');
    
    if (fill) {
      fill.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;
    }
    if (text) {
      text.textContent = `Sending ${current} of ${total} messages...`;
    }
  }

  /**
   * Hide progress modal
   */
  hideProgress() {
    const modal = document.getElementById('smsProgressModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Render templates list
   * @param {Array} templates - Array of templates
   */
  renderTemplatesList(templates) {
    const list = document.getElementById('smsTemplatesList');
    if (!list) return;
    
    if (templates.length === 0) {
      list.innerHTML = '<p class="sms-empty-state">No templates created yet. Click "Create Template" to get started.</p>';
      return;
    }
    
    list.innerHTML = templates.map(template => `
      <div class="sms-template-item">
        <div class="sms-template-header">
          <h5>${this.escapeHtml(template.name)}</h5>
          <div class="sms-template-actions">
            <button class="btn btn-secondary btn-sm" onclick="smsUIInstance.editTemplate('${template.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="smsUIInstance.deleteTemplate('${template.id}')">Delete</button>
          </div>
        </div>
        <div class="sms-template-content">
          <pre>${this.escapeHtml(template.content)}</pre>
        </div>
        <div class="sms-template-variables">
          <small>Variables: ${template.variables ? template.variables.join(', ') : 'None'}</small>
        </div>
      </div>
    `).join('');
  }

  /**
   * Show create template modal
   */
  showCreateTemplateModal() {
    const name = prompt('Template name:');
    if (!name) return;
    
    const content = prompt('Template content (use {{variableName}} for variables):');
    if (!content) return;
    
    this.createTemplate(name, content);
  }

  /**
   * Create template
   * @param {string} name - Template name
   * @param {string} content - Template content
   */
  async createTemplate(name, content) {
    if (typeof smsService === 'undefined') return;
    
    try {
      await smsService.createTemplate(name, content);
      await this.loadTemplates();
      alert('Template created successfully');
    } catch (error) {
      alert('Error creating template: ' + error.message);
    }
  }

  /**
   * Edit template
   * @param {string} templateId - Template ID
   */
  editTemplate(templateId) {
    if (typeof smsService === 'undefined') return;
    
    const template = smsService.getTemplate(templateId);
    if (!template) return;
    
    const newName = prompt('Template name:', template.name);
    if (!newName) return;
    
    const newContent = prompt('Template content:', template.content);
    if (newContent === null) return;
    
    // Update template (would need update method in service)
    alert('Template editing not yet implemented');
  }

  /**
   * Delete template
   * @param {string} templateId - Template ID
   */
  async deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    // Would need delete method in service
    alert('Template deletion not yet implemented');
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
  module.exports = { SMSUI };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SMSUI = SMSUI;
}
