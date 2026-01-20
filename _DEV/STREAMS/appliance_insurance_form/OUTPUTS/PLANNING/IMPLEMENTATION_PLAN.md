---
title: "Implementation Plan - Simple Web Form"
created: 2026-01-08
workflow: PLANNING
category: planning_output
---

# Implementation Plan - Appliance Insurance Form

**Stream:** `appliance_insurance_form`  
**Type:** Simple Single-Page Data Collection Form  
**Created:** 2026-01-08

---

## 🎯 **Simplified Scope**

**What This IS:**
- ✅ Single-page HTML form
- ✅ Collect contact details (name, email, phone, address)
- ✅ Collect appliance details (type, make, model, age, cover limit)
- ✅ Optional boiler plan selection
- ✅ Real-time cost calculation (informational only)
- ✅ Submit data to Firebase Realtime Database
- ✅ Simple success/error messages

**What This is NOT:**
- ❌ Multi-page form or wizard
- ❌ Actual payment processing
- ❌ Direct debit setup/authorization
- ❌ Legal mandate agreements
- ❌ Reference number generation system
- ❌ Production-ready payment system

**Result:** Simple data collection form (~800 LOC, 3 files, 4-8 hours)

---

## 📦 **Deliverables (3 Files)**

| File | LOC | Purpose |
|------|-----|---------|
| `appliance_form.html` | ~350 | Single-page form (all sections in one page) |
| `styles.css` | ~250 | Responsive styles (mobile-first, simple) |
| `app.js` | ~200 | Form logic, validation, Firebase submit |
| **Total** | **~800** | Simple, clean, functional |

---

## 📋 **Implementation Plan**

### **Phase 1: HTML Structure** (1-2 hours)

#### **File: `appliance_form.html`** (~350 LOC)

**Sections:**
1. **Header** - Title, brief description
2. **Contact Details** - Name, Email, Phone, Address (simple)
3. **Appliances** - Dynamic list (type, make, model, age, cover limit)
4. **Boiler Add-On** (Optional) - Checkbox + 3 radio options
5. **Cost Summary** - Display total monthly cost (informational)
6. **Submit Button** - Simple submit, loading state
7. **Firebase Config** - Inline `<script>` with Firebase init

**Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appliance Insurance Form</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Appliance Insurance Inquiry</h1>
    <p>Fill out the form below to get information about appliance insurance coverage.</p>
    
    <form id="insuranceForm">
      <!-- Contact Details -->
      <section class="form-section">
        <h2>Contact Details</h2>
        <input type="text" name="fullName" required placeholder="Full Name">
        <input type="email" name="email" required placeholder="Email">
        <input type="tel" name="phone" required placeholder="Phone (07...)">
        <input type="text" name="address" required placeholder="Address">
        <input type="text" name="postcode" required placeholder="Postcode">
      </section>
      
      <!-- Appliances -->
      <section class="form-section">
        <h2>Appliances</h2>
        <div id="appliancesList">
          <!-- Dynamic appliance entries -->
        </div>
        <button type="button" id="addAppliance">+ Add Appliance</button>
      </section>
      
      <!-- Boiler (Optional) -->
      <section class="form-section">
        <label>
          <input type="checkbox" id="addBoiler"> Add Boiler Cover
        </label>
        <div id="boilerOptions" style="display: none;">
          <label><input type="radio" name="boilerPlan" value="14.99"> Basic - £14.99/mo</label>
          <label><input type="radio" name="boilerPlan" value="19.99"> Plus - £19.99/mo</label>
          <label><input type="radio" name="boilerPlan" value="24.99"> Premium - £24.99/mo</label>
        </div>
      </section>
      
      <!-- Cost Summary -->
      <section class="form-section cost-summary">
        <h3>Estimated Monthly Cost</h3>
        <p class="total-cost">£<span id="totalCost">0.00</span>/month</p>
      </section>
      
      <!-- Submit -->
      <button type="submit" id="submitBtn">Submit Inquiry</button>
      <div id="message" class="message"></div>
    </form>
  </div>
  
  <!-- Firebase SDK (CDN) -->
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js"></script>
  
  <!-- Firebase Config (inline) -->
  <script>
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT.firebaseapp.com",
      databaseURL: "https://YOUR_PROJECT.firebaseio.com",
      projectId: "YOUR_PROJECT_ID"
    };
    firebase.initializeApp(firebaseConfig);
  </script>
  
  <!-- App Logic -->
  <script src="app.js"></script>
</body>
</html>
```

**Tasks:**
- [ ] Create basic HTML structure
- [ ] Add all form sections (contact, appliances, boiler, cost)
- [ ] Include Firebase SDK via CDN
- [ ] Add inline Firebase config
- [ ] Test HTML renders correctly

---

### **Phase 2: CSS Styling** (1-2 hours)

#### **File: `styles.css`** (~250 LOC)

**Styles:**
1. **Reset & Base** - Basic reset, box-sizing, font family
2. **Layout** - Container (max-width 800px, centered, padding)
3. **Form Sections** - Spacing, borders, cards
4. **Inputs** - Consistent styling (height 44px, border, focus states)
5. **Buttons** - Primary (blue), secondary (green for add), danger (red for remove)
6. **Responsive** - Mobile-first (320px+), tablet (768px+), desktop (1024px+)
7. **Messages** - Success (green), error (red), loading spinner

**Key Styles:**
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f9fafb;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 32px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

input, select {
  width: 100%;
  height: 44px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 12px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

button[type="submit"] {
  width: 100%;
  background: #2563eb;
  color: white;
  height: 48px;
  font-weight: 600;
}

button[type="submit"]:hover {
  background: #1d4ed8;
}

.message {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  display: none;
}

.message.success {
  background: #10b981;
  color: white;
  display: block;
}

.message.error {
  background: #ef4444;
  color: white;
  display: block;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 20px;
  }
  .form-section {
    padding: 16px;
  }
}
```

**Tasks:**
- [ ] Create CSS file
- [ ] Add base styles (reset, layout)
- [ ] Style form sections and inputs
- [ ] Add button styles (primary, secondary, danger)
- [ ] Add message styles (success, error)
- [ ] Test responsive design (mobile, tablet, desktop)

---

### **Phase 3: JavaScript Logic** (2-4 hours)

#### **File: `app.js`** (~200 LOC)

**Functions:**
1. **initializeForm()** - Set up event listeners, add first appliance
2. **addAppliance()** - Add new appliance entry to list
3. **removeAppliance()** - Remove appliance entry (if > 1)
4. **toggleBoiler()** - Show/hide boiler options
5. **calculateTotal()** - Calculate and display total cost
6. **validateForm()** - Basic validation (required fields, email format)
7. **submitForm()** - Submit to Firebase, show success/error

**Key Logic:**
```javascript
// Global state
let appliances = [];
let applianceCount = 0;

// Initialize
function initializeForm() {
  addAppliance(); // Add first appliance
  
  document.getElementById('addAppliance').addEventListener('click', addAppliance);
  document.getElementById('addBoiler').addEventListener('change', toggleBoiler);
  document.getElementById('insuranceForm').addEventListener('submit', submitForm);
  document.getElementById('insuranceForm').addEventListener('input', calculateTotal);
}

// Add appliance entry
function addAppliance() {
  if (applianceCount >= 10) return;
  
  applianceCount++;
  const applianceHTML = `
    <div class="appliance-entry" data-id="${applianceCount}">
      <select name="type_${applianceCount}" required>
        <option value="">Select Type</option>
        <option value="washing_machine">Washing Machine</option>
        <option value="dryer">Dryer</option>
        <option value="dishwasher">Dishwasher</option>
        <option value="fridge">Fridge</option>
        <option value="oven">Oven</option>
      </select>
      <input type="text" name="make_${applianceCount}" placeholder="Make/Brand" required>
      <input type="text" name="model_${applianceCount}" placeholder="Model" required>
      <select name="age_${applianceCount}" required>
        <option value="">Age</option>
        <option value="<1">< 1 year</option>
        <option value="1-2">1-2 years</option>
        <option value="3-5">3-5 years</option>
        <option value="6-10">6-10 years</option>
        <option value="10+">10+ years</option>
      </select>
      <label>
        <input type="radio" name="cover_${applianceCount}" value="8.99" required> £500 (£8.99/mo)
        <input type="radio" name="cover_${applianceCount}" value="12.99" required> £800 (£12.99/mo)
      </label>
      ${applianceCount > 1 ? '<button type="button" class="remove-btn" onclick="removeAppliance(' + applianceCount + ')">Remove</button>' : ''}
    </div>
  `;
  document.getElementById('appliancesList').insertAdjacentHTML('beforeend', applianceHTML);
  calculateTotal();
}

// Remove appliance
function removeAppliance(id) {
  if (applianceCount <= 1) return;
  document.querySelector(`[data-id="${id}"]`).remove();
  applianceCount--;
  calculateTotal();
}

// Toggle boiler options
function toggleBoiler() {
  const boilerOptions = document.getElementById('boilerOptions');
  boilerOptions.style.display = this.checked ? 'block' : 'none';
  if (!this.checked) {
    document.querySelectorAll('input[name="boilerPlan"]').forEach(radio => radio.checked = false);
  }
  calculateTotal();
}

// Calculate total cost
function calculateTotal() {
  let total = 0;
  
  // Appliances
  document.querySelectorAll('input[type="radio"]:checked[name^="cover_"]').forEach(radio => {
    total += parseFloat(radio.value);
  });
  
  // Boiler
  const boilerRadio = document.querySelector('input[name="boilerPlan"]:checked');
  if (boilerRadio) {
    total += parseFloat(boilerRadio.value);
  }
  
  document.getElementById('totalCost').textContent = total.toFixed(2);
}

// Submit form
function submitForm(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const messageDiv = document.getElementById('message');
  
  // Show loading
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;
  
  // Collect form data
  const formData = new FormData(e.target);
  const data = {
    timestamp: Date.now(),
    contact: {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      postcode: formData.get('postcode')
    },
    appliances: [],
    boiler: {
      included: document.getElementById('addBoiler').checked,
      plan: formData.get('boilerPlan') || null
    },
    totalMonthlyCost: document.getElementById('totalCost').textContent
  };
  
  // Collect appliances
  for (let i = 1; i <= applianceCount; i++) {
    const type = formData.get(`type_${i}`);
    if (type) {
      data.appliances.push({
        type: type,
        make: formData.get(`make_${i}`),
        model: formData.get(`model_${i}`),
        age: formData.get(`age_${i}`),
        coverLimit: formData.get(`cover_${i}`)
      });
    }
  }
  
  // Submit to Firebase
  firebase.database().ref('inquiries').push(data)
    .then(() => {
      messageDiv.textContent = 'Form submitted successfully! We will contact you soon.';
      messageDiv.className = 'message success';
      submitBtn.textContent = 'Submit Inquiry';
      submitBtn.disabled = false;
      e.target.reset();
      applianceCount = 0;
      document.getElementById('appliancesList').innerHTML = '';
      initializeForm();
    })
    .catch(error => {
      messageDiv.textContent = 'Error submitting form. Please try again.';
      messageDiv.className = 'message error';
      submitBtn.textContent = 'Submit Inquiry';
      submitBtn.disabled = false;
      console.error('Firebase error:', error);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeForm);
```

**Tasks:**
- [ ] Create JavaScript file
- [ ] Implement dynamic appliance add/remove
- [ ] Implement boiler toggle
- [ ] Implement real-time cost calculation
- [ ] Implement form validation (basic)
- [ ] Implement Firebase submission
- [ ] Test all functionality

---

## 🧪 **Testing Checklist**

### **Functionality**
- [ ] Form loads correctly
- [ ] Can add appliances (up to 10)
- [ ] Can remove appliances (min 1)
- [ ] Boiler section shows/hides on checkbox
- [ ] Total cost calculates correctly
- [ ] Form submits to Firebase
- [ ] Success message displays
- [ ] Error message displays (test by breaking Firebase config)
- [ ] Form resets after successful submission

### **Validation**
- [ ] Required fields prevent submission if empty
- [ ] Email validation works
- [ ] Phone validation works (optional)

### **Responsive**
- [ ] Test on mobile (320px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1920px)
- [ ] Touch targets are 44px minimum
- [ ] No horizontal scrolling

### **Browser Compatibility**
- [ ] Chrome (desktop + mobile)
- [ ] Firefox
- [ ] Safari

---

## 🚀 **Deployment**

**Simple Deployment Options:**

1. **Firebase Hosting** (Recommended)
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login
   firebase login
   
   # Initialize
   firebase init hosting
   
   # Deploy
   firebase deploy --only hosting
   ```

2. **Netlify** (Drag & Drop)
   - Go to netlify.com
   - Drag 3 files to upload
   - Done!

3. **Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   ```

4. **GitHub Pages**
   - Push to GitHub repo
   - Enable Pages in settings
   - Select main branch
   - Done!

---

## 📊 **Firebase Setup**

**Database Structure:**
```
inquiries/
  ├─ {timestamp_1}/
  │   ├─ timestamp: 1704744000000
  │   ├─ contact: { fullName, email, phone, address, postcode }
  │   ├─ appliances: [ { type, make, model, age, coverLimit } ]
  │   ├─ boiler: { included, plan }
  │   └─ totalMonthlyCost: "32.98"
  └─ {timestamp_2}/
      └─ ...
```

**Security Rules** (Simple):
```json
{
  "rules": {
    "inquiries": {
      ".write": true,
      ".read": false
    }
  }
}
```

**Note:** For production, add validation and rate limiting.

---

## ⏱️ **Time Estimate**

| Phase | Time |
|-------|------|
| HTML Structure | 1-2 hours |
| CSS Styling | 1-2 hours |
| JavaScript Logic | 2-4 hours |
| Testing | 1 hour |
| **Total** | **5-9 hours** |

**Realistic:** ~6 hours for experienced developer, ~8 hours for intermediate

---

## ✅ **Success Criteria**

- [ ] Form is single page (no navigation)
- [ ] Collects contact details (5 fields)
- [ ] Collects appliances (dynamic, 1-10)
- [ ] Optional boiler section (checkbox + 3 options)
- [ ] Shows total cost (real-time calculation)
- [ ] Submits to Firebase successfully
- [ ] Shows success/error messages
- [ ] Works on mobile, tablet, desktop
- [ ] Clean, simple, professional look
- [ ] No payment processing (data collection only)

---

**Status:** ✅ PLANNING COMPLETE  
**Next Step:** IMPLEMENTATION (Execution Phase)  
**Ready to Build:** ✅ YES
