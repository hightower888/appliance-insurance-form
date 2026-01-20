/**
 * Appliance Cover Form - Application Logic
 * Handles form state, validation, calculation, and Firebase submission
 */

// Global State
let applianceCount = 0;
const MAX_APPLIANCES = 10;
const MIN_APPLIANCES = 1;
const PRICE_PER_APPLIANCE = 5.99;

// Brand management state
let brandsList = []; // Cache of brands loaded from Firebase
let brandAutocompleteInstances = {}; // Store autocomplete instances for each appliance
let applianceTypeAutocompleteInstances = {}; // Store autocomplete instances for appliance types

// Appliance types list (white goods and brown goods)
const applianceTypesList = [
  // White Goods (Kitchen & Laundry)
  'Washing Machine',
  'Tumble Dryer',
  'Dishwasher',
  'Fridge',
  'Freezer',
  'Fridge Freezer',
  'Cooker',
  'Oven',
  'Hob',
  'Cooker Hood',
  'Microwave',
  'Wine Cooler',
  'Range Cooker',
  'Built-in Oven',
  'Built-in Hob',
  'Integrated Dishwasher',
  'Integrated Fridge',
  'Integrated Freezer',
  'Integrated Fridge Freezer',
  'American Style Fridge Freezer',
  'Washer Dryer',
  'Chest Freezer',
  'Upright Freezer',
  'Under Counter Fridge',
  'Under Counter Freezer',
  'Side by Side Fridge Freezer',
  
  // Brown Goods (Entertainment & Electronics)
  'Television',
  'TV',
  'Smart TV',
  'LED TV',
  'OLED TV',
  'QLED TV',
  '4K TV',
  '8K TV',
  'Home Cinema System',
  'Soundbar',
  'Surround Sound System',
  'DVD Player',
  'Blu-ray Player',
  'Games Console',
  'PlayStation',
  'Xbox',
  'Nintendo Switch',
  'Hi-Fi System',
  'Stereo System',
  'CD Player',
  'Record Player',
  'Turntable',
  'Radio',
  'DAB Radio',
  'Computer',
  'Desktop Computer',
  'Laptop',
  'Tablet',
  'Monitor',
  'Printer',
  'Scanner',
  'Projector',
  'Smart Speaker',
  'Voice Assistant',
  'Other'
].sort();

// DOM Elements (cached for performance)
let elements = {};

/**
 * Initialize the application
 */
function initializeApp() {
  // Check authentication first
  if (typeof checkAuth === 'function') {
    checkAuth('login.html').then(authenticated => {
      if (!authenticated) {
        return; // Redirected to login
      }
      initializeAppAfterAuth();
    });
  } else {
    // If auth.js not loaded, proceed without auth check (for backward compatibility)
    initializeAppAfterAuth();
  }
}

/**
 * Initialize app after authentication check
 */
async function initializeAppAfterAuth() {
  // Cache DOM elements
  elements = {
    form: document.getElementById('insuranceForm'),
    appliancesList: document.getElementById('appliancesList'),
    addApplianceBtn: document.getElementById('addApplianceBtn'),
    addBoilerCheckbox: document.getElementById('addBoilerCheckbox'),
    boilerOptions: document.getElementById('boilerOptions'),
    appliancesCostDisplay: document.getElementById('appliancesCost'),
    boilerCostDisplay: document.getElementById('boilerCost'),
    boilerCostRow: document.getElementById('boilerCostRow'),
    totalCostInput: document.getElementById('totalCostInput'),
    submitBtn: document.getElementById('submitBtn'),
    submitBtnText: document.getElementById('submitBtnText'),
    submitBtnSpinner: document.getElementById('submitBtnSpinner'),
    messageContainer: document.getElementById('messageContainer'),
    messageContent: document.getElementById('messageContent'),
    sortCode: document.getElementById('sortCode'),
    accountNumber: document.getElementById('accountNumber'),
    notes: document.getElementById('notes'),
    dynamicFieldsContainer: document.getElementById('dynamicFieldsContainer'),
    address: document.getElementById('adress'),
    city: document.getElementById('city'),
    county: document.getElementById('county'),
    postcode: document.getElementById('postcode'),
    postcodeLookupBtn: document.getElementById('postcodeLookupBtn'),
    postcodeLookupStatus: document.getElementById('postcodeLookupStatus')
  };

  // Load and render dynamic form fields
  if (elements.dynamicFieldsContainer && typeof formRenderer !== 'undefined') {
    try {
      // Exclude sections that are handled separately (Contact Details, Payment Details, Appliances, Boiler, Cost Summary)
      // Contact Details and Payment Details are static sections in HTML to ensure reliability
      const options = {
        excludeSections: [
          'Contact Details',        // Static section in HTML (lines 31-100)
          'Payment Details',        // Static section in HTML (lines 103-156)
          'Direct Debit Details',   // Alternative name for Payment Details
          'Appliances',             // Handled separately with dynamic add/remove
          'Boiler Cover',           // Handled separately with checkbox
          'Cost Summary',           // Calculated dynamically
          'Additional Information' // Handled separately
        ],
        excludeFields: [] // Can exclude specific field names if needed
      };
      await formRenderer.renderForm(elements.dynamicFieldsContainer, options);
    } catch (error) {
      console.error('Error loading dynamic form fields:', error);
      // Continue with static form if dynamic loading fails
    }
  }

  // Load brands from Firebase
  await loadBrandsFromFirebase();

  // Add initial appliance
  addAppliance();

  // Set up event listeners
  setupEventListeners();

  // Set up sort code auto-formatting (legacy)
  setupSortCodeFormatting();
  
  // Set up smart input formatting (enhanced)
  setupSmartInputFormatting();

  // Set up postcode lookup
  setupPostcodeLookup();

  // Initialize duplicate detection
  setupDuplicateDetection();

  // Initial calculation
  calculateTotal();
  
  // Check for CRM prefill data
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('prefill') === 'true') {
    prefillFormFields();
  }
  
  // Set up auth state listener
  if (typeof onAuthStateChanged === 'function') {
    onAuthStateChanged((user) => {
      if (!user) {
        // User logged out, redirect to login
        window.location.href = 'login.html';
      }
    });
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Add appliance button
  elements.addApplianceBtn.addEventListener('click', addAppliance);

  // Boiler checkbox toggle
  elements.addBoilerCheckbox.addEventListener('change', toggleBoilerOptions);
  
  // Boiler plan radio change - update editable cost input
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('boiler-plan-radio') && e.target.checked) {
      const boilerCostInput = document.getElementById('boilerCostInput');
      if (boilerCostInput) {
        boilerCostInput.value = parseFloat(e.target.value).toFixed(2);
        calculateTotal();
      }
    }
  });
  
  // Boiler cost input change - recalculate total
  document.addEventListener('input', (e) => {
    if (e.target.id === 'boilerCostInput') {
      calculateTotal();
    }
  });
  
  document.addEventListener('change', (e) => {
    if (e.target.id === 'boilerCostInput') {
      calculateTotal();
    }
  });

  // Form submission
  elements.form.addEventListener('submit', handleSubmit);

  // Real-time validation and calculation
  elements.form.addEventListener('input', (e) => {
    // Track manual edits to total cost
    if (e.target.id === 'totalCostInput') {
      e.target.dataset.manualEdit = 'true';
    }
    // Recalculate if cost inputs change
    if (e.target.classList.contains('appliance-cost-input') || e.target.id === 'boilerCostInput') {
      calculateTotal();
    }
    validateForm();
  });

  elements.form.addEventListener('change', (e) => {
    // Track manual edits to total cost
    if (e.target.id === 'totalCostInput') {
      e.target.dataset.manualEdit = 'true';
    }
    // Recalculate if cost inputs change
    if (e.target.classList.contains('appliance-cost-input') || e.target.id === 'boilerCostInput') {
      calculateTotal();
    }
    validateForm();
  });

  // Validate fields on blur
  elements.form.addEventListener('blur', (e) => {
    if (e.target.matches('input, select')) {
      validateField(e.target);
    }
  }, true);
}

/**
 * Add a new appliance entry to the form
 */
function addAppliance() {
  if (applianceCount >= MAX_APPLIANCES) {
    showMessage('You can add a maximum of 10 appliances.', 'error');
    return;
  }

  applianceCount++;

  const applianceHTML = `
    <div class="appliance-entry" data-appliance-id="${applianceCount}" id="appliance-${applianceCount}">
      <h3>
        <span class="appliance-number">Appliance ${applianceCount}</span>
        ${applianceCount > 1 ? `<button type="button" class="btn-danger remove-appliance-btn" onclick="removeAppliance(${applianceCount})" aria-label="Remove appliance ${applianceCount}">Remove</button>` : ''}
      </h3>
      
      <div class="appliance-fields">
        <div class="form-group">
          <label for="type-${applianceCount}">Appliance Type <span class="required">*</span></label>
          <div id="type-${applianceCount}-container"></div>
          <span class="error-message" id="type-${applianceCount}-error"></span>
        </div>

        <div class="form-group">
          <label for="make-${applianceCount}">Make/Brand</label>
          <div id="make-${applianceCount}-container"></div>
          <span class="error-message" id="make-${applianceCount}-error"></span>
        </div>

        <div class="form-group">
          <label for="model-${applianceCount}">Model</label>
          <input 
            type="text" 
            id="model-${applianceCount}" 
            name="model-${applianceCount}" 
            placeholder="e.g., Serie 6 WAT28371GB" 
            aria-required="false">
          <span class="error-message" id="model-${applianceCount}-error"></span>
        </div>

        <div class="form-group">
          <label for="age-${applianceCount}">Age</label>
          <select id="age-${applianceCount}" name="age-${applianceCount}" aria-required="false">
            <option value="">Select age</option>
            <option value="<1">Less than 1 year</option>
            <option value="1-2">1-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="10+">10+ years</option>
          </select>
          <span class="error-message" id="age-${applianceCount}-error"></span>
        </div>

        <div class="form-group">
          <label for="cost-${applianceCount}">Monthly Cost</label>
          <div class="cost-input-wrapper">
            <span class="currency-symbol">£</span>
            <input 
              type="number" 
              id="cost-${applianceCount}" 
              name="cost-${applianceCount}" 
              value="5.99"
              min="0" 
              step="0.01"
              class="appliance-cost-input">
            <span class="cost-period">/month</span>
          </div>
        </div>
      </div>
    </div>
  `;

  elements.appliancesList.insertAdjacentHTML('beforeend', applianceHTML);

  // Initialize autocomplete components for this appliance
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    initializeBrandAutocomplete(applianceCount);
    initializeApplianceTypeAutocomplete(applianceCount);
  }, 0);

  // Add event listener to cost input for this appliance
  const costInput = document.getElementById(`cost-${applianceCount}`);
  if (costInput) {
    costInput.addEventListener('input', calculateTotal);
    costInput.addEventListener('change', calculateTotal);
  }

  // Update button state
  updateAddApplianceButton();

  // Calculate total
  calculateTotal();

  // Validate form
  validateForm();
}

/**
 * Remove an appliance entry from the form
 */
function removeAppliance(id) {
  if (applianceCount <= MIN_APPLIANCES) {
    showMessage('You must have at least 1 appliance.', 'error');
    return;
  }

  // Clean up autocomplete instances
  if (brandAutocompleteInstances[id]) {
    brandAutocompleteInstances[id].destroy();
    delete brandAutocompleteInstances[id];
  }
  if (applianceTypeAutocompleteInstances[id]) {
    applianceTypeAutocompleteInstances[id].destroy();
    delete applianceTypeAutocompleteInstances[id];
  }

  const applianceEntry = document.getElementById(`appliance-${id}`);
  if (applianceEntry) {
    applianceEntry.remove();
    applianceCount--;

    // Renumber remaining appliances
    renumberAppliances();

    // Update button state
    updateAddApplianceButton();

    // Calculate total
    calculateTotal();

    // Validate form
    validateForm();
  }
}

/**
 * Renumber appliances after removal
 */
function renumberAppliances() {
  const appliances = elements.appliancesList.querySelectorAll('.appliance-entry');
  const newInstances = {};
  
  appliances.forEach((appliance, index) => {
    const newId = index + 1;
    const oldId = appliance.getAttribute('data-appliance-id');
    
    // Clean up old autocomplete instances
    if (brandAutocompleteInstances[oldId]) {
      brandAutocompleteInstances[oldId].destroy();
      delete brandAutocompleteInstances[oldId];
    }
    if (applianceTypeAutocompleteInstances[oldId]) {
      applianceTypeAutocompleteInstances[oldId].destroy();
      delete applianceTypeAutocompleteInstances[oldId];
    }
    
    // Update data attribute and main ID
    appliance.setAttribute('data-appliance-id', newId);
    appliance.id = `appliance-${newId}`;
    
    // Update display number
    const numberSpan = appliance.querySelector('.appliance-number');
    if (numberSpan) {
      numberSpan.textContent = `Appliance ${newId}`;
    }
    
    // Update all input/select IDs and names
    const fields = ['type', 'model', 'age', 'cost'];
    fields.forEach(fieldName => {
      const oldField = appliance.querySelector(`#${fieldName}-${oldId}`);
      if (oldField) {
        oldField.id = `${fieldName}-${newId}`;
        oldField.name = `${fieldName}-${newId}`;
        // Update error message span ID
        const errorSpan = appliance.querySelector(`#${fieldName}-${oldId}-error`);
        if (errorSpan) {
          errorSpan.id = `${fieldName}-${newId}-error`;
        }
      }
    });
    
    // Update brand autocomplete container ID
    const brandContainer = appliance.querySelector(`#make-${oldId}-container`);
    if (brandContainer) {
      brandContainer.id = `make-${newId}-container`;
    }
    
    // Update brand error message span ID
    const brandErrorSpan = appliance.querySelector(`#make-${oldId}-error`);
    if (brandErrorSpan) {
      brandErrorSpan.id = `make-${newId}-error`;
    }
    
    // Update appliance type autocomplete container ID
    const typeContainer = appliance.querySelector(`#type-${oldId}-container`);
    if (typeContainer) {
      typeContainer.id = `type-${newId}-container`;
    }
    
    // Update type error message span ID
    const typeErrorSpan = appliance.querySelector(`#type-${oldId}-error`);
    if (typeErrorSpan) {
      typeErrorSpan.id = `type-${newId}-error`;
    }
    
    // Update remove button onclick
    const removeBtn = appliance.querySelector('.remove-appliance-btn');
    if (removeBtn) {
      removeBtn.setAttribute('onclick', `removeAppliance(${newId})`);
      removeBtn.setAttribute('aria-label', `Remove appliance ${newId}`);
    }
    
    // Reattach event listeners to cost input
    const costInput = appliance.querySelector(`#cost-${newId}`);
    if (costInput) {
      // Remove old listeners by cloning
      const newCostInput = costInput.cloneNode(true);
      costInput.parentNode.replaceChild(newCostInput, costInput);
      // Add new listeners
      newCostInput.addEventListener('input', calculateTotal);
      newCostInput.addEventListener('change', calculateTotal);
    }
    
    // Reinitialize autocomplete components with new ID
    setTimeout(() => {
      initializeBrandAutocomplete(newId);
      initializeApplianceTypeAutocomplete(newId);
    }, 0);
  });
  
  // Update appliance count
  applianceCount = appliances.length;
}

/**
 * Update add appliance button state
 */
function updateAddApplianceButton() {
  if (applianceCount >= MAX_APPLIANCES) {
    elements.addApplianceBtn.disabled = true;
    elements.addApplianceBtn.textContent = `Maximum ${MAX_APPLIANCES} appliances`;
  } else {
    elements.addApplianceBtn.disabled = false;
    elements.addApplianceBtn.innerHTML = '<span class="btn-icon">+</span> Add Another Appliance';
  }
}

/**
 * Toggle boiler options visibility
 */
function toggleBoilerOptions() {
  const isChecked = elements.addBoilerCheckbox.checked;
  elements.boilerOptions.style.display = isChecked ? 'block' : 'none';

  // Clear boiler selection if unchecked
  if (!isChecked) {
    const boilerRadios = elements.boilerOptions.querySelectorAll('input[name="boilerPlan"]');
    boilerRadios.forEach(radio => radio.checked = false);
  }

  // Calculate total
  calculateTotal();

  // Validate form
  validateForm();
}

/**
 * Calculate total monthly cost and update notes
 */
function calculateTotal() {
  // Calculate appliances cost from individual appliance cost inputs
  let appliancesCost = 0;
  const applianceEntries = document.querySelectorAll('.appliance-entry');
  applianceEntries.forEach((appliance) => {
    // Get the appliance ID from data attribute
    const applianceId = appliance.getAttribute('data-appliance-id');
    const costInput = document.getElementById(`cost-${applianceId}`);
    if (costInput) {
      const cost = parseFloat(costInput.value) || 0;
      appliancesCost += cost;
    }
  });

  // Calculate boiler cost if selected (from editable input or radio)
  let boilerCost = 0;
  if (elements.addBoilerCheckbox.checked) {
    // Check for editable boiler cost input first
    const boilerCostInput = document.getElementById('boilerCostInput');
    if (boilerCostInput && boilerCostInput.value) {
      boilerCost = parseFloat(boilerCostInput.value) || 0;
    } else {
      // Fallback to radio button value
      const boilerRadio = document.querySelector('input[name="boilerPlan"]:checked');
      if (boilerRadio) {
        boilerCost = parseFloat(boilerRadio.value) || 0;
        // Update the editable input if it exists
        if (boilerCostInput) {
          boilerCostInput.value = boilerCost.toFixed(2);
        }
      }
    }
  }

  // Update breakdown display
  elements.appliancesCostDisplay.textContent = appliancesCost.toFixed(2);
  elements.boilerCostDisplay.textContent = boilerCost.toFixed(2);
  
  // Show/hide boiler cost row
  elements.boilerCostRow.style.display = boilerCost > 0 ? 'flex' : 'none';

  // Calculate and update total (only if not manually edited)
  // Allow manual override of total
  const total = appliancesCost + boilerCost;
  // Only auto-update if user hasn't manually changed it
  if (!elements.totalCostInput.dataset.manualEdit) {
    elements.totalCostInput.value = total.toFixed(2);
  }

  // Auto-update notes with appliance list
  updateNotes();
}

/**
 * Auto-populate notes field with appliance details
 */
function updateNotes() {
  const appliances = elements.appliancesList.querySelectorAll('.appliance-entry');
  let notesList = [];
  
  appliances.forEach((appliance) => {
    // Get the appliance ID from data attribute
    const applianceId = appliance.getAttribute('data-appliance-id');
    
    // Get type from autocomplete instance if available
    let type = '';
    if (applianceTypeAutocompleteInstances[applianceId]) {
      type = applianceTypeAutocompleteInstances[applianceId].getValue() || '';
    } else {
      type = document.querySelector(`[name="type-${applianceId}"]`)?.value || '';
    }
    
    // Get make from autocomplete instance if available
    let make = '';
    if (brandAutocompleteInstances[applianceId]) {
      make = brandAutocompleteInstances[applianceId].getValue() || '';
    } else {
      make = document.querySelector(`[name="make-${applianceId}"]`)?.value || '';
    }
    
    const model = document.querySelector(`[name="model-${applianceId}"]`)?.value || '';
    
    if (type) {
      notesList.push(`${type}${make ? ' - ' + make : ''}${model ? ' ' + model : ''}`);
    }
  });

  // Add boiler if selected
  if (elements.addBoilerCheckbox.checked) {
    const boilerRadio = document.querySelector('input[name="boilerPlan"]:checked');
    if (boilerRadio) {
      const boilerName = boilerRadio.getAttribute('data-plan-name');
      notesList.push(boilerName);
    }
  }

  // Update notes field (only if user hasn't manually edited it)
  if (elements.notes && notesList.length > 0) {
    const currentNotes = elements.notes.value.trim();
    const autoNotes = notesList.join(', ');
    
    // Only auto-fill if empty or if it matches a previous auto-fill pattern
    if (!currentNotes || currentNotes.includes('-') || currentNotes.includes(',')) {
      elements.notes.value = autoNotes;
    }
  }
}

/**
 * Set up sort code and account number formatting
 */
function setupSortCodeFormatting() {
  if (elements.sortCode) {
    elements.sortCode.addEventListener('input', (e) => {
      // Only allow digits, max 6 (no hyphens for CSV format)
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
  }

  if (elements.accountNumber) {
    elements.accountNumber.addEventListener('input', (e) => {
      // Only allow digits, max 8
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
    });
  }
}

/**
 * Set up postcode lookup functionality
 */
function setupPostcodeLookup() {
  if (!elements.postcodeLookupBtn || !elements.postcode) {
    return; // Elements not available
  }

  let isLookingUp = false;

  elements.postcodeLookupBtn.addEventListener('click', async () => {
    if (isLookingUp) {
      return; // Prevent multiple simultaneous lookups
    }

    const postcodeValue = elements.postcode.value.trim();

    if (!postcodeValue) {
      showPostcodeLookupStatus('Please enter a postcode', 'error');
      return;
    }

    // Basic validation
    if (typeof postcodeLookup !== 'undefined' && postcodeLookup.isValidFormat) {
      if (!postcodeLookup.isValidFormat(postcodeValue)) {
        showPostcodeLookupStatus('Invalid postcode format', 'error');
        return;
      }
    }

    isLookingUp = true;
    elements.postcodeLookupBtn.disabled = true;
    const btnContent = elements.postcodeLookupBtn.innerHTML;
    elements.postcodeLookupBtn.innerHTML = '<span>⏳</span> <span>Looking up...</span>';
    elements.postcodeLookupBtn.style.opacity = '0.7';
    elements.postcodeLookupBtn.style.cursor = 'not-allowed';
    showPostcodeLookupStatus('Looking up address...', 'info');

    try {
      // Check if postcodeLookup service is loaded
      if (typeof postcodeLookup === 'undefined') {
        console.error('Postcode lookup service not loaded. Check script tag order.');
        throw new Error('Postcode lookup service not available. Please refresh the page.');
      }
      
      // Verify service has required methods
      if (typeof postcodeLookup.lookupPostcode !== 'function') {
        console.error('postcodeLookup.lookupPostcode is not a function');
        throw new Error('Postcode lookup service is not properly initialized.');
      }

      const address = await postcodeLookup.lookupPostcode(postcodeValue);

      // Populate address fields
      if (elements.address) {
        elements.address.value = address.street || '';
      }
      if (elements.city) {
        elements.city.value = address.city || '';
      }
      if (elements.county) {
        elements.county.value = address.county || '';
      }
      if (elements.postcode) {
        elements.postcode.value = address.postcode || postcodeValue;
      }

      showPostcodeLookupStatus('Address found and populated', 'success');
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        hidePostcodeLookupStatus();
      }, 3000);

    } catch (error) {
      console.error('Postcode lookup error:', error);
      showPostcodeLookupStatus(error.message || 'Failed to lookup postcode. Please try again.', 'error');
    } finally {
      isLookingUp = false;
      elements.postcodeLookupBtn.disabled = false;
      elements.postcodeLookupBtn.innerHTML = '<span>🔍</span> <span>Lookup</span>';
      elements.postcodeLookupBtn.style.opacity = '1';
      elements.postcodeLookupBtn.style.cursor = 'pointer';
    }
  });

  // Allow Enter key to trigger lookup
  if (elements.postcode) {
    elements.postcode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !isLookingUp) {
        e.preventDefault();
        elements.postcodeLookupBtn.click();
      }
    });
  }
}

/**
 * Show postcode lookup status message
 */
function showPostcodeLookupStatus(message, type = 'info') {
  if (!elements.postcodeLookupStatus) {
    console.warn('Postcode lookup status element not found');
    return;
  }

  elements.postcodeLookupStatus.textContent = message;
  elements.postcodeLookupStatus.style.display = 'block';
  elements.postcodeLookupStatus.style.marginTop = '8px';
  elements.postcodeLookupStatus.style.padding = '8px 12px';
  elements.postcodeLookupStatus.style.borderRadius = '4px';
  elements.postcodeLookupStatus.style.fontSize = '14px';
  elements.postcodeLookupStatus.style.fontWeight = '500';
  elements.postcodeLookupStatus.style.transition = 'all 0.3s ease';

  // Set color and background based on type
  if (type === 'success') {
    elements.postcodeLookupStatus.style.color = '#155724';
    elements.postcodeLookupStatus.style.backgroundColor = '#d4edda';
    elements.postcodeLookupStatus.style.border = '1px solid #c3e6cb';
  } else if (type === 'error') {
    elements.postcodeLookupStatus.style.color = '#721c24';
    elements.postcodeLookupStatus.style.backgroundColor = '#f8d7da';
    elements.postcodeLookupStatus.style.border = '1px solid #f5c6cb';
  } else {
    elements.postcodeLookupStatus.style.color = '#004085';
    elements.postcodeLookupStatus.style.backgroundColor = '#d1ecf1';
    elements.postcodeLookupStatus.style.border = '1px solid #bee5eb';
  }
}

/**
 * Hide postcode lookup status message
 */
function hidePostcodeLookupStatus() {
  if (elements.postcodeLookupStatus) {
    elements.postcodeLookupStatus.style.display = 'none';
  }
}

/**
 * Load brands from Firebase Realtime Database
 * Brands are stored at /brands path
 */
async function loadBrandsFromFirebase() {
  try {
    // Check authentication
    const user = firebase.auth().currentUser;
    if (!user) {
      console.warn('User not authenticated, cannot load brands');
      // Fallback to default brands
      brandsList = getDefaultBrands();
      return;
    }
    
    if (typeof database === 'undefined') {
      console.warn('Firebase database not available, using default brands');
      brandsList = getDefaultBrands();
      return;
    }

    // Check if Firebase Auth user exists
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
      } catch (error) {
        console.warn('Could not sign in anonymously:', error);
      }
    }
    
    if (!authUser) {
      console.warn('User not authenticated, cannot load brands');
      brandsList = getDefaultBrands();
      return;
    }
    
    const brandsRef = database.ref('brands');
    const snapshot = await brandsRef.once('value');

    if (snapshot.exists()) {
      const brandsData = snapshot.val();
      // Convert object to array of brand names
      brandsList = Object.values(brandsData).map(brand => {
        if (typeof brand === 'string') {
          return brand;
        } else if (brand && brand.name) {
          return brand.name;
        }
        return String(brand);
      }).filter(Boolean).sort();
      
      console.log(`Loaded ${brandsList.length} brands from Firebase`);
    } else {
      // No brands in database, use defaults and optionally seed
      console.log('No brands found in Firebase, using default brands');
      brandsList = getDefaultBrands();
      
      // Optionally seed default brands to Firebase
      await seedDefaultBrandsToFirebase();
    }

    // Set up real-time listener for brand changes
    brandsRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const brandsData = snapshot.val();
        const newBrandsList = Object.values(brandsData).map(brand => {
          if (typeof brand === 'string') {
            return brand;
          } else if (brand && brand.name) {
            return brand.name;
          }
          return String(brand);
        }).filter(Boolean).sort();
        
        // Only update if list changed
        if (JSON.stringify(newBrandsList) !== JSON.stringify(brandsList)) {
          brandsList = newBrandsList;
          console.log(`Brands updated: ${brandsList.length} brands`);
          
          // Update all existing autocomplete instances
          Object.keys(brandAutocompleteInstances).forEach(applianceId => {
            const instance = brandAutocompleteInstances[applianceId];
            if (instance && typeof instance.updateOptions === 'function') {
              instance.updateOptions(brandsList);
            }
          });
        }
      } else {
        // Brands deleted, fallback to defaults
        brandsList = getDefaultBrands();
        
        // Update all existing autocomplete instances
        Object.keys(brandAutocompleteInstances).forEach(applianceId => {
          const instance = brandAutocompleteInstances[applianceId];
          if (instance && typeof instance.updateOptions === 'function') {
            instance.updateOptions(brandsList);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error loading brands from Firebase:', error);
    // Fallback to default brands
    brandsList = getDefaultBrands();
  }
}

/**
 * Get default list of 30 biggest appliance brands
 */
function getDefaultBrands() {
  return [
    'Bosch',
    'Samsung',
    'LG',
    'Whirlpool',
    'Hotpoint',
    'Beko',
    'Indesit',
    'AEG',
    'Zanussi',
    'Miele',
    'Electrolux',
    'Panasonic',
    'Sharp',
    'Haier',
    'Candy',
    'Hoover',
    'Siemens',
    'Neff',
    'Gorenje',
    'Smeg',
    'Fisher & Paykel',
    'Hisense',
    'TCL',
    'Hitachi',
    'Daewoo',
    'Frigidaire',
    'Kenmore',
    'Maytag',
    'KitchenAid',
    'GE Appliances'
  ].sort();
}

/**
 * Seed default brands to Firebase (one-time operation)
 */
async function seedDefaultBrandsToFirebase() {
  try {
    if (typeof database === 'undefined') {
      return;
    }

    // Check if Firebase Auth user exists, try to sign in anonymously if needed
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
      } catch (error) {
        console.warn('Could not sign in anonymously:', error);
      }
    }

    const brandsRef = database.ref('brands');
    const snapshot = await brandsRef.once('value');

    // Only seed if database is empty
    if (!snapshot.exists()) {
      const defaultBrands = getDefaultBrands();
      const brandsData = {};
      
      defaultBrands.forEach((brand, index) => {
        brandsData[`brand_${index + 1}`] = {
          name: brand,
          createdAt: Date.now(),
          order: index + 1
        };
      });

      await brandsRef.set(brandsData);
      console.log(`Seeded ${defaultBrands.length} default brands to Firebase`);
    }
  } catch (error) {
    console.error('Error seeding brands to Firebase:', error);
    // Non-critical error, continue with default brands
  }
}

/**
 * Initialize brand autocomplete for a specific appliance
 */
function initializeBrandAutocomplete(applianceId) {
  const container = document.getElementById(`make-${applianceId}-container`);
  if (!container) {
    console.warn(`Container not found for appliance ${applianceId}`);
    return;
  }

  // Destroy existing instance if any
  if (brandAutocompleteInstances[applianceId]) {
    brandAutocompleteInstances[applianceId].destroy();
  }

  // Create autocomplete instance
  if (typeof autocomplete === 'undefined') {
    console.error('Autocomplete service not available');
    return;
  }

  try {
    const instance = autocomplete.create({
      container: container,
      inputId: `make-${applianceId}`,
      inputName: `make-${applianceId}`,
      options: brandsList,
      placeholder: 'Type to search brands (e.g., Bosch, Samsung, LG)',
      allowOther: true,
      required: false,
      onSelect: (selectedBrand) => {
        console.log(`Brand selected for appliance ${applianceId}:`, selectedBrand);
        // Update notes if needed
        updateNotes();
      },
      onOtherSelect: (customBrand) => {
        console.log(`Custom brand entered for appliance ${applianceId}:`, customBrand);
        // Update notes if needed
        updateNotes();
      }
    });

    brandAutocompleteInstances[applianceId] = instance;
  } catch (error) {
    console.error(`Error initializing brand autocomplete for appliance ${applianceId}:`, error);
  }
}

/**
 * Initialize appliance type autocomplete for a specific appliance
 */
function initializeApplianceTypeAutocomplete(applianceId) {
  const container = document.getElementById(`type-${applianceId}-container`);
  if (!container) {
    console.warn(`Container not found for appliance type ${applianceId}`);
    return;
  }

  // Destroy existing instance if any
  if (applianceTypeAutocompleteInstances[applianceId]) {
    applianceTypeAutocompleteInstances[applianceId].destroy();
  }

  // Create autocomplete instance
  if (typeof autocomplete === 'undefined') {
    console.error('Autocomplete service not available');
    return;
  }

  try {
    const instance = autocomplete.create({
      container: container,
      inputId: `type-${applianceId}`,
      inputName: `type-${applianceId}`,
      options: applianceTypesList,
      placeholder: 'Type to search appliance types (e.g., Washing Machine, TV)',
      allowOther: false, // "Other" is already in the list
      required: true,
      onSelect: (selectedType) => {
        console.log(`Appliance type selected for appliance ${applianceId}:`, selectedType);
        // Update notes if needed
        updateNotes();
        // Validate form
        validateForm();
      }
    });

    applianceTypeAutocompleteInstances[applianceId] = instance;
  } catch (error) {
    console.error(`Error initializing appliance type autocomplete for appliance ${applianceId}:`, error);
  }
}

/**
 * Validate a single field
 */
function validateField(field) {
  const value = field.value.trim();
  const fieldId = field.id || field.name;
  const errorSpan = document.getElementById(`${fieldId}-error`);

  let isValid = true;
  let errorMessage = '';

  // Required field validation
  if (field.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = 'This field is required';
  }

  // Email validation
  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }
  }

  // Phone validation
  if (field.id === 'phoneNumbers' && value) {
    // Accept various phone formats
    const cleanPhone = value.replace(/[\s\-()]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }
  }

  // Account number validation (exactly 8 digits)
  if (field.id === 'accountNumber' && value) {
    if (!/^\d{8}$/.test(value)) {
      isValid = false;
      errorMessage = 'Account number must be exactly 8 digits';
    }
  }

  // Sort code validation (exactly 6 digits, no hyphens)
  if (field.id === 'sortCode' && value) {
    if (!/^\d{6}$/.test(value)) {
      isValid = false;
      errorMessage = 'Sort code must be exactly 6 digits (no hyphens)';
    }
  }

  // Update field UI
  if (isValid) {
    field.classList.remove('error');
    if (errorSpan) {
      errorSpan.textContent = '';
      errorSpan.classList.remove('visible');
    }
  } else {
    field.classList.add('error');
    if (errorSpan) {
      errorSpan.textContent = errorMessage;
      errorSpan.classList.add('visible');
    }
  }

  return isValid;
}

/**
 * Validate entire form
 */
function validateForm() {
  let isValid = true;

  // Validate static/hardcoded contact fields
  const requiredFields = ['name', 'phoneNumbers', 'address', 'postcode', 'sortCode', 'accountNumber', 'ddDate'];
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field && !validateField(field)) {
      isValid = false;
    }
  });

  // Validate dynamic fields (if form renderer is available)
  if (typeof formRenderer !== 'undefined' && typeof formValidator !== 'undefined') {
    try {
      // Note: formValidator.validateAllFields() is async, but we'll do a basic check here
      const dynamicFields = document.querySelectorAll('[data-field-id] input[required], [data-field-id] select[required], [data-field-id] textarea[required]');
      dynamicFields.forEach(field => {
        if (!field.value || (field.type === 'checkbox' && !field.checked)) {
          isValid = false;
          const errorSpan = document.getElementById(`${field.name}-error`);
          if (errorSpan) {
            errorSpan.textContent = 'This field is required';
            errorSpan.style.display = 'block';
          }
        }
      });
    } catch (error) {
      console.warn('Error validating dynamic fields:', error);
    }
  }

  // Validate appliances
  const appliances = elements.appliancesList.querySelectorAll('.appliance-entry');
  appliances.forEach((appliance) => {
    // Get the appliance ID from data attribute
    const applianceId = appliance.getAttribute('data-appliance-id');
    
    // Check required fields - get type from autocomplete instance if available
    let typeValue = '';
    if (applianceTypeAutocompleteInstances[applianceId]) {
      typeValue = applianceTypeAutocompleteInstances[applianceId].getValue() || '';
    } else {
      // Fallback to direct field value
      const typeField = document.querySelector(`[name="type-${applianceId}"]`);
      typeValue = typeField?.value || '';
    }

    // Only type is required now
    if (!typeValue) {
      isValid = false;
      // Show error message
      const typeErrorSpan = document.getElementById(`type-${applianceId}-error`);
      if (typeErrorSpan) {
        typeErrorSpan.textContent = 'Appliance type is required';
        typeErrorSpan.style.display = 'block';
      }
    } else {
      // Clear error if valid
      const typeErrorSpan = document.getElementById(`type-${applianceId}-error`);
      if (typeErrorSpan) {
        typeErrorSpan.style.display = 'none';
      }
    }
  });

  // Validate boiler if checkbox is checked
  if (elements.addBoilerCheckbox.checked) {
    const boilerPlan = document.querySelector('input[name="boilerPlan"]:checked');
    if (!boilerPlan) {
      isValid = false;
    }
  }

  // Update submit button state
  elements.submitBtn.disabled = !isValid;

  return isValid;
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
  e.preventDefault();

  // Check authentication before submission
  if (typeof checkAuth === 'function') {
    const authenticated = await checkAuth('login.html');
    if (!authenticated) {
      return; // Redirected to login
    }
  }

  // Final validation
  if (!validateForm()) {
    showMessage('Please fill in all required fields correctly.', 'error');
    return;
  }

  // Show loading state
  elements.submitBtn.disabled = true;
  elements.submitBtnText.textContent = 'Submitting...';
  elements.submitBtnSpinner.style.display = 'inline-block';

  try {
    // Collect form data
    const formData = collectFormData();
    
    // Add agent information if authenticated
    if (typeof getCurrentUser === 'function') {
      let user;
      // Handle both sync (auth-db.js) and async (auth.js) versions
      try {
        const userResult = getCurrentUser();
        if (userResult instanceof Promise) {
          user = await userResult;
        } else {
          user = userResult;
        }
        if (user) {
          formData.agentId = user.uid;
          formData.agentEmail = user.email || user.username;
        }
      } catch (error) {
        console.warn('Error getting current user:', error);
      }
    }

    // Submit to Firebase
    await submitToFirebase(formData);

    // Show success message
    showMessage('Thank you! Your application has been submitted successfully. We will contact you soon to confirm your cover.', 'success');

    // Reset form
    setTimeout(() => {
      resetForm();
    }, 3000);

  } catch (error) {
    console.error('Submission error:', error);
    showMessage('There was an error submitting your application. Please try again or contact us directly.', 'error');

    // Reset button state
    elements.submitBtn.disabled = false;
    elements.submitBtnText.textContent = 'Submit Application';
    elements.submitBtnSpinner.style.display = 'none';
  }
}

/**
 * Collect all form data in CSV format
 */
function collectFormData() {
  // Generate plan number (format: NDACXXXXAPP)
  const planNumber = 'NDAC' + Math.random().toString().substr(2, 4) + 'APP';
  
  // Determine plan type
  let planType = 'Appliance';
  if (elements.addBoilerCheckbox.checked) {
    const boilerRadio = document.querySelector('input[name="boilerPlan"]:checked');
    if (boilerRadio) {
      planType = 'Appliance + Boiler';
    }
  }

  // Format DD Date
  const ddDateValue = document.getElementById('ddDate')?.value;
  const ddDate = ddDateValue ? `${ddDateValue}/${new Date().getMonth() + 1}/${new Date().getFullYear()}` : '';

  // Collect static/hardcoded fields (for backward compatibility)
  const data = {
    // CSV Column Order
    'Plan number': planNumber,
    'Phone Numbers': document.getElementById('phoneNumbers')?.value.trim() || '',
    'Name': document.getElementById('name')?.value.trim() || '',
    'Adress': document.getElementById('adress')?.value.trim() || '',
    'City': document.getElementById('city')?.value.trim() || '',
    'County': document.getElementById('county')?.value.trim() || '',
    'Postcode': document.getElementById('postcode')?.value.trim().toUpperCase() || '',
    'Email': document.getElementById('email')?.value.trim() || '',
    'Plan': planType,
    'Total Cost': parseFloat(elements.totalCostInput.value) || 0,
    'Sort Code': document.getElementById('sortCode')?.value.trim() || '',
    'Account number': document.getElementById('accountNumber')?.value.trim() || '',
    'DD Date': ddDate,
    'Notes - e.g. whats covered': document.getElementById('notes')?.value.trim() || '',
    
    // Additional metadata for Firebase
    'timestamp': Date.now(),
    'submittedAt': new Date().toISOString(),
    'status': 'pending'
  };

  // Collect dynamic form fields (if form renderer is available)
  if (typeof formRenderer !== 'undefined' && formRenderer.getAllFieldValues) {
    try {
      const dynamicFields = formRenderer.getAllFieldValues();
      // Merge dynamic fields into data (dynamic fields take precedence if name conflicts)
      Object.assign(data, dynamicFields);
      data.allFields = { ...data, ...dynamicFields };
    } catch (error) {
      console.warn('Error collecting dynamic field values:', error);
    }
  }

  // Also collect detailed appliance data for reference
  const appliances = [];
  const applianceEntries = elements.appliancesList.querySelectorAll('.appliance-entry');
  applianceEntries.forEach((appliance) => {
    // Get the appliance ID from data attribute
    const applianceId = appliance.getAttribute('data-appliance-id');
    
    // Get brand value from autocomplete instance if available
    let makeValue = '';
    if (brandAutocompleteInstances[applianceId]) {
      makeValue = brandAutocompleteInstances[applianceId].getValue() || '';
    } else {
      // Fallback to direct input value
      const makeInput = document.querySelector(`[name="make-${applianceId}"]`);
      makeValue = makeInput?.value.trim() || '';
    }
    
    // Get appliance type value from autocomplete instance if available
    let typeValue = '';
    if (applianceTypeAutocompleteInstances[applianceId]) {
      typeValue = applianceTypeAutocompleteInstances[applianceId].getValue() || '';
    } else {
      // Fallback to direct select/input value
      const typeField = document.querySelector(`[name="type-${applianceId}"]`);
      typeValue = typeField?.value || '';
    }
    
    appliances.push({
      type: typeValue,
      make: makeValue,
      model: document.querySelector(`[name="model-${applianceId}"]`)?.value.trim() || '',
      age: document.querySelector(`[name="age-${applianceId}"]`)?.value || '',
      monthlyCost: parseFloat(document.getElementById(`cost-${applianceId}`)?.value) || PRICE_PER_APPLIANCE
    });
  });
  
  data.appliances = appliances;

  return data;
}

/**
 * Pre-fill form fields with CRM data
 */
function prefillFormFields() {
  try {
    const prefillDataStr = localStorage.getItem('crm_prefill_data');
    if (!prefillDataStr) {
      console.log('No prefill data found');
      return;
    }

    const prefillData = JSON.parse(prefillDataStr);
    
    // Pre-fill contact details
    if (prefillData.contact) {
      const nameInput = document.getElementById('name');
      if (nameInput && prefillData.contact.name) {
        nameInput.value = prefillData.contact.name;
      }

      const emailInput = document.getElementById('email');
      if (emailInput && prefillData.contact.email) {
        emailInput.value = prefillData.contact.email;
      }

      const phoneInput = document.getElementById('phoneNumbers');
      if (phoneInput && prefillData.contact.phone) {
        phoneInput.value = prefillData.contact.phone;
      }

      const addressInput = document.getElementById('adress');
      if (addressInput && prefillData.contact.address) {
        addressInput.value = prefillData.contact.address;
      }

      const postcodeInput = document.getElementById('postcode');
      if (postcodeInput && prefillData.contact.postcode) {
        postcodeInput.value = prefillData.contact.postcode;
      }
    }

    // Pre-fill appliances
    if (prefillData.appliances && Array.isArray(prefillData.appliances) && prefillData.appliances.length > 0) {
      // Remove initial appliance if we have prefill appliances
      if (applianceCount > 0) {
        const initialAppliance = document.querySelector('.appliance-entry');
        if (initialAppliance) {
          removeAppliance(1);
        }
      }

      // Add appliances from prefill data
      prefillData.appliances.forEach((appliance, index) => {
        if (index > 0) {
          addAppliance();
        }

        const applianceId = index + 1;
        
        // Set appliance type
        const typeField = document.querySelector(`[name="type-${applianceId}"]`);
        if (typeField && appliance.type) {
          typeField.value = appliance.type;
          // Trigger change event for autocomplete if needed
          typeField.dispatchEvent(new Event('change'));
        }

        // Set make/brand
        const makeField = document.querySelector(`[name="make-${applianceId}"]`);
        if (makeField && appliance.make) {
          makeField.value = appliance.make;
          makeField.dispatchEvent(new Event('change'));
        }

        // Set model
        const modelField = document.querySelector(`[name="model-${applianceId}"]`);
        if (modelField && appliance.model) {
          modelField.value = appliance.model;
        }

        // Set age
        const ageField = document.querySelector(`[name="age-${applianceId}"]`);
        if (ageField && appliance.age) {
          ageField.value = appliance.age;
        }
      });

      // Recalculate costs
      calculateTotal();
    }

    // Pre-fill payment details
    if (prefillData.payment) {
      const sortCodeInput = document.getElementById('sortCode');
      if (sortCodeInput && prefillData.payment.sortCode) {
        sortCodeInput.value = prefillData.payment.sortCode;
      }

      const accountNumberInput = document.getElementById('accountNumber');
      if (accountNumberInput && prefillData.payment.accountNumber) {
        accountNumberInput.value = prefillData.payment.accountNumber;
      }

      // Parse DD date if available
      if (prefillData.payment.ddDate) {
        const ddDateMatch = prefillData.payment.ddDate.match(/(\d+)\/(\d+)\/(\d+)/);
        if (ddDateMatch) {
          const ddDateInput = document.getElementById('ddDate');
          if (ddDateInput) {
            ddDateInput.value = ddDateMatch[1]; // Day only
          }
        }
      }
    }

    // Pre-fill notes
    if (prefillData.notes) {
      const notesInput = document.getElementById('notes');
      if (notesInput) {
        notesInput.value = prefillData.notes;
      }
    }

    // Store leadId for status update after submission
    if (prefillData.leadId) {
      sessionStorage.setItem('crm_lead_id', prefillData.leadId);
    }

    // Clear localStorage after prefill
    localStorage.removeItem('crm_prefill_data');

    // Show message
    if (typeof showMessage === 'function') {
      showMessage('Form pre-filled with customer data. Please review and edit as needed.', 'info');
    }

    console.log('Form pre-filled with CRM data');
  } catch (error) {
    console.error('Error pre-filling form:', error);
    if (typeof showMessage === 'function') {
      showMessage('Error pre-filling form data. Please enter manually.', 'error');
    }
  }
}

/**
 * Submit data to Firebase with one-to-many appliance relationship
 */
async function submitToFirebase(data) {
  // Check for duplicate override
  if (window.duplicateWarningInstance && window.duplicateWarningInstance.getOverrideState()) {
    // User has overridden duplicate warning, proceed
    console.log('Proceeding with submission despite duplicate warning');
  } else if (window.duplicateWarningInstance && window.duplicateWarningInstance.isVisible) {
    // Duplicate warning is visible but not overridden - prevent submission
    showMessage('Please review the duplicate warning above. Click "Continue Anyway" if you want to proceed.', 'error');
    return;
  }
  // Structure data for sales database (backward compatible structure)
  const salesData = {
    contact: {
      name: data['Name'] || data.allFields?.['Name'] || '',
      phone: data['Phone Numbers'] || data.allFields?.['Phone Numbers'] || '',
      email: data['Email'] || data.allFields?.['Email'] || '',
      address: data['Adress'] || data.allFields?.['Adress'] || '',
      postcode: data['Postcode'] || data.allFields?.['Postcode'] || ''
    },
    appliances: data.appliances || [],
    plan: {
      number: data['Plan number'] || '',
      type: data['Plan'] || '',
      totalCost: data['Total Cost'] || 0
    },
    payment: {
      sortCode: data['Sort Code'] || data.allFields?.['Sort Code'] || '',
      accountNumber: data['Account number'] || data.allFields?.['Account number'] || '',
      ddDate: data['DD Date'] || data.allFields?.['DD Date'] || ''
    },
    notes: data['Notes - e.g. whats covered'] || data.allFields?.['Notes - e.g. whats covered'] || '',
    agentId: data.agentId || '',
    agentEmail: data.agentEmail || '',
    timestamp: data.timestamp || Date.now(),
    submittedAt: data.submittedAt || new Date().toISOString()
  };

  // Add all dynamic fields to a separate object for admin viewing
  if (data.allFields) {
    salesData.dynamicFields = {};
    Object.keys(data.allFields).forEach(key => {
      // Exclude fields already in structured format
      if (!['Name', 'Phone Numbers', 'Email', 'Adress', 'Postcode', 'Sort Code', 
            'Account number', 'DD Date', 'Notes - e.g. whats covered', 
            'Plan number', 'Plan', 'Total Cost', 'appliances', 'timestamp', 
            'submittedAt', 'status'].includes(key)) {
        salesData.dynamicFields[key] = data.allFields[key];
      }
    });
  }
  
  // Validate required fields for database rules
  if (!salesData.contact || !salesData.appliances || !salesData.timestamp) {
    throw new Error('Missing required fields for submission');
  }
  
  // Extract appliances for one-to-many relationship
  const appliances = salesData.appliances || [];
  
  // Remove appliances array from salesData (will be stored separately)
  // Keep it for backward compatibility during migration
  const appliancesArray = [...appliances]; // Keep copy for backward compat
  
  // Initialize applianceIds array for relationship
  salesData.applianceIds = [];
  salesData.version = 2; // Schema version for normalized structure
  salesData.createdAt = new Date().toISOString();
  salesData.updatedAt = new Date().toISOString();
  
  // Submit to sales database (admin-only read, authenticated write)
  const saleRef = firebase.database().ref('sales').push();
  const saleId = saleRef.key;
  
  // Set sale data (without appliances, they'll be added separately)
  await saleRef.set(salesData);
  
  // Update CRM record status if this came from CRM prefill
  const crmLeadId = sessionStorage.getItem('crm_lead_id');
  if (crmLeadId) {
    try {
      const leadRef = firebase.database().ref(`sales/${crmLeadId}`);
      await leadRef.update({
        leadStatus: 'converted',
        updatedAt: new Date().toISOString()
      });
      sessionStorage.removeItem('crm_lead_id');
      console.log('CRM lead status updated to converted');
    } catch (error) {
      console.warn('Error updating CRM lead status:', error);
      // Don't fail submission if CRM update fails
    }
  }

  // Add appliances using one-to-many relationship manager
  if (appliances.length > 0 && typeof ApplianceRelationshipManager !== 'undefined') {
    try {
      const relationshipManager = new ApplianceRelationshipManager(firebase.database());
      const applianceIds = await relationshipManager.addAppliancesToSale(saleId, appliances);
      
      // Update sale with applianceIds (already done in addAppliancesToSale, but ensure it's set)
      await saleRef.update({
        applianceIds: applianceIds,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Added ${applianceIds.length} appliances to sale ${saleId}`);
    } catch (error) {
      console.error('Error adding appliances with relationship manager:', error);
      // Fallback: add appliances array directly for backward compatibility
      await saleRef.update({
        appliances: appliancesArray,
        applianceIds: [],
        updatedAt: new Date().toISOString()
      });
    }
  } else {
    // Fallback: add appliances array directly if relationship manager not available
    await saleRef.update({
      appliances: appliancesArray,
      applianceIds: [],
      updatedAt: new Date().toISOString()
    });
  }
  
  // Also keep appliances array for backward compatibility during migration
  await saleRef.update({
    appliances: appliancesArray // Keep for backward compatibility
  });
  
  return saleRef;
}

/**
 * Show message to user
 */
function showMessage(message, type) {
  elements.messageContent.textContent = message;
  elements.messageContent.className = `message ${type}`;
  elements.messageContainer.style.display = 'block';

  // Auto-hide error messages after 5 seconds
  if (type === 'error') {
    setTimeout(() => {
      elements.messageContainer.style.display = 'none';
    }, 5000);
  }
}

/**
 * Reset form to initial state
 */
function resetForm() {
  // Reset form
  elements.form.reset();

  // Clear appliances
  applianceCount = 0;
  elements.appliancesList.innerHTML = '';

  // Hide boiler options
  elements.boilerOptions.style.display = 'none';

  // Hide messages
  elements.messageContainer.style.display = 'none';

  // Reset button state
  elements.submitBtn.disabled = true;
  elements.submitBtnText.textContent = 'Submit Application';
  elements.submitBtnSpinner.style.display = 'none';

  // Re-initialize
  addAppliance();
  calculateTotal();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Setup duplicate detection
 */
function setupDuplicateDetection() {
  // Check if services are available
  if (typeof duplicateDetectionService === 'undefined' || typeof DuplicateWarning === 'undefined') {
    console.warn('Duplicate detection services not available');
    return;
  }

  // Initialize duplicate detection service with database
  if (typeof database !== 'undefined') {
    duplicateDetectionService.initialize(database);
  }

  // Create duplicate warning component
  const warningContainer = document.getElementById('duplicateWarningContainer');
  if (!warningContainer) return;

  const duplicateWarning = new DuplicateWarning(warningContainer, {
    onOverride: (matches, confidence) => {
      // User chose to proceed with duplicate
      console.log('User overrode duplicate warning', { matches, confidence });
      if (typeof enhancedLogger !== 'undefined') {
        enhancedLogger.logFieldChanges('duplicate_override', null, null, null, {
          matches: matches.length,
          confidence
        });
      }
    },
    onDismiss: () => {
      // User dismissed warning
      console.log('User dismissed duplicate warning');
    }
  });

  // Debounce function
  let duplicateCheckTimer = null;
  const DEBOUNCE_DELAY = 500; // 500ms debounce

  /**
   * Check for duplicates
   */
  async function checkForDuplicates() {
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phoneNumbers');
    const emailInput = document.getElementById('email');

    if (!nameInput && !phoneInput && !emailInput) return;

    const customerData = {
      name: nameInput?.value.trim() || '',
      phone: phoneInput?.value.trim() || '',
      email: emailInput?.value.trim() || ''
    };

    // Only check if we have at least one field with meaningful data
    if (!customerData.name && !customerData.phone && !customerData.email) {
      duplicateWarning.hide();
      return;
    }

    // Minimum length checks
    if (customerData.phone && customerData.phone.length < 10) {
      duplicateWarning.hide();
      return;
    }
    if (customerData.email && !customerData.email.includes('@')) {
      duplicateWarning.hide();
      return;
    }
    if (customerData.name && customerData.name.length < 2) {
      duplicateWarning.hide();
      return;
    }

    try {
      const result = await duplicateDetectionService.checkDuplicate(customerData);
      
      if (result.hasDuplicate) {
        duplicateWarning.render(result.matches, result.confidence);
      } else {
        duplicateWarning.hide();
      }
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      duplicateWarning.hide();
    }
  }

  // Add event listeners to name, phone, and email inputs
  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phoneNumbers');
  const emailInput = document.getElementById('email');

  [nameInput, phoneInput, emailInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        // Clear existing timer
        if (duplicateCheckTimer) {
          clearTimeout(duplicateCheckTimer);
        }

        // Set new timer
        duplicateCheckTimer = setTimeout(() => {
          checkForDuplicates();
        }, DEBOUNCE_DELAY);
      });

      input.addEventListener('blur', () => {
        // Check on blur (immediate, no debounce)
        if (duplicateCheckTimer) {
          clearTimeout(duplicateCheckTimer);
        }
        checkForDuplicates();
      });
    }
  });

  // Store duplicate warning instance globally for form submission check
  window.duplicateWarningInstance = duplicateWarning;
}

/**
 * Setup smart input formatting
 */
function setupSmartInputFormatting() {
  // Check if input formatter is available
  if (typeof inputFormatter === 'undefined') {
    console.warn('Input formatter not available');
    return;
  }

  // Attach formatter to sort code input
  const sortCodeInput = document.getElementById('sortCode');
  if (sortCodeInput) {
    inputFormatter.attachFormatter(sortCodeInput, 'sortCode');
  }

  // Attach formatter to account number input
  const accountNumberInput = document.getElementById('accountNumber');
  if (accountNumberInput) {
    inputFormatter.attachFormatter(accountNumberInput, 'accountNumber');
  }

  // Optional: Attach formatter to phone number input
  const phoneInput = document.getElementById('phoneNumbers');
  if (phoneInput) {
    inputFormatter.attachFormatter(phoneInput, 'phoneNumber');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
