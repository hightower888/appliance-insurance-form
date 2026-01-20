/**
 * Dynamic Form Validator Service
 * Validates form fields based on database configuration
 */

const formValidator = {
  /**
   * Validate a single field based on its configuration
   * @param {HTMLElement} fieldElement - The input/select/textarea element
   * @param {Object} fieldConfig - Field configuration from database
   * @returns {Object} { isValid: boolean, error: string }
   */
  validateField(fieldElement, fieldConfig) {
    if (!fieldElement || !fieldConfig) {
      return { isValid: true, error: '' };
    }

    const value = this.getFieldValue(fieldElement);
    const errors = [];

    // Required validation
    if (fieldConfig.required && !this.hasValue(value)) {
      errors.push('This field is required');
    }

    // Type-specific validation
    if (this.hasValue(value)) {
      switch (fieldConfig.fieldType) {
        case 'email':
          if (!this.isValidEmail(value)) {
            errors.push('Please enter a valid email address');
          }
          break;
        case 'tel':
          if (!this.isValidPhone(value)) {
            errors.push('Please enter a valid phone number');
          }
          break;
        case 'number':
          if (isNaN(value) || value === '') {
            errors.push('Please enter a valid number');
          }
          break;
      }

      // Validation rules from configuration
      if (fieldConfig.validation) {
        const validation = fieldConfig.validation;

        // Min/Max length
        if (validation.minLength && value.length < validation.minLength) {
          errors.push(`Minimum length is ${validation.minLength} characters`);
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          errors.push(`Maximum length is ${validation.maxLength} characters`);
        }

        // Pattern validation
        if (validation.pattern) {
          try {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
              errors.push('Invalid format');
            }
          } catch (e) {
            console.warn('Invalid regex pattern:', validation.pattern);
          }
        }

        // Number range validation
        if (fieldConfig.fieldType === 'number') {
          const numValue = parseFloat(value);
          if (validation.min !== undefined && numValue < validation.min) {
            errors.push(`Minimum value is ${validation.min}`);
          }
          if (validation.max !== undefined && numValue > validation.max) {
            errors.push(`Maximum value is ${validation.max}`);
          }
        }
      }
    }

    const isValid = errors.length === 0;
    const error = errors.join('. ');

    // Update error display
    this.showFieldError(fieldElement, error);

    return { isValid, error };
  },

  /**
   * Validate all dynamic fields in the form
   * @returns {Object} { isValid: boolean, errors: Array }
   */
  async validateAllFields() {
    const errors = [];
    let isValid = true;

    try {
      // Load field configurations from database
      if (typeof database === 'undefined') {
        return { isValid: false, errors: ['Database not initialized'] };
      }

      const fieldsRef = database.ref('form_fields');
      const snapshot = await fieldsRef.once('value');

      if (!snapshot.exists()) {
        return { isValid: true, errors: [] };
      }

      snapshot.forEach((childSnapshot) => {
        const fieldConfig = {
          fieldId: childSnapshot.key,
          ...childSnapshot.val()
        };

        const fieldElement = document.querySelector(`[name="${fieldConfig.fieldName}"]`);
        if (fieldElement) {
          const validation = this.validateField(fieldElement, fieldConfig);
          if (!validation.isValid) {
            isValid = false;
            errors.push({
              fieldName: fieldConfig.fieldName,
              fieldLabel: fieldConfig.fieldLabel,
              error: validation.error
            });
          }
        }
      });
    } catch (error) {
      console.error('Error validating fields:', error);
      return { isValid: false, errors: [error.message] };
    }

    return { isValid, errors };
  },

  /**
   * Get field value based on input type
   */
  getFieldValue(fieldElement) {
    if (!fieldElement) return '';

    if (fieldElement.type === 'checkbox') {
      return fieldElement.checked;
    } else if (fieldElement.type === 'radio') {
      const checked = document.querySelector(`[name="${fieldElement.name}"]:checked`);
      return checked ? checked.value : '';
    } else {
      return fieldElement.value || '';
    }
  },

  /**
   * Check if value exists
   */
  hasValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'boolean') return value;
    return true;
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone format (basic)
   */
  isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  /**
   * Show field error
   */
  showFieldError(fieldElement, error) {
    const errorSpan = document.getElementById(`${fieldElement.name}-error`);
    if (errorSpan) {
      if (error) {
        errorSpan.textContent = error;
        errorSpan.style.display = 'block';
        fieldElement.classList.add('error');
      } else {
        errorSpan.textContent = '';
        errorSpan.style.display = 'none';
        fieldElement.classList.remove('error');
      }
    }
  },

  /**
   * Clear all field errors
   */
  clearAllErrors() {
    const errorSpans = document.querySelectorAll('[data-field-id] .error-message');
    errorSpans.forEach(span => {
      span.textContent = '';
      span.style.display = 'none';
    });

    const errorFields = document.querySelectorAll('[data-field-id] input.error, [data-field-id] select.error, [data-field-id] textarea.error');
    errorFields.forEach(field => {
      field.classList.remove('error');
    });
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = formValidator;
}
