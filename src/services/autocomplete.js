/**
 * Reusable Autocomplete Component
 * Provides type-to-filter autocomplete functionality for dropdown fields
 * Supports keyboard navigation, "Other" option, and custom styling
 */

const autocomplete = {
  /**
   * Create an autocomplete input field
   * @param {Object} options - Configuration options
   * @param {HTMLElement} options.container - Container element to attach autocomplete to
   * @param {string} options.inputId - ID for the input element
   * @param {string} options.inputName - Name attribute for the input
   * @param {Array<string>} options.options - Array of option values
   * @param {string} options.placeholder - Placeholder text
   * @param {boolean} options.allowOther - Whether to show "Other" option
   * @param {Function} options.onSelect - Callback when option is selected
   * @param {Function} options.onOtherSelect - Callback when "Other" is selected
   * @returns {Object} Autocomplete instance with destroy method
   */
  create(options = {}) {
    const {
      container,
      inputId,
      inputName,
      options: optionList = [],
      placeholder = 'Type to search...',
      allowOther = false,
      onSelect = null,
      onOtherSelect = null,
      required = false
    } = options;

    if (!container) {
      throw new Error('Container element is required');
    }

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'autocomplete-wrapper';
    wrapper.style.position = 'relative';

    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.id = inputId;
    input.name = inputName;
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('role', 'combobox');
    if (required) {
      input.required = true;
      input.setAttribute('aria-required', 'true');
    }

    // Create dropdown list
    const dropdown = document.createElement('ul');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.display = 'none';
    dropdown.setAttribute('role', 'listbox');
    dropdown.id = `${inputId}-dropdown`;

    input.setAttribute('aria-owns', dropdown.id);

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    container.appendChild(wrapper);

    let filteredOptions = [];
    let selectedIndex = -1;
    let isOtherSelected = false;
    let otherInput = null;

    /**
     * Filter options based on input value
     */
    function filterOptions() {
      const value = input.value.trim().toLowerCase();
      
      if (value === '') {
        filteredOptions = optionList.slice();
      } else {
        filteredOptions = optionList.filter(option =>
          option.toLowerCase().includes(value)
        );
      }

      // Add "Other" option if enabled
      if (allowOther && !isOtherSelected) {
        filteredOptions.push('Other');
      }

      renderDropdown();
    }

    /**
     * Render dropdown with filtered options
     */
    function renderDropdown() {
      dropdown.innerHTML = '';
      selectedIndex = -1;

      if (filteredOptions.length === 0) {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        return;
      }

      filteredOptions.forEach((option, index) => {
        const li = document.createElement('li');
        li.className = 'autocomplete-option';
        li.setAttribute('role', 'option');
        li.setAttribute('data-index', index);
        li.textContent = option;
        
        if (index === selectedIndex) {
          li.classList.add('selected');
          li.setAttribute('aria-selected', 'true');
        }

        li.addEventListener('click', () => selectOption(option, index));
        dropdown.appendChild(li);
      });

      dropdown.style.display = 'block';
      input.setAttribute('aria-expanded', 'true');
    }

    /**
     * Select an option
     */
    function selectOption(option, index) {
      if (option === 'Other' && allowOther) {
        selectOther();
      } else {
        input.value = option;
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        isOtherSelected = false;
        
        if (onSelect) {
          onSelect(option);
        }
      }
    }

    /**
     * Select "Other" option and show text input
     */
    function selectOther() {
      input.value = 'Other';
      dropdown.style.display = 'none';
      input.setAttribute('aria-expanded', 'false');
      isOtherSelected = true;

      // Create or show "Other" text input
      if (!otherInput) {
        otherInput = document.createElement('input');
        otherInput.type = 'text';
        otherInput.className = 'autocomplete-other-input';
        otherInput.placeholder = 'Enter custom value...';
        otherInput.style.marginTop = '8px';
        otherInput.style.width = '100%';
        wrapper.appendChild(otherInput);

        otherInput.addEventListener('blur', () => {
          if (onOtherSelect && otherInput.value.trim()) {
            onOtherSelect(otherInput.value.trim());
          }
        });
      }

      otherInput.style.display = 'block';
      otherInput.focus();

      if (onOtherSelect) {
        onOtherSelect(null); // Signal that "Other" was selected
      }
    }

    /**
     * Handle keyboard navigation
     */
    function handleKeyDown(e) {
      if (dropdown.style.display === 'none') {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault();
          filterOptions();
          return;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, filteredOptions.length - 1);
          renderDropdown();
          updateSelectedOption();
          break;

        case 'ArrowUp':
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, -1);
          renderDropdown();
          updateSelectedOption();
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            selectOption(filteredOptions[selectedIndex], selectedIndex);
          }
          break;

        case 'Escape':
          e.preventDefault();
          dropdown.style.display = 'none';
          input.setAttribute('aria-expanded', 'false');
          selectedIndex = -1;
          break;
      }
    }

    /**
     * Update selected option styling
     */
    function updateSelectedOption() {
      const options = dropdown.querySelectorAll('.autocomplete-option');
      options.forEach((option, index) => {
        if (index === selectedIndex) {
          option.classList.add('selected');
          option.setAttribute('aria-selected', 'true');
          option.scrollIntoView({ block: 'nearest' });
        } else {
          option.classList.remove('selected');
          option.setAttribute('aria-selected', 'false');
        }
      });
    }

    // Event listeners
    input.addEventListener('input', filterOptions);
    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('focus', filterOptions);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
      }
    });

    // Initial filter
    filterOptions();

    // Return instance with destroy method
    return {
      destroy() {
        input.removeEventListener('input', filterOptions);
        input.removeEventListener('keydown', handleKeyDown);
        input.removeEventListener('focus', filterOptions);
        wrapper.remove();
      },
      getValue() {
        if (isOtherSelected && otherInput) {
          return otherInput.value.trim() || 'Other';
        }
        return input.value.trim();
      },
      setValue(value) {
        input.value = value;
        if (value && !optionList.includes(value) && allowOther) {
          selectOther();
          if (otherInput) {
            otherInput.value = value;
          }
        }
      },
      updateOptions(newOptions) {
        optionList = newOptions;
        // Re-filter with current input value
        filterOptions();
      },
      getInput() {
        return input;
      },
      getOtherInput() {
        return otherInput;
      }
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = autocomplete;
}
