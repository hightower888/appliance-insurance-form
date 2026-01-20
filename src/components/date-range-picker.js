/**
 * Date Range Picker Component
 * Reusable date range picker (from/to dates)
 */

class DateRangePicker {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      fromLabel: options.fromLabel || 'From Date',
      toLabel: options.toLabel || 'To Date',
      fromId: options.fromId || 'dateFrom',
      toId: options.toId || 'dateTo',
      required: options.required || false,
      minDate: options.minDate || null,
      maxDate: options.maxDate || null,
      onDateChange: options.onDateChange || null,
      ...options
    };
    this.fromValue = null;
    this.toValue = null;
    this.isRendered = false;
  }

  /**
   * Render the date range picker
   */
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="date-range-picker">
        <div class="date-range-field">
          <label for="${this.options.fromId}">${this.options.fromLabel}${this.options.required ? ' <span class="required">*</span>' : ''}</label>
          <input 
            type="date" 
            id="${this.options.fromId}" 
            class="date-input date-from"
            ${this.options.minDate ? `min="${this.options.minDate}"` : ''}
            ${this.options.maxDate ? `max="${this.options.maxDate}"` : ''}
          >
          <span class="error-message" id="${this.options.fromId}-error"></span>
        </div>
        <div class="date-range-field">
          <label for="${this.options.toId}">${this.options.toLabel}${this.options.required ? ' <span class="required">*</span>' : ''}</label>
          <input 
            type="date" 
            id="${this.options.toId}" 
            class="date-input date-to"
            ${this.options.minDate ? `min="${this.options.minDate}"` : ''}
            ${this.options.maxDate ? `max="${this.options.maxDate}"` : ''}
          >
          <span class="error-message" id="${this.options.toId}-error"></span>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
    this.isRendered = true;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const fromInput = document.getElementById(this.options.fromId);
    const toInput = document.getElementById(this.options.toId);
    
    if (!fromInput || !toInput) return;
    
    // Update min/max based on selection
    fromInput.addEventListener('change', () => {
      this.fromValue = fromInput.value;
      if (this.fromValue) {
        toInput.min = this.fromValue; // To date must be >= from date
      }
      this.validate();
      if (this.options.onDateChange) {
        this.options.onDateChange(this.getValue());
      }
    });
    
    toInput.addEventListener('change', () => {
      this.toValue = toInput.value;
      if (this.toValue) {
        fromInput.max = this.toValue; // From date must be <= to date
      }
      this.validate();
      if (this.options.onDateChange) {
        this.options.onDateChange(this.getValue());
      }
    });
  }

  /**
   * Get current date range value
   * @returns {Object} { from: string, to: string }
   */
  getValue() {
    const fromInput = document.getElementById(this.options.fromId);
    const toInput = document.getElementById(this.options.toId);
    
    return {
      from: fromInput?.value || '',
      to: toInput?.value || ''
    };
  }

  /**
   * Set date range value
   * @param {Object} dates - { from: string, to: string }
   */
  setValue(dates) {
    const fromInput = document.getElementById(this.options.fromId);
    const toInput = document.getElementById(this.options.toId);
    
    if (fromInput && dates.from) {
      fromInput.value = dates.from;
      this.fromValue = dates.from;
    }
    if (toInput && dates.to) {
      toInput.value = dates.to;
      this.toValue = dates.to;
    }
    
    // Update min/max constraints
    if (this.fromValue && toInput) {
      toInput.min = this.fromValue;
    }
    if (this.toValue && fromInput) {
      fromInput.max = this.toValue;
    }
    
    this.validate();
  }

  /**
   * Validate date range
   * @returns {boolean} True if valid
   */
  validate() {
    const fromInput = document.getElementById(this.options.fromId);
    const toInput = document.getElementById(this.options.toId);
    const fromError = document.getElementById(`${this.options.fromId}-error`);
    const toError = document.getElementById(`${this.options.toId}-error`);
    
    let isValid = true;
    
    // Clear previous errors
    if (fromError) fromError.textContent = '';
    if (toError) toError.textContent = '';
    
    // Check required
    if (this.options.required) {
      if (!fromInput?.value) {
        if (fromError) fromError.textContent = `${this.options.fromLabel} is required`;
        isValid = false;
      }
      if (!toInput?.value) {
        if (toError) toError.textContent = `${this.options.toLabel} is required`;
        isValid = false;
      }
    }
    
    // Check date range validity (from <= to)
    if (fromInput?.value && toInput?.value) {
      const fromDate = new Date(fromInput.value);
      const toDate = new Date(toInput.value);
      
      if (fromDate > toDate) {
        if (toError) toError.textContent = 'To date must be after from date';
        isValid = false;
      }
    }
    
    // Update input validity
    if (fromInput) {
      fromInput.setCustomValidity(isValid ? '' : 'Invalid date range');
    }
    if (toInput) {
      toInput.setCustomValidity(isValid ? '' : 'Invalid date range');
    }
    
    return isValid;
  }

  /**
   * Clear date range
   */
  clear() {
    const fromInput = document.getElementById(this.options.fromId);
    const toInput = document.getElementById(this.options.toId);
    
    if (fromInput) {
      fromInput.value = '';
      this.fromValue = null;
    }
    if (toInput) {
      toInput.value = '';
      this.toValue = null;
    }
    
    // Reset min/max
    if (fromInput) fromInput.max = this.options.maxDate || '';
    if (toInput) toInput.min = this.options.minDate || '';
    
    this.validate();
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
  module.exports = { DateRangePicker };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DateRangePicker = DateRangePicker;
}
