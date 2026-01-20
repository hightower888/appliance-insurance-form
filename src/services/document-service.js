/**
 * Document Service
 * Template management, versioning, and document generation
 */

class DocumentService {
  constructor() {
    this.database = null;
    this.storage = null;
    this.templates = new Map();
    this.pdfGenerator = null;
  }

  /**
   * Initialize service with database and storage references
   * @param {Object} config - Configuration object
   * @param {Object} config.database - Firebase database reference
   * @param {Object} config.storage - Firebase storage reference (optional)
   * @param {Object} config.pdfGenerator - PDF generator instance (optional)
   */
  initialize(config) {
    this.database = config.database || null;
    this.storage = config.storage || null;
    this.pdfGenerator = config.pdfGenerator || null;
    
    // Load templates from database if available
    if (this.database) {
      this.loadTemplates();
    }
    
    console.log('Document Service initialized');
  }

  /**
   * Load templates from database
   */
  async loadTemplates() {
    if (!this.database) return;
    
    try {
      const templatesRef = this.database.ref('documentTemplates');
      const snapshot = await templatesRef.once('value');
      const templates = snapshot.val() || {};
      
      this.templates.clear();
      Object.keys(templates).forEach(id => {
        this.templates.set(id, templates[id]);
      });
    } catch (error) {
      console.error('Error loading document templates:', error);
    }
  }

  /**
   * Create document template
   * @param {string} name - Template name
   * @param {string} content - HTML template content
   * @param {string} type - Template type (e.g., 'invoice', 'contract', 'receipt')
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} Template ID
   */
  async createTemplate(name, content, type = 'general', metadata = {}) {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const version = 1;
    
    const template = {
      id: templateId,
      name,
      content,
      type,
      version,
      versions: {
        [version]: {
          content,
          createdAt: new Date().toISOString(),
          createdBy: metadata.createdBy || null,
          active: true
        }
      },
      activeVersion: version,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...metadata
    };
    
    this.templates.set(templateId, template);
    
    // Save to database if available
    if (this.database) {
      try {
        const templatesRef = this.database.ref(`documentTemplates/${templateId}`);
        await templatesRef.set(template);
      } catch (error) {
        console.error('Error saving template to database:', error);
      }
    }
    
    return templateId;
  }

  /**
   * Get all templates
   * @param {string} type - Filter by type (optional)
   * @param {boolean} activeOnly - Return only active templates (optional)
   * @returns {Array} Array of template objects
   */
  getTemplates(type = null, activeOnly = false) {
    let templates = Array.from(this.templates.values());
    
    if (type) {
      templates = templates.filter(t => t.type === type);
    }
    
    if (activeOnly) {
      templates = templates.filter(t => t.active);
    }
    
    return templates;
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Object|null} Template object or null
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get template version
   * @param {string} templateId - Template ID
   * @param {number} version - Version number (optional, defaults to active version)
   * @returns {Object|null} Version object or null
   */
  getTemplateVersion(templateId, version = null) {
    const template = this.getTemplate(templateId);
    if (!template) return null;
    
    const versionNum = version || template.activeVersion;
    return template.versions[versionNum] || null;
  }

  /**
   * Create new template version
   * @param {string} templateId - Template ID
   * @param {string} content - New template content
   * @param {Object} metadata - Version metadata
   * @returns {Promise<number>} New version number
   */
  async createTemplateVersion(templateId, content, metadata = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const newVersion = Math.max(...Object.keys(template.versions).map(v => parseInt(v))) + 1;
    
    template.versions[newVersion] = {
      content,
      createdAt: new Date().toISOString(),
      createdBy: metadata.createdBy || null,
      active: false
    };
    
    template.updatedAt = new Date().toISOString();
    
    // Save to database
    if (this.database) {
      try {
        const templatesRef = this.database.ref(`documentTemplates/${templateId}`);
        await templatesRef.update(template);
      } catch (error) {
        console.error('Error saving template version:', error);
      }
    }
    
    return newVersion;
  }

  /**
   * Set active template version
   * @param {string} templateId - Template ID
   * @param {number} version - Version number
   * @returns {Promise<void>}
   */
  async setActiveTemplate(templateId, version) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    if (!template.versions[version]) {
      throw new Error(`Template version not found: ${version}`);
    }
    
    // Deactivate all versions
    Object.keys(template.versions).forEach(v => {
      template.versions[v].active = false;
    });
    
    // Activate specified version
    template.versions[version].active = true;
    template.activeVersion = version;
    
    // Save to database
    if (this.database) {
      try {
        const templatesRef = this.database.ref(`documentTemplates/${templateId}`);
        await templatesRef.update(template);
      } catch (error) {
        console.error('Error updating active template:', error);
      }
    }
  }

  /**
   * Set template active status
   * @param {string} templateId - Template ID
   * @param {boolean} active - Active status
   * @returns {Promise<void>}
   */
  async setTemplateActive(templateId, active) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    template.active = active;
    template.updatedAt = new Date().toISOString();
    
    // Save to database
    if (this.database) {
      try {
        const templatesRef = this.database.ref(`documentTemplates/${templateId}`);
        await templatesRef.update({ active, updatedAt: template.updatedAt });
      } catch (error) {
        console.error('Error updating template active status:', error);
      }
    }
  }

  /**
   * Generate document from template
   * @param {string} templateId - Template ID
   * @param {Object} data - Data to populate template
   * @param {string} format - Output format ('pdf', 'html') (default: 'pdf')
   * @returns {Promise<Object>} Generated document result
   */
  async generateDocument(templateId, data, format = 'pdf') {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const version = this.getTemplateVersion(templateId);
    if (!version) {
      throw new Error(`Template version not found`);
    }
    
    // Render template with data
    const renderedContent = this.renderTemplate(version.content, data);
    
    // Generate document based on format
    if (format === 'pdf') {
      if (!this.pdfGenerator) {
        throw new Error('PDF generator not initialized');
      }
      
      const pdfBlob = await this.pdfGenerator.generateFromHTML(renderedContent);
      
      return {
        format: 'pdf',
        content: pdfBlob,
        templateId,
        templateName: template.name,
        generatedAt: new Date().toISOString()
      };
    } else if (format === 'html') {
      return {
        format: 'html',
        content: renderedContent,
        templateId,
        templateName: template.name,
        generatedAt: new Date().toISOString()
      };
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Render template with data
   * @param {string} template - Template content
   * @param {Object} data - Data object
   * @returns {string} Rendered HTML
   */
  renderTemplate(template, data) {
    let rendered = template;
    
    // Replace {{variable}} placeholders
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const value = data[key] !== null && data[key] !== undefined ? String(data[key]) : '';
      rendered = rendered.replace(regex, value);
    });
    
    // Replace nested object properties {{object.property}}
    const nestedRegex = /\{\{(\w+)\.(\w+)\}\}/g;
    rendered = rendered.replace(nestedRegex, (match, objKey, propKey) => {
      if (data[objKey] && data[objKey][propKey] !== undefined) {
        return String(data[objKey][propKey]);
      }
      return '';
    });
    
    return rendered;
  }

  /**
   * Store generated document
   * @param {string} documentId - Document ID
   * @param {Blob|File} file - Document file
   * @param {Object} metadata - Document metadata
   * @returns {Promise<string>} Storage path/URL
   */
  async storeDocument(documentId, file, metadata = {}) {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }
    
    // In production, this would upload to Firebase Storage
    // For now, return a mock path
    const path = `documents/${documentId}_${Date.now()}.pdf`;
    
    // Log document generation
    if (this.database) {
      try {
        const documentsRef = this.database.ref(`generatedDocuments/${documentId}`);
        await documentsRef.set({
          id: documentId,
          path,
          templateId: metadata.templateId,
          templateName: metadata.templateName,
          format: metadata.format || 'pdf',
          createdAt: new Date().toISOString(),
          ...metadata
        });
      } catch (error) {
        console.error('Error logging document:', error);
      }
    }
    
    return path;
  }

  /**
   * Track document download
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async trackDownload(documentId, userId) {
    if (!this.database) return;
    
    try {
      const documentRef = this.database.ref(`generatedDocuments/${documentId}`);
      const snapshot = await documentRef.once('value');
      const document = snapshot.val();
      
      if (document) {
        const downloads = document.downloads || [];
        downloads.push({
          userId,
          downloadedAt: new Date().toISOString()
        });
        
        await documentRef.update({
          downloads,
          downloadCount: downloads.length,
          lastDownloadedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error tracking document download:', error);
    }
  }
}

// Create singleton instance
const documentService = new DocumentService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DocumentService, documentService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.documentService = documentService;
  window.DocumentService = DocumentService;
}
