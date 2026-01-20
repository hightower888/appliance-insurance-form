/**
 * Dynamic Form Renderer Service
 * Renders form fields dynamically from database configuration
 */

// Note: Firebase should be initialized in the HTML file before this script loads
// This service assumes `database` is available globally

const formRenderer = {
  /**
   * Load and render all form fields from database
   * @param {HTMLElement} container - Container element to render fields into
   * @param {Object} options - Rendering options (sections, excludeFields, etc.)
   */
  async renderForm(container, options = {}) {
    try {
      // Check if Firebase Auth user exists
      let authUser = firebase.auth().currentUser;
      if (!authUser) {
        // Try to sign in anonymously as fallback (for cases where checkAuth wasn't called)
        if (typeof firebase !== 'undefined' && firebase.auth) {
          const auth = firebase.auth();
          try {
            await auth.signInAnonymously();
            authUser = firebase.auth().currentUser;
            console.log('Anonymous auth signed in as fallback');
          } catch (error) {
            console.warn('Could not sign in anonymously:', error);
          }
        }
      }
      
      if (!authUser) {
        console.warn('User not authenticated, cannot load form fields');
        return this.renderFallbackFields(container);
      }
      
      // Load fields from database
      const fieldsRef = database.ref('form_fields');
      const snapshot = await fieldsRef.once('value');
      
      if (!snapshot.exists()) {
        console.warn('No form fields found in database. Using fallback fields.');
        return this.renderFallbackFields(container);
      }

      const fields = [];
      snapshot.forEach((childSnapshot) => {
        const fieldData = childSnapshot.val();
        fields.push({
          fieldId: childSnapshot.key,
          ...fieldData
        });
      });

      // Sort by order
      fields.sort((a, b) => (a.order || 999) - (b.order || 999));

      // Group by section
      const fieldsBySection = this.groupFieldsBySection(fields);

      // Render sections
      this.renderSections(container, fieldsBySection, options);
      
      return fields;
    } catch (error) {
      console.error('Error rendering dynamic form:', error);
      return this.renderFallbackFields(container);
    }
  },

  /**
   * Group fields by section
   */
  groupFieldsBySection(fields) {
    const sections = {};
    fields.forEach(field => {
      const section = field.section || 'General';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(field);
    });
    return sections;
  },

  /**
   * Render sections with fields
   */
  renderSections(container, fieldsBySection, options) {
    const excludeSections = options.excludeSections || [];
    const excludeFields = options.excludeFields || [];

    Object.keys(fieldsBySection).forEach(sectionName => {
      if (excludeSections.includes(sectionName)) return;

      const sectionFields = fieldsBySection[sectionName].filter(
        f => !excludeFields.includes(f.fieldName)
      );

      if (sectionFields.length === 0) return;

      // Create section element
      const sectionEl = document.createElement('section');
      sectionEl.className = 'form-section';
      sectionEl.setAttribute('data-section', sectionName);

      // Section header
      const sectionHeader = document.createElement('h2');
      sectionHeader.textContent = sectionName;
      sectionEl.appendChild(sectionHeader);

      // Render fields in section
      sectionFields.forEach(field => {
        const fieldEl = this.renderField(field);
        if (fieldEl) {
          sectionEl.appendChild(fieldEl);
        }
      });

      container.appendChild(sectionEl);
    });
  },

  /**
   * Render a single field
   */
  renderField(field) {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'form-row';
    fieldWrapper.setAttribute('data-field-id', field.fieldId);

    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    // Label
    const label = document.createElement('label');
    label.setAttribute('for', field.fieldName);
    // Sanitize field label to prevent XSS
    const sanitizedLabel = typeof sanitizeHTML === 'function' ? sanitizeHTML(field.fieldLabel || field.fieldName) : (field.fieldLabel || field.fieldName);
    label.innerHTML = sanitizedLabel;
    if (field.required) {
      const requiredSpan = document.createElement('span');
      requiredSpan.className = 'required';
      requiredSpan.textContent = ' *';
      label.appendChild(requiredSpan);
    }
    formGroup.appendChild(label);

    // Input element based on type
    const input = this.createInputElement(field);
    if (input) {
      formGroup.appendChild(input);
    }

    // Error message span
    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.id = `${field.fieldName}-error`;
    formGroup.appendChild(errorSpan);

    // Help text
    if (field.helpText) {
      const helpP = document.createElement('p');
      helpP.className = 'field-note';
      helpP.textContent = field.helpText;
      formGroup.appendChild(helpP);
    }

    fieldWrapper.appendChild(formGroup);
    return fieldWrapper;
  },

  /**
   * Create input element based on field type
   */
  createInputElement(field) {
    let input;

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        input = document.createElement('input');
        input.type = field.fieldType;
        input.id = field.fieldName;
        input.name = field.fieldName;
        input.placeholder = field.placeholder || '';
        if (field.defaultValue) input.value = field.defaultValue;
        if (field.required) input.setAttribute('required', '');
        if (field.validation) {
          if (field.validation.minLength) input.minLength = field.validation.minLength;
          if (field.validation.maxLength) input.maxLength = field.validation.maxLength;
          if (field.validation.pattern) input.pattern = field.validation.pattern;
        }
        break;

      case 'textarea':
        input = document.createElement('textarea');
        input.id = field.fieldName;
        input.name = field.fieldName;
        input.placeholder = field.placeholder || '';
        input.rows = field.rows || 3;
        if (field.defaultValue) input.textContent = field.defaultValue;
        if (field.required) input.setAttribute('required', '');
        if (field.validation) {
          if (field.validation.minLength) input.minLength = field.validation.minLength;
          if (field.validation.maxLength) input.maxLength = field.validation.maxLength;
        }
        break;

      case 'select':
        input = document.createElement('select');
        input.id = field.fieldName;
        input.name = field.fieldName;
        if (field.required) input.setAttribute('required', '');
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = field.placeholder || 'Select an option';
        input.appendChild(defaultOption);

        // Add options from validation.options
        if (field.validation?.options) {
          field.validation.options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label || option.value;
            input.appendChild(optionEl);
          });
        }
        break;

      case 'radio':
        // Radio buttons need special handling - return container
        const radioContainer = document.createElement('div');
        radioContainer.className = 'radio-group';
        
        if (field.validation?.options) {
          field.validation.options.forEach((option, index) => {
            const radioWrapper = document.createElement('label');
            radioWrapper.className = 'radio-label';
            
            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = field.fieldName;
            radioInput.value = option.value;
            radioInput.id = `${field.fieldName}-${index}`;
            if (field.required && index === 0) radioInput.setAttribute('required', '');
            
            const radioContent = document.createElement('span');
            radioContent.className = 'radio-content';
            radioContent.textContent = option.label || option.value;
            
            radioWrapper.appendChild(radioInput);
            radioWrapper.appendChild(radioContent);
            radioContainer.appendChild(radioWrapper);
          });
        }
        return radioContainer;

      case 'checkbox':
        input = document.createElement('input');
        input.type = 'checkbox';
        input.id = field.fieldName;
        input.name = field.fieldName;
        if (field.defaultValue) input.checked = field.defaultValue === 'true' || field.defaultValue === true;
        break;

      default:
        console.warn(`Unknown field type: ${field.fieldType}`);
        return null;
    }

    // Set aria attributes
    if (input) {
      input.setAttribute('aria-required', field.required ? 'true' : 'false');
      if (field.helpText) {
        input.setAttribute('aria-describedby', `${field.fieldName}-help`);
      }
    }

    return input;
  },

  /**
   * Render fallback fields if database is unavailable
   */
  renderFallbackFields(container) {
    console.warn('Using fallback form fields');
    // This would render the original hardcoded fields
    // For now, we'll just log a warning
    return [];
  },

  /**
   * Get field value from form
   */
  getFieldValue(fieldName) {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) return null;

    if (input.type === 'checkbox') {
      return input.checked;
    } else if (input.type === 'radio') {
      const checked = document.querySelector(`[name="${fieldName}"]:checked`);
      return checked ? checked.value : null;
    } else {
      return input.value;
    }
  },

  /**
   * Get all field values from form
   */
  getAllFieldValues() {
    const values = {};
    const inputs = document.querySelectorAll('[data-field-id] input, [data-field-id] select, [data-field-id] textarea');
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        values[input.name] = input.checked;
      } else if (input.type === 'radio') {
        const checked = document.querySelector(`[name="${input.name}"]:checked`);
        if (checked) values[input.name] = checked.value;
      } else {
        values[input.name] = input.value;
      }
    });
    return values;
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = formRenderer;
}
