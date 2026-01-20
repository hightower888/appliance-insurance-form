/**
 * Input Formatter Utility
 * Smart input handling with auto-formatting for banking details
 */

class InputFormatter {
  constructor() {
    this.formatters = new Map();
  }

  /**
   * Format sort code (6 digits)
   * @param {string} input - Input value
   * @returns {string} Formatted sort code (6 digits, no spaces/hyphens)
   */
  formatSortCode(input) {
    if (!input) return '';
    
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Limit to 6 digits
    return digits.slice(0, 6);
  }

  /**
   * Format account number (8 digits)
   * @param {string} input - Input value
   * @returns {string} Formatted account number (8 digits, no spaces/hyphens)
   */
  formatAccountNumber(input) {
    if (!input) return '';
    
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Limit to 8 digits
    return digits.slice(0, 8);
  }

  /**
   * Format phone number (optional)
   * @param {string} input - Input value
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(input) {
    if (!input) return '';
    
    // Remove all non-digit characters except + at start
    let cleaned = input.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
    } else {
      cleaned = cleaned.replace(/\D/g, '');
    }
    
    return cleaned;
  }

  /**
   * Handle paste event with auto-formatting
   * @param {Event} event - Paste event
   * @param {string} type - Input type ('sortCode' or 'accountNumber')
   */
  handlePaste(event, type) {
    event.preventDefault();
    
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    let formatted;
    
    if (type === 'sortCode') {
      formatted = this.formatSortCode(pastedText);
    } else if (type === 'accountNumber') {
      formatted = this.formatAccountNumber(pastedText);
    } else {
      formatted = pastedText;
    }
    
    // Set formatted value
    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = input.value;
    
    const newValue = currentValue.substring(0, start) + formatted + currentValue.substring(end);
    
    // Apply formatting based on type
    if (type === 'sortCode') {
      input.value = this.formatSortCode(newValue);
    } else if (type === 'accountNumber') {
      input.value = this.formatAccountNumber(newValue);
    } else {
      input.value = newValue;
    }
    
    // Trigger input event for validation
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Attach formatter to input element
   * @param {HTMLElement} element - Input element
   * @param {string} type - Input type ('sortCode', 'accountNumber', 'phoneNumber')
   */
  attachFormatter(element, type) {
    if (!element) return;
    
    // Store formatter reference
    this.formatters.set(element, type);
    
    // Input event - format as user types
    element.addEventListener('input', (e) => {
      let formatted;
      
      if (type === 'sortCode') {
        formatted = this.formatSortCode(e.target.value);
      } else if (type === 'accountNumber') {
        formatted = this.formatAccountNumber(e.target.value);
      } else if (type === 'phoneNumber') {
        formatted = this.formatPhoneNumber(e.target.value);
      } else {
        return; // No formatting for other types
      }
      
      // Only update if value changed (to avoid cursor jumping)
      if (e.target.value !== formatted) {
        const cursorPos = e.target.selectionStart;
        e.target.value = formatted;
        
        // Restore cursor position (adjust for removed characters)
        const newCursorPos = Math.min(cursorPos, formatted.length);
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
    
    // Paste event - handle paste with auto-formatting
    element.addEventListener('paste', (e) => {
      this.handlePaste(e, type);
    });
    
    // Blur event - final formatting
    element.addEventListener('blur', (e) => {
      let formatted;
      
      if (type === 'sortCode') {
        formatted = this.formatSortCode(e.target.value);
      } else if (type === 'accountNumber') {
        formatted = this.formatAccountNumber(e.target.value);
      } else if (type === 'phoneNumber') {
        formatted = this.formatPhoneNumber(e.target.value);
      } else {
        return;
      }
      
      if (e.target.value !== formatted) {
        e.target.value = formatted;
        e.target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  /**
   * Format value without attaching to element
   * @param {string} value - Value to format
   * @param {string} type - Input type
   * @returns {string} Formatted value
   */
  format(value, type) {
    switch (type) {
      case 'sortCode':
        return this.formatSortCode(value);
      case 'accountNumber':
        return this.formatAccountNumber(value);
      case 'phoneNumber':
        return this.formatPhoneNumber(value);
      default:
        return value;
    }
  }

  /**
   * Remove formatter from element
   * @param {HTMLElement} element - Input element
   */
  detachFormatter(element) {
    if (!element) return;
    
    this.formatters.delete(element);
    
    // Note: Event listeners are not removed as they're anonymous
    // In production, you might want to store references for cleanup
  }
}

// Create singleton instance
const inputFormatter = new InputFormatter();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InputFormatter, inputFormatter };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.inputFormatter = inputFormatter;
  window.InputFormatter = InputFormatter;
}
