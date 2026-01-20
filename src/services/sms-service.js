/**
 * SMS Service
 * Bulk SMS messaging with templates and delivery tracking
 * 
 * Note: This service requires an external SMS provider (Twilio, etc.)
 * Configure API credentials in your environment or Firebase config
 */

class SMSService {
  constructor() {
    this.apiKey = null;
    this.apiSecret = null;
    this.provider = 'twilio'; // Default provider
    this.accountSid = null;
    this.fromNumber = null;
    this.database = null;
    this.templates = new Map();
  }

  /**
   * Initialize service with API credentials
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - API key (or account SID for Twilio)
   * @param {string} config.apiSecret - API secret (or auth token for Twilio)
   * @param {string} config.provider - Provider name ('twilio', etc.)
   * @param {string} config.fromNumber - Sender phone number
   * @param {Object} config.database - Firebase database reference (optional)
   */
  initialize(config) {
    this.apiKey = config.apiKey || config.accountSid;
    this.apiSecret = config.apiSecret || config.authToken;
    this.provider = config.provider || 'twilio';
    this.fromNumber = config.fromNumber;
    this.database = config.database || null;
    
    // Load templates from database if available
    if (this.database) {
      this.loadTemplates();
    }
    
    console.log('SMS Service initialized with provider:', this.provider);
  }

  /**
   * Load templates from database
   */
  async loadTemplates() {
    if (!this.database) return;
    
    try {
      const templatesRef = this.database.ref('smsTemplates');
      const snapshot = await templatesRef.once('value');
      const templates = snapshot.val() || {};
      
      this.templates.clear();
      Object.keys(templates).forEach(id => {
        this.templates.set(id, templates[id]);
      });
    } catch (error) {
      console.error('Error loading SMS templates:', error);
    }
  }

  /**
   * Send SMS message
   * @param {string} phone - Phone number (E.164 format recommended)
   * @param {string} message - Message text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Send result with messageId and status
   */
  async sendSMS(phone, message, options = {}) {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('SMS service not initialized. Call initialize() first.');
    }

    // Normalize phone number
    const normalizedPhone = this.normalizePhone(phone);
    if (!normalizedPhone) {
      throw new Error('Invalid phone number');
    }

    try {
      // For Twilio provider
      if (this.provider === 'twilio') {
        return await this.sendViaTwilio(normalizedPhone, message, options);
      }
      
      // Add other providers here
      throw new Error(`Unsupported SMS provider: ${this.provider}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send SMS via Twilio API
   * @param {string} phone - Phone number
   * @param {string} message - Message text
   * @param {Object} options - Options
   * @returns {Promise<Object>} Send result
   */
  async sendViaTwilio(phone, message, options = {}) {
    // Note: Twilio requires server-side API calls for security
    // This is a client-side stub - actual implementation should use a backend API
    // or Firebase Cloud Functions
    
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log SMS attempt
    if (this.database) {
      await this.logSMS(null, phone, message, 'SENDING', messageId, options.saleId);
    }
    
    // In production, this would call a backend API or Cloud Function
    // For now, return a mock response
    return {
      success: true,
      messageId,
      status: 'SENT',
      phone,
      message,
      provider: 'twilio'
    };
  }

  /**
   * Send bulk SMS messages
   * @param {Array} recipients - Array of {phone, saleId?, variables?} objects
   * @param {string|Function} message - Message text or function that returns message
   * @param {Object} options - Additional options
   * @param {Function} options.onProgress - Progress callback (current, total, recipient)
   * @returns {Promise<Object>} Bulk send result
   */
  async sendBulkSMS(recipients, message, options = {}) {
    const results = {
      success: [],
      failed: [],
      total: recipients.length
    };

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // Get message text (support function for dynamic messages)
        let messageText = typeof message === 'function' 
          ? message(recipient) 
          : message;
        
        // Replace template variables if provided
        if (recipient.variables) {
          messageText = this.replaceVariables(messageText, recipient.variables);
        }
        
        const result = await this.sendSMS(recipient.phone, messageText, {
          ...options,
          saleId: recipient.saleId
        });
        
        results.success.push({
          recipient,
          result
        });
      } catch (error) {
        results.failed.push({
          recipient,
          error: error.message
        });
      }
      
      // Report progress
      if (options.onProgress) {
        options.onProgress(i + 1, recipients.length, recipient);
      }
    }

    return results;
  }

  /**
   * Create SMS template
   * @param {string} name - Template name
   * @param {string} content - Template content (with {{variable}} placeholders)
   * @param {Object} metadata - Template metadata
   * @returns {Promise<string>} Template ID
   */
  async createTemplate(name, content, metadata = {}) {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const template = {
      id: templateId,
      name,
      content,
      variables: this.extractVariables(content),
      createdAt: new Date().toISOString(),
      ...metadata
    };
    
    this.templates.set(templateId, template);
    
    // Save to database if available
    if (this.database) {
      try {
        const templatesRef = this.database.ref(`smsTemplates/${templateId}`);
        await templatesRef.set(template);
      } catch (error) {
        console.error('Error saving template to database:', error);
      }
    }
    
    return templateId;
  }

  /**
   * Get all templates
   * @returns {Array} Array of template objects
   */
  getTemplates() {
    return Array.from(this.templates.values());
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
   * Send SMS using template
   * @param {string} phone - Phone number
   * @param {string} templateId - Template ID
   * @param {Object} variables - Template variables
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Send result
   */
  async sendWithTemplate(phone, templateId, variables = {}, options = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const message = this.replaceVariables(template.content, variables);
    return await this.sendSMS(phone, message, options);
  }

  /**
   * Replace template variables in message
   * @param {string} message - Message with {{variable}} placeholders
   * @param {Object} variables - Variable values
   * @returns {string} Message with variables replaced
   */
  replaceVariables(message, variables) {
    let result = message;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    return result;
  }

  /**
   * Extract variable names from template
   * @param {string} content - Template content
   * @returns {Array} Array of variable names
   */
  extractVariables(content) {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  /**
   * Track SMS delivery status
   * @param {string} messageId - Message ID
   * @param {string} status - Status (NOT_SENT, SENDING, SENT, FAILED, SKIPPED)
   * @returns {Promise<void>}
   */
  async trackDelivery(messageId, status) {
    if (!this.database) return;
    
    try {
      const logsRef = this.database.ref(`smsLogs/${messageId}`);
      await logsRef.update({
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking SMS delivery:', error);
    }
  }

  /**
   * Get delivery status
   * @param {string} messageId - Message ID
   * @returns {Promise<string|null>} Status or null
   */
  async getDeliveryStatus(messageId) {
    if (!this.database) return null;
    
    try {
      const logRef = this.database.ref(`smsLogs/${messageId}`);
      const snapshot = await logRef.once('value');
      const log = snapshot.val();
      return log ? log.status : null;
    } catch (error) {
      console.error('Error getting delivery status:', error);
      return null;
    }
  }

  /**
   * Log SMS to database
   * @param {string} saleId - Sale ID (optional)
   * @param {string} phone - Phone number
   * @param {string} message - Message text
   * @param {string} status - Status
   * @param {string} messageId - Message ID
   * @param {string} saleId - Sale ID
   * @returns {Promise<void>}
   */
  async logSMS(saleId, phone, message, status, messageId, saleIdParam) {
    if (!this.database) return;
    
    try {
      const logId = messageId || `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const logsRef = this.database.ref(`smsLogs/${logId}`);
      
      await logsRef.set({
        saleId: saleId || saleIdParam,
        phone,
        message,
        status,
        messageId: logId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging SMS:', error);
    }
  }

  /**
   * Normalize phone number
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone number
   */
  normalizePhone(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (assume UK +44)
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      cleaned = '44' + cleaned.substring(1);
    }
    
    // Add + prefix for E.164 format
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
}

// Create singleton instance
const smsService = new SMSService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SMSService, smsService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.smsService = smsService;
  window.SMSService = SMSService;
}
