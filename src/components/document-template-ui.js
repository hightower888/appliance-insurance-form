/**
 * Document Template UI Component
 * Interface for managing document templates, versions, and generating documents
 */

class DocumentTemplateUI {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onGenerate: null,
      onSave: null,
      ...options
    };
    this.isRendered = false;
    this.currentTemplate = null;
  }

  /**
   * Render document template UI
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="document-template-ui">
        <div class="document-template-header">
          <h3>📄 Document Templates</h3>
          <p class="document-template-description">Create and manage document templates for PDF generation.</p>
        </div>
        
        <div class="document-template-layout">
          <div class="document-template-sidebar">
            <div class="document-template-sidebar-header">
              <h4>Templates</h4>
              <button class="btn btn-primary btn-sm" id="docCreateTemplateBtn">+ New Template</button>
            </div>
            <div class="document-template-list" id="docTemplateList">
              <!-- Templates will be populated here -->
            </div>
          </div>
          
          <div class="document-template-editor">
            <div id="docTemplateEditor" style="display: none;">
              <div class="document-template-editor-header">
                <h4 id="docTemplateEditorTitle">Edit Template</h4>
                <div class="document-template-editor-actions">
                  <button class="btn btn-secondary btn-sm" id="docSaveTemplateBtn">Save</button>
                  <button class="btn btn-secondary btn-sm" id="docCreateVersionBtn">New Version</button>
                  <button class="btn btn-secondary btn-sm" id="docPreviewBtn">Preview</button>
                  <button class="btn btn-secondary btn-sm" id="docGenerateBtn">Generate PDF</button>
                </div>
              </div>
              
              <div class="document-template-editor-content">
                <div class="form-group">
                  <label for="docTemplateName">Template Name</label>
                  <input type="text" id="docTemplateName" class="form-input">
                </div>
                <div class="form-group">
                  <label for="docTemplateType">Template Type</label>
                  <select id="docTemplateType" class="form-select">
                    <option value="general">General</option>
                    <option value="invoice">Invoice</option>
                    <option value="contract">Contract</option>
                    <option value="receipt">Receipt</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="docTemplateContent">Template Content (HTML)</label>
                  <textarea id="docTemplateContent" class="form-textarea" rows="15" placeholder="Enter HTML template content. Use {{variableName}} for dynamic content."></textarea>
                  <small class="form-hint">Use {{variableName}} for variables. Example: {{customerName}}, {{planNumber}}, {{totalCost}}.</small>
                </div>
                <div class="form-group">
                  <label>Versions</label>
                  <div id="docVersionList" class="document-version-list">
                    <!-- Versions will be populated here -->
                  </div>
                </div>
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="docTemplateActive"> Active Template
                  </label>
                </div>
              </div>
            </div>
            
            <div id="docTemplateEmpty" class="document-template-empty">
              <p>Select a template to edit or create a new one.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
    this.loadTemplates();
    this.isRendered = true;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Create template button
    const createBtn = document.getElementById('docCreateTemplateBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.createNewTemplate());
    }

    // Save template button
    const saveBtn = document.getElementById('docSaveTemplateBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveTemplate());
    }

    // Create version button
    const versionBtn = document.getElementById('docCreateVersionBtn');
    if (versionBtn) {
      versionBtn.addEventListener('click', () => this.createVersion());
    }

    // Preview button
    const previewBtn = document.getElementById('docPreviewBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.previewTemplate());
    }

    // Generate PDF button
    const generateBtn = document.getElementById('docGenerateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateDocument());
    }
  }

  /**
   * Load templates
   */
  async loadTemplates() {
    if (typeof documentService === 'undefined') return;
    
    try {
      const templates = documentService.getTemplates();
      this.renderTemplateList(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  /**
   * Render template list
   * @param {Array} templates - Array of templates
   */
  renderTemplateList(templates) {
    const list = document.getElementById('docTemplateList');
    if (!list) return;
    
    if (templates.length === 0) {
      list.innerHTML = '<p class="document-template-empty-state">No templates. Click "New Template" to create one.</p>';
      return;
    }
    
    list.innerHTML = templates.map(template => `
      <div class="document-template-item ${template.active ? 'active' : ''}" data-template-id="${template.id}">
        <div class="document-template-item-header">
          <h5>${this.escapeHtml(template.name)}</h5>
          <span class="document-template-badge">${template.type}</span>
        </div>
        <div class="document-template-item-info">
          <small>Version ${template.activeVersion} • ${template.active ? 'Active' : 'Inactive'}</small>
        </div>
        <button class="btn btn-link btn-sm" onclick="documentTemplateUIInstance.editTemplate('${template.id}')">Edit</button>
      </div>
    `).join('');
    
    // Add click listeners
    list.querySelectorAll('.document-template-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.matches('button')) {
          const templateId = item.getAttribute('data-template-id');
          this.editTemplate(templateId);
        }
      });
    });
  }

  /**
   * Create new template
   */
  createNewTemplate() {
    this.currentTemplate = null;
    document.getElementById('docTemplateName').value = '';
    document.getElementById('docTemplateType').value = 'general';
    document.getElementById('docTemplateContent').value = '';
    document.getElementById('docTemplateActive').checked = true;
    document.getElementById('docVersionList').innerHTML = '';
    document.getElementById('docTemplateEditorTitle').textContent = 'New Template';
    document.getElementById('docTemplateEditor').style.display = 'block';
    document.getElementById('docTemplateEmpty').style.display = 'none';
  }

  /**
   * Edit template
   * @param {string} templateId - Template ID
   */
  async editTemplate(templateId) {
    if (typeof documentService === 'undefined') return;
    
    try {
      const template = documentService.getTemplate(templateId);
      if (!template) {
        alert('Template not found');
        return;
      }
      
      this.currentTemplate = template;
      
      // Load template data
      document.getElementById('docTemplateName').value = template.name;
      document.getElementById('docTemplateType').value = template.type || 'general';
      document.getElementById('docTemplateActive').checked = template.active;
      
      // Load active version content
      const version = documentService.getTemplateVersion(templateId);
      if (version) {
        document.getElementById('docTemplateContent').value = version.content;
      }
      
      // Load versions list
      this.renderVersionsList(template);
      
      // Show editor
      document.getElementById('docTemplateEditorTitle').textContent = `Edit: ${template.name}`;
      document.getElementById('docTemplateEditor').style.display = 'block';
      document.getElementById('docTemplateEmpty').style.display = 'none';
    } catch (error) {
      alert('Error loading template: ' + error.message);
    }
  }

  /**
   * Render versions list
   * @param {Object} template - Template object
   */
  renderVersionsList(template) {
    const list = document.getElementById('docVersionList');
    if (!list || !template.versions) return;
    
    const versions = Object.keys(template.versions)
      .map(v => ({ version: parseInt(v), ...template.versions[v] }))
      .sort((a, b) => b.version - a.version);
    
    list.innerHTML = versions.map(v => `
      <div class="document-version-item ${v.active ? 'active' : ''}">
        <div class="document-version-info">
          <strong>Version ${v.version}</strong>
          <small>${v.active ? 'Active' : 'Inactive'} • ${v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''}</small>
        </div>
        ${!v.active ? `<button class="btn btn-link btn-sm" onclick="documentTemplateUIInstance.setActiveVersion(${v.version})">Set Active</button>` : ''}
      </div>
    `).join('');
  }

  /**
   * Save template
   */
  async saveTemplate() {
    const name = document.getElementById('docTemplateName').value.trim();
    const type = document.getElementById('docTemplateType').value;
    const content = document.getElementById('docTemplateContent').value.trim();
    const active = document.getElementById('docTemplateActive').checked;
    
    if (!name || !content) {
      alert('Please enter template name and content');
      return;
    }
    
    if (typeof documentService === 'undefined') {
      alert('Document service not available');
      return;
    }
    
    try {
      if (this.currentTemplate) {
        // Update existing template - create new version
        await documentService.createTemplateVersion(this.currentTemplate.id, content);
        if (active !== this.currentTemplate.active) {
          await documentService.setTemplateActive(this.currentTemplate.id, active);
        }
        alert('Template updated successfully');
      } else {
        // Create new template
        await documentService.createTemplate(name, content, type);
        alert('Template created successfully');
      }
      
      await this.loadTemplates();
      if (this.currentTemplate) {
        await this.editTemplate(this.currentTemplate.id);
      }
    } catch (error) {
      alert('Error saving template: ' + error.message);
    }
  }

  /**
   * Create new version
   */
  async createVersion() {
    if (!this.currentTemplate) {
      alert('Please select a template first');
      return;
    }
    
    const content = document.getElementById('docTemplateContent').value.trim();
    if (!content) {
      alert('Please enter template content');
      return;
    }
    
    if (typeof documentService === 'undefined') return;
    
    try {
      const newVersion = await documentService.createTemplateVersion(this.currentTemplate.id, content);
      alert(`New version ${newVersion} created`);
      await this.editTemplate(this.currentTemplate.id);
    } catch (error) {
      alert('Error creating version: ' + error.message);
    }
  }

  /**
   * Set active version
   * @param {number} version - Version number
   */
  async setActiveVersion(version) {
    if (!this.currentTemplate || typeof documentService === 'undefined') return;
    
    try {
      await documentService.setActiveTemplate(this.currentTemplate.id, version);
      alert(`Version ${version} set as active`);
      await this.editTemplate(this.currentTemplate.id);
    } catch (error) {
      alert('Error setting active version: ' + error.message);
    }
  }

  /**
   * Preview template
   */
  previewTemplate() {
    const content = document.getElementById('docTemplateContent').value;
    if (!content) {
      alert('Please enter template content');
      return;
    }
    
    // Create preview window
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
      <html>
        <head>
          <title>Template Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
          </style>
        </head>
        <body>
          ${content.replace(/\{\{(\w+)\}\}/g, '<strong>[$1]</strong>')}
        </body>
      </html>
    `);
  }

  /**
   * Generate document
   */
  async generateDocument() {
    if (!this.currentTemplate) {
      alert('Please select a template first');
      return;
    }
    
    // Get sample data (in production, this would come from a form or selected sale)
    const sampleData = {
      customerName: 'John Doe',
      planNumber: 'NDAC1234APP',
      totalCost: '£45.98',
      date: new Date().toLocaleDateString()
    };
    
    if (this.options.onGenerate) {
      await this.options.onGenerate(this.currentTemplate.id, sampleData);
    } else if (typeof documentService !== 'undefined') {
      try {
        const result = await documentService.generateDocument(this.currentTemplate.id, sampleData, 'pdf');
        
        // Download PDF
        if (result.content && typeof pdfGenerator !== 'undefined') {
          pdfGenerator.downloadPDF(result.content, `${this.currentTemplate.name}_${Date.now()}.pdf`);
        } else {
          alert('PDF generation not available. Please include jsPDF library.');
        }
      } catch (error) {
        alert('Error generating document: ' + error.message);
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
  module.exports = { DocumentTemplateUI };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DocumentTemplateUI = DocumentTemplateUI;
}
