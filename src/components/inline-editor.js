/**
 * Inline Editor Component
 * Click-to-edit functionality for table cells and fields
 */

class InlineEditor {
  constructor(options = {}) {
    this.options = {
      saveOnBlur: true,
      saveOnEnter: true,
      cancelOnEscape: true,
      validateOnChange: true,
      showValidationErrors: true,
      ...options
    };

    this.currentEdit = null;
    this.originalValue = null;
  }

  /**
   * Make element editable
   * @param {HTMLElement} element - Element to make editable
   * @param {Object} config - Edit configuration
   */
  makeEditable(element, config = {}) {
    if (!element) return;

    const {
      fieldPath,
      value,
      type = 'text', // 'text', 'number', 'select', 'textarea'
      options = [], // For select type
      onSave = null,
      onCancel = null,
      validator = null
    } = config;

    // Store original value
    this.originalValue = value;
    this.currentEdit = {
      element,
      fieldPath,
      type,
      options,
      onSave,
      onCancel,
      validator,
      originalValue: value
    };

    // Create edit input
    const input = this.createInput(type, value, options);
    
    // Replace element content with input
    const parent = element.parentNode;
    const wrapper = document.createElement('span');
    wrapper.className = 'inline-editor-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';
    
    parent.replaceChild(wrapper, element);
    wrapper.appendChild(input);
    wrapper.appendChild(element);
    element.style.display = 'none';

    // Focus and select
    input.focus();
    if (type === 'text' || type === 'number') {
      input.select();
    }

    // Setup event listeners
    this.setupInputListeners(input, wrapper, element);
  }

  /**
   * Create input element based on type
   * @param {string} type - Input type
   * @param {*} value - Initial value
   * @param {Array} options - Options for select
   * @returns {HTMLElement} Input element
   */
  createInput(type, value, options = []) {
    let input;

    if (type === 'select') {
      input = document.createElement('select');
      input.className = 'inline-editor-input inline-editor-select';
      
      options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = typeof option === 'object' ? option.value : option;
        optionEl.textContent = typeof option === 'object' ? option.label : option;
        if (optionEl.value === value) {
          optionEl.selected = true;
        }
        input.appendChild(optionEl);
      });
    } else if (type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'inline-editor-input inline-editor-textarea';
      input.value = value || '';
      input.rows = 3;
    } else {
      input = document.createElement('input');
      input.type = type;
      input.className = 'inline-editor-input';
      input.value = value || '';
    }

    input.style.width = '100%';
    input.style.padding = '4px 8px';
    input.style.border = '2px solid var(--primary)';
    input.style.borderRadius = '4px';
    input.style.fontSize = '14px';
    input.style.fontFamily = 'inherit';

    return input;
  }

  /**
   * Setup input event listeners
   * @param {HTMLElement} input - Input element
   * @param {HTMLElement} wrapper - Wrapper element
   * @param {HTMLElement} originalElement - Original element
   */
  setupInputListeners(input, wrapper, originalElement) {
    const edit = this.currentEdit;

    // Save on blur
    if (this.options.saveOnBlur) {
      input.addEventListener('blur', () => {
        setTimeout(() => {
          // Delay to allow click events to fire first
          if (this.currentEdit === edit) {
            this.save(input, wrapper, originalElement);
          }
        }, 200);
      });
    }

    // Save on Enter
    if (this.options.saveOnEnter) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.save(input, wrapper, originalElement);
        }
      });
    }

    // Cancel on Escape
    if (this.options.cancelOnEscape) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.cancel(wrapper, originalElement);
        }
      });
    }

    // Real-time validation
    if (this.options.validateOnChange) {
      input.addEventListener('input', () => {
        this.validateInput(input, edit);
      });
    }
  }

  /**
   * Validate input
   * @param {HTMLElement} input - Input element
   * @param {Object} edit - Edit configuration
   */
  validateInput(input, edit) {
    const value = input.value;
    let isValid = true;
    let errorMessage = null;

    // Use custom validator if provided
    if (edit.validator && typeof edit.validator === 'function') {
      const result = edit.validator(value);
      if (typeof result === 'object') {
        isValid = result.valid;
        errorMessage = result.message;
      } else {
        isValid = result;
      }
    } else if (edit.fieldPath && typeof validationService !== 'undefined') {
      // Use validation service
      const result = validationService.validate(edit.fieldPath, value);
      isValid = result.valid;
      errorMessage = result.message;
    }

    // Update input styling
    if (isValid) {
      input.style.borderColor = 'var(--primary)';
      this.removeError(input);
    } else {
      input.style.borderColor = 'var(--danger)';
      if (this.options.showValidationErrors && errorMessage) {
        this.showError(input, errorMessage);
      }
    }

    return isValid;
  }

  /**
   * Show validation error
   * @param {HTMLElement} input - Input element
   * @param {string} message - Error message
   */
  showError(input, message) {
    this.removeError(input);
    
    const errorEl = document.createElement('div');
    errorEl.className = 'inline-editor-error';
    errorEl.textContent = message;
    errorEl.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--danger);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      margin-top: 2px;
    `;
    
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(errorEl);
  }

  /**
   * Remove validation error
   * @param {HTMLElement} input - Input element
   */
  removeError(input) {
    const errorEl = input.parentNode.querySelector('.inline-editor-error');
    if (errorEl) {
      errorEl.remove();
    }
  }

  /**
   * Save edited value
   * @param {HTMLElement} input - Input element
   * @param {HTMLElement} wrapper - Wrapper element
   * @param {HTMLElement} originalElement - Original element
   */
  async save(input, wrapper, originalElement) {
    const edit = this.currentEdit;
    if (!edit) return;

    const newValue = input.type === 'number' ? parseFloat(input.value) : input.value;

    // Validate before saving
    const isValid = this.validateInput(input, edit);
    if (!isValid) {
      // Don't save if invalid
      return;
    }

    // Call onSave callback
    if (edit.onSave && typeof edit.onSave === 'function') {
      try {
        await edit.onSave(edit.fieldPath, newValue, edit.originalValue);
      } catch (error) {
        console.error('Error saving inline edit:', error);
        this.showError(input, error.message || 'Error saving value');
        return;
      }
    }

    // Register with auto-save service if available
    if (typeof autoSaveService !== 'undefined' && autoSaveService && edit.recordId) {
      const changeData = {};
      this.setNestedValue(changeData, edit.fieldPath, newValue);
      autoSaveService.registerChange(edit.recordId, changeData, {
        source: 'inline_editor',
        fieldPath: edit.fieldPath
      });
    }

    // Update original element
    originalElement.textContent = newValue;
    originalElement.style.display = '';

    // Remove wrapper and input
    wrapper.parentNode.replaceChild(originalElement, wrapper);

    // Clear current edit
    this.currentEdit = null;
    this.originalValue = null;
  }

  /**
   * Cancel editing
   * @param {HTMLElement} wrapper - Wrapper element
   * @param {HTMLElement} originalElement - Original element
   */
  cancel(wrapper, originalElement) {
    // Restore original element
    originalElement.style.display = '';
    wrapper.parentNode.replaceChild(originalElement, wrapper);

    // Call onCancel callback
    if (this.currentEdit && this.currentEdit.onCancel && typeof this.currentEdit.onCancel === 'function') {
      this.currentEdit.onCancel();
    }

    // Clear current edit
    this.currentEdit = null;
    this.originalValue = null;
  }

  /**
   * Check if currently editing
   * @returns {boolean}
   */
  isEditing() {
    return this.currentEdit !== null;
  }

  /**
   * Cancel current edit if any
   */
  cancelCurrent() {
    if (this.currentEdit) {
      const wrapper = this.currentEdit.element.parentNode;
      if (wrapper && wrapper.classList.contains('inline-editor-wrapper')) {
        const originalElement = wrapper.querySelector(':not(.inline-editor-input):not(.inline-editor-error)');
        if (originalElement) {
          this.cancel(wrapper, originalElement);
        }
      }
    }
  }

  /**
   * Set nested value in object
   * @param {Object} obj - Object to set value in
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}

// Create singleton instance
const inlineEditor = new InlineEditor();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InlineEditor, inlineEditor };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.inlineEditor = inlineEditor;
  window.InlineEditor = InlineEditor;
}
