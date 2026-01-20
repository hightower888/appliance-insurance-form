/**
 * Validation Service
 * Comprehensive field validation with real-time feedback
 */

class ValidationService {
  constructor() {
    this.rules = {
      // Contact fields
      'contact.name': {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z\s'-]+$/,
        message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes'
      },
      'contact.email': {
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      },
      'contact.phone': {
        required: false,
        pattern: /^[\d\s\-\+\(\)]+$/,
        minLength: 10,
        maxLength: 20,
        message: 'Please enter a valid phone number'
      },
      'contact.postcode': {
        required: false,
        pattern: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
        message: 'Please enter a valid UK postcode'
      },
      
      // Plan fields
      'plan.type': {
        required: false,
        enum: ['basic', 'standard', 'premium'],
        message: 'Plan type must be basic, standard, or premium'
      },
      'plan.monthlyCost': {
        required: false,
        type: 'number',
        min: 0,
        max: 1000,
        message: 'Monthly cost must be between 0 and 1000'
      },
      
      // Payment fields
      'payment.method': {
        required: false,
        enum: ['monthly', 'annual', 'one-time'],
        message: 'Payment method must be monthly, annual, or one-time'
      },
      
      // Lead fields
      'leadStatus': {
        required: false,
        enum: ['new', 'contacted', 'dispositioned', 'converted'],
        message: 'Lead status must be new, contacted, dispositioned, or converted'
      },
      'disposition': {
        required: false,
        enum: ['interested', 'not_interested', 'call_back', 'no_answer', 'other'],
        message: 'Disposition must be one of the valid options'
      },
      'leadSource': {
        required: false,
        maxLength: 100,
        message: 'Lead source must be 100 characters or less'
      },
      
      // Notes
      'notes': {
        required: false,
        maxLength: 5000,
        message: 'Notes must be 5000 characters or less'
      }
    };
  }

  /**
   * Validate a field value
   * @param {string} fieldPath - Field path (e.g., 'contact.name')
   * @param {*} value - Value to validate
   * @returns {Object} Validation result { valid: boolean, message: string }
   */
  validate(fieldPath, value) {
    const rule = this.rules[fieldPath];
    
    if (!rule) {
      // No rule defined, assume valid
      return { valid: true, message: null };
    }

    // Check required
    if (rule.required && (value === null || value === undefined || value === '')) {
      return {
        valid: false,
        message: rule.message || `${fieldPath} is required`
      };
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return { valid: true, message: null };
    }

    // Type validation
    if (rule.type) {
      const actualType = typeof value;
      if (rule.type === 'number' && (actualType !== 'number' || isNaN(value))) {
        return {
          valid: false,
          message: rule.message || `${fieldPath} must be a number`
        };
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return {
        valid: false,
        message: rule.message || `${fieldPath} must be one of: ${rule.enum.join(', ')}`
      };
    }

    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return {
          valid: false,
          message: rule.message || `${fieldPath} must be at least ${rule.minLength} characters`
        };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return {
          valid: false,
          message: rule.message || `${fieldPath} must be no more than ${rule.maxLength} characters`
        };
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        return {
          valid: false,
          message: rule.message || `${fieldPath} format is invalid`
        };
      }
    }

    // Number range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return {
          valid: false,
          message: rule.message || `${fieldPath} must be at least ${rule.min}`
        };
      }
      if (rule.max !== undefined && value > rule.max) {
        return {
          valid: false,
          message: rule.message || `${fieldPath} must be no more than ${rule.max}`
        };
      }
    }

    return { valid: true, message: null };
  }

  /**
   * Validate multiple fields
   * @param {Object} fields - Object with field paths as keys and values
   * @returns {Object} Validation result { valid: boolean, errors: Object }
   */
  validateFields(fields) {
    const errors = {};
    let allValid = true;

    for (const [fieldPath, value] of Object.entries(fields)) {
      const result = this.validate(fieldPath, value);
      if (!result.valid) {
        errors[fieldPath] = result.message;
        allValid = false;
      }
    }

    return {
      valid: allValid,
      errors: errors
    };
  }

  /**
   * Validate an entire record
   * @param {Object} record - Record object to validate
   * @returns {Object} Validation result { valid: boolean, errors: Object }
   */
  validateRecord(record) {
    const fields = this.flattenObject(record);
    return this.validateFields(fields);
  }

  /**
   * Flatten nested object to dot-notation paths
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Prefix for paths
   * @returns {Object} Flattened object
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};

    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this.flattenObject(value, path));
      } else {
        flattened[path] = value;
      }
    }

    return flattened;
  }

  /**
   * Add custom validation rule
   * @param {string} fieldPath - Field path
   * @param {Object} rule - Validation rule
   */
  addRule(fieldPath, rule) {
    this.rules[fieldPath] = { ...this.rules[fieldPath], ...rule };
  }

  /**
   * Remove validation rule
   * @param {string} fieldPath - Field path
   */
  removeRule(fieldPath) {
    delete this.rules[fieldPath];
  }

  /**
   * Get validation rule for a field
   * @param {string} fieldPath - Field path
   * @returns {Object|null} Validation rule or null
   */
  getRule(fieldPath) {
    return this.rules[fieldPath] || null;
  }

  /**
   * Get all validation rules
   * @returns {Object} All validation rules
   */
  getAllRules() {
    return { ...this.rules };
  }
}

// Create singleton instance
const validationService = new ValidationService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ValidationService, validationService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.validationService = validationService;
  window.ValidationService = ValidationService;
}
