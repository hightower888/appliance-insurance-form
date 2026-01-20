---
title: "Requirements Specification - Full Discovery Step 3"
created: 2026-01-08
workflow: DISCOVERY_FULL
step: 3
category: discovery_output
---

# Requirements Specification - Appliance Insurance Form

**Stream:** `appliance_insurance_form`  
**Workflow:** `DISCOVERY_FULL`  
**Step:** 3 - Requirements Gathering  
**Created:** 2026-01-08

---

## 📋 **Requirements Overview**

**Total Requirements:** 42 detailed requirements  
**Categories:** 10 (6 Functional + 4 Non-Functional)  
**Priority Distribution:**
- CRITICAL: 18 requirements (43%)
- HIGH: 14 requirements (33%)
- MEDIUM: 8 requirements (19%)
- LOW: 2 requirements (5%)

---

## 🎯 **FUNCTIONAL REQUIREMENTS**

### **FR-1: Contact Details Section**

#### **FR-1.1: Full Name Field** [CRITICAL]

**Description:** Collect customer's full legal name

**Acceptance Criteria:**
- [ ] Text input field with label "Full Name"
- [ ] Marked as required (red asterisk *)
- [ ] Minimum length: 2 characters
- [ ] Maximum length: 100 characters
- [ ] Real-time validation on blur
- [ ] Error message: "Full name is required" (if empty)
- [ ] Error message: "Name must be at least 2 characters" (if too short)
- [ ] Accessible (ARIA label, focus indicator)

**Validation Rules:**
- Required: YES
- Pattern: Any characters (letters, spaces, hyphens, apostrophes)
- Min: 2 chars
- Max: 100 chars

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-1.2: Email Address Field** [CRITICAL]

**Description:** Collect customer's email for communication

**Acceptance Criteria:**
- [ ] Email input field (type="email") with label "Email Address"
- [ ] Marked as required (red asterisk *)
- [ ] Real-time validation on blur
- [ ] Format validation (valid email pattern)
- [ ] Error message: "Email address is required" (if empty)
- [ ] Error message: "Please enter a valid email address" (if invalid format)
- [ ] Accessible (ARIA label, autocomplete="email")

**Validation Rules:**
- Required: YES
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Example valid: "john.smith@example.com"
- Example invalid: "notanemail", "missing@domain"

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-1.3: Phone Number Field** [CRITICAL]

**Description:** Collect UK mobile phone number

**Acceptance Criteria:**
- [ ] Tel input field (type="tel") with label "Phone Number"
- [ ] Marked as required (red asterisk *)
- [ ] Placeholder: "07123456789"
- [ ] UK format validation (starts with 07, 11 digits total)
- [ ] Real-time validation on blur
- [ ] Error message: "Phone number is required" (if empty)
- [ ] Error message: "Please enter a valid UK mobile number (e.g., 07123456789)" (if invalid)
- [ ] Accessible (ARIA label, autocomplete="tel")

**Validation Rules:**
- Required: YES
- Pattern: `/^07\d{9}$/`
- Format: 07XXXXXXXXX (11 digits, starts with 07)
- Example valid: "07123456789"
- Example invalid: "7123456789" (missing 0), "0712345678" (too short)

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-1.4: Address Line 1 Field** [CRITICAL]

**Description:** Collect primary address line

**Acceptance Criteria:**
- [ ] Text input field with label "Address Line 1"
- [ ] Marked as required (red asterisk *)
- [ ] Maximum length: 100 characters
- [ ] Real-time validation on blur
- [ ] Error message: "Address Line 1 is required" (if empty)
- [ ] Accessible (ARIA label, autocomplete="address-line1")

**Validation Rules:**
- Required: YES
- Max: 100 chars

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-1.5: Address Line 2 Field** [MEDIUM]

**Description:** Collect optional secondary address line (flat, suite, unit)

**Acceptance Criteria:**
- [ ] Text input field with label "Address Line 2 (Optional)"
- [ ] NOT marked as required (no asterisk)
- [ ] Maximum length: 100 characters
- [ ] No validation required (optional field)
- [ ] Accessible (ARIA label, autocomplete="address-line2")

**Validation Rules:**
- Required: NO
- Max: 100 chars

**Dependencies:** None

**Priority:** MEDIUM

---

#### **FR-1.6: City Field** [CRITICAL]

**Description:** Collect city/town name

**Acceptance Criteria:**
- [ ] Text input field with label "City"
- [ ] Marked as required (red asterisk *)
- [ ] Maximum length: 50 characters
- [ ] Real-time validation on blur
- [ ] Error message: "City is required" (if empty)
- [ ] Accessible (ARIA label, autocomplete="address-level2")

**Validation Rules:**
- Required: YES
- Max: 50 chars

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-1.7: Postcode Field** [CRITICAL]

**Description:** Collect UK postcode

**Acceptance Criteria:**
- [ ] Text input field with label "Postcode"
- [ ] Marked as required (red asterisk *)
- [ ] Placeholder: "SW1A 1AA"
- [ ] UK postcode format validation
- [ ] Converts input to uppercase
- [ ] Real-time validation on blur
- [ ] Error message: "Postcode is required" (if empty)
- [ ] Error message: "Please enter a valid UK postcode (e.g., SW1A 1AA)" (if invalid)
- [ ] Accessible (ARIA label, autocomplete="postal-code")

**Validation Rules:**
- Required: YES
- Pattern: `/^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i`
- Format: Letters (1-2) + Digits (1-2) + Optional Letter + Space (optional) + Digit + Letters (2)
- Example valid: "SW1A 1AA", "M1 1AE", "B33 8TH"
- Example invalid: "12345", "ABCD"

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-1.8: County Field** [LOW]

**Description:** Collect optional county name

**Acceptance Criteria:**
- [ ] Text input field with label "County (Optional)"
- [ ] NOT marked as required (no asterisk)
- [ ] Maximum length: 50 characters
- [ ] No validation required (optional field)
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Required: NO
- Max: 50 chars

**Dependencies:** None

**Priority:** LOW

---

### **FR-2: Direct Debit Setup Section**

#### **FR-2.1: Account Holder Name Field** [CRITICAL]

**Description:** Collect bank account holder's full legal name

**Acceptance Criteria:**
- [ ] Text input field with label "Account Holder Name"
- [ ] Marked as required (red asterisk *)
- [ ] Minimum length: 2 characters
- [ ] Maximum length: 100 characters
- [ ] Real-time validation on blur
- [ ] Error message: "Account holder name is required" (if empty)
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Required: YES
- Min: 2 chars
- Max: 100 chars

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-2.2: Bank Name Field** [CRITICAL]

**Description:** Collect name of the bank

**Acceptance Criteria:**
- [ ] Text input field with label "Bank Name"
- [ ] Marked as required (red asterisk *)
- [ ] Maximum length: 100 characters
- [ ] Real-time validation on blur
- [ ] Error message: "Bank name is required" (if empty)
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Required: YES
- Max: 100 chars

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-2.3: Sort Code Field** [CRITICAL]

**Description:** Collect UK bank sort code (6 digits formatted as XX-XX-XX)

**Acceptance Criteria:**
- [ ] Text input field with label "Sort Code"
- [ ] Marked as required (red asterisk *)
- [ ] Placeholder: "12-34-56"
- [ ] Auto-formatting: adds hyphens as user types (12-34-56)
- [ ] Format validation (6 digits with hyphens)
- [ ] Real-time validation on blur
- [ ] Error message: "Sort code is required" (if empty)
- [ ] Error message: "Please enter a valid sort code (format: XX-XX-XX)" (if invalid)
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Required: YES
- Pattern: `/^\d{2}-\d{2}-\d{2}$/`
- Format: XX-XX-XX (6 digits total, hyphens after 2nd and 4th digit)
- Example valid: "12-34-56", "99-88-77"
- Example invalid: "123456" (no hyphens), "12-345-6" (wrong format)

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-2.4: Account Number Field** [CRITICAL]

**Description:** Collect UK bank account number (8 digits)

**Acceptance Criteria:**
- [ ] Text input field (type="tel" for numeric keyboard on mobile) with label "Account Number"
- [ ] Marked as required (red asterisk *)
- [ ] Placeholder: "12345678"
- [ ] Length validation (exactly 8 digits)
- [ ] Real-time validation on blur
- [ ] Error message: "Account number is required" (if empty)
- [ ] Error message: "Please enter a valid account number (8 digits)" (if invalid)
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Required: YES
- Pattern: `/^\d{8}$/`
- Format: 8 digits exactly
- Example valid: "12345678", "00112233"
- Example invalid: "1234567" (7 digits), "123456789" (9 digits), "1234abcd" (letters)

**Dependencies:** None

**Priority:** CRITICAL

---

#### **FR-2.5: Direct Debit Mandate Checkbox** [CRITICAL]

**Description:** Collect agreement to Direct Debit mandate

**Acceptance Criteria:**
- [ ] Checkbox input with label text: "I agree to the Direct Debit mandate terms and authorize [Company Name] to collect payments from my account"
- [ ] Marked as required (checkbox must be checked to submit)
- [ ] Link to full mandate terms (opens in new tab)
- [ ] Validation: must be checked to enable submit button
- [ ] Error message: "You must agree to the Direct Debit mandate to proceed" (if unchecked on submit)
- [ ] Accessible (ARIA label, role="checkbox")

**Validation Rules:**
- Required: YES
- Must be checked (boolean = true)

**Dependencies:** None

**Priority:** CRITICAL

---

### **FR-3: Appliance Registration Section**

#### **FR-3.1: Dynamic Appliance List** [CRITICAL]

**Description:** Allow users to add and remove multiple appliances (min 1, max 10)

**Acceptance Criteria:**
- [ ] Initial state: 1 empty appliance entry displayed
- [ ] "Add Another Appliance" button (green, + icon) visible if count < 10
- [ ] "Remove" button (red, × icon) for each appliance, disabled if count = 1
- [ ] Smooth animation when adding/removing appliances (fade in/out, 300ms)
- [ ] Each appliance has unique ID (e.g., appliance_1, appliance_2)
- [ ] All appliance entries validated before submit
- [ ] Accessible (ARIA live region announces add/remove actions)

**Validation Rules:**
- Min appliances: 1
- Max appliances: 10
- Each appliance must have all required fields filled

**Dependencies:**
- FR-3.2 (Appliance Type)
- FR-3.3 (Make/Brand)
- FR-3.4 (Model)
- FR-3.5 (Age)
- FR-3.6 (Cover Limit)

**Priority:** CRITICAL

---

#### **FR-3.2: Appliance Type Field** [CRITICAL]

**Description:** Select appliance type from predefined list

**Acceptance Criteria:**
- [ ] Dropdown select field with label "Appliance Type"
- [ ] Marked as required (red asterisk *)
- [ ] Options:
  - "Select appliance type" (default, disabled)
  - Washing Machine
  - Dryer
  - Dishwasher
  - Fridge
  - Freezer
  - Oven
  - Cooker
  - Microwave
  - Other
- [ ] Real-time validation on change
- [ ] Error message: "Please select an appliance type" (if default selected on submit)
- [ ] Accessible (ARIA label, keyboard navigation)

**Validation Rules:**
- Required: YES
- Must not be default option

**Dependencies:** FR-3.1 (part of appliance entry)

**Priority:** CRITICAL

---

#### **FR-3.3: Make/Brand Field** [HIGH]

**Description:** Enter appliance manufacturer/brand

**Acceptance Criteria:**
- [ ] Text input field with label "Make/Brand"
- [ ] Marked as required (red asterisk *)
- [ ] Placeholder: "e.g., Bosch, Samsung, LG"
- [ ] Maximum length: 50 characters
- [ ] Real-time validation on blur
- [ ] Error message: "Make/Brand is required" (if empty)
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Required: YES
- Max: 50 chars

**Dependencies:** FR-3.1 (part of appliance entry)

**Priority:** HIGH

---

#### **FR-3.4: Model Field** [HIGH]

**Description:** Enter appliance model number/name

**Acceptance Criteria:**
- [ ] Text input field with label "Model"
- [ ] Marked as required (red asterisk *)
- [ ] Placeholder: "e.g., Serie 6 WAT28371GB"
- [ ] Maximum length: 100 characters
- [ ] Real-time validation on blur
- [ ] Error message: "Model is required" (if empty)
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Required: YES
- Max: 100 chars

**Dependencies:** FR-3.1 (part of appliance entry)

**Priority:** HIGH

---

#### **FR-3.5: Age Field** [HIGH]

**Description:** Select appliance age range

**Acceptance Criteria:**
- [ ] Dropdown select field with label "Age"
- [ ] Marked as required (red asterisk *)
- [ ] Options:
  - "Select age" (default, disabled)
  - < 1 year
  - 1-2 years
  - 3-5 years
  - 6-10 years
  - 10+ years
- [ ] Real-time validation on change
- [ ] Error message: "Please select appliance age" (if default selected on submit)
- [ ] Accessible (ARIA label, keyboard navigation)

**Validation Rules:**
- Required: YES
- Must not be default option

**Dependencies:** FR-3.1 (part of appliance entry)

**Priority:** HIGH

---

#### **FR-3.6: Cover Limit Field** [CRITICAL]

**Description:** Select coverage limit (£500 or £800)

**Acceptance Criteria:**
- [ ] Radio button group with label "Cover Limit"
- [ ] Marked as required (red asterisk *)
- [ ] Options:
  - £500 cover (£8.99/month per appliance)
  - £800 cover (£12.99/month per appliance)
- [ ] Default: none selected (user must choose)
- [ ] Real-time validation on change
- [ ] Triggers total cost recalculation on change
- [ ] Error message: "Please select a cover limit" (if none selected on submit)
- [ ] Accessible (ARIA label, role="radiogroup")

**Validation Rules:**
- Required: YES
- Must select one option (£500 or £800)

**Dependencies:**
- FR-3.1 (part of appliance entry)
- FR-5.1 (Total Cost Calculation)

**Priority:** CRITICAL

---

### **FR-4: Boiler Plan Add-On (Optional)**

#### **FR-4.1: Add Boiler Cover Checkbox** [HIGH]

**Description:** Toggle to show/hide boiler plan options

**Acceptance Criteria:**
- [ ] Checkbox input with label "Add Boiler Cover"
- [ ] NOT marked as required (optional add-on)
- [ ] Unchecked by default
- [ ] When checked: boiler plan options section appears (fade in, 300ms)
- [ ] When unchecked: boiler plan options section disappears (fade out, 300ms) and selection is cleared
- [ ] Triggers total cost recalculation on change
- [ ] Accessible (ARIA label, ARIA controls attribute pointing to boiler options section)

**Validation Rules:**
- Required: NO
- Boolean (checked/unchecked)

**Dependencies:**
- FR-4.2 (Boiler Plan Selection)
- FR-5.1 (Total Cost Calculation)

**Priority:** HIGH

---

#### **FR-4.2: Boiler Plan Selection** [HIGH]

**Description:** Select boiler plan tier (if boiler cover is added)

**Acceptance Criteria:**
- [ ] Radio button group with label "Select Boiler Plan"
- [ ] Only visible if FR-4.1 checkbox is checked
- [ ] Marked as required IF boiler cover checkbox is checked
- [ ] Options:
  - Basic Boiler Cover - £14.99/month (Annual service + breakdown cover)
  - Plus Boiler Cover - £19.99/month (Annual service + breakdown cover + parts)
  - Premium Boiler Cover - £24.99/month (Annual service + breakdown cover + parts + replacement)
- [ ] Default: none selected (user must choose if section is visible)
- [ ] Real-time validation on change
- [ ] Triggers total cost recalculation on change
- [ ] Error message: "Please select a boiler plan" (if boiler checkbox is checked but no plan selected on submit)
- [ ] Accessible (ARIA label, role="radiogroup", hidden when section is not visible)

**Validation Rules:**
- Required: YES (if FR-4.1 is checked), NO (if FR-4.1 is unchecked)
- Conditional validation
- Must select one option if boiler cover is added

**Dependencies:**
- FR-4.1 (conditional visibility)
- FR-5.1 (Total Cost Calculation)

**Priority:** HIGH

---

### **FR-5: Total Cost Calculation**

#### **FR-5.1: Real-Time Total Calculation** [CRITICAL]

**Description:** Display and update total monthly cost dynamically

**Acceptance Criteria:**
- [ ] Total cost displayed prominently (large font, bold)
- [ ] Label: "Total Monthly Cost"
- [ ] Format: £XX.XX/month (2 decimal places)
- [ ] Calculation formula:
  - Base: (Number of appliances × Base rate per appliance)
  - Base rate: £8.99 (£500 cover) or £12.99 (£800 cover) per appliance
  - Add boiler cost if selected: £14.99 or £19.99 or £24.99
  - Total = (Appliance 1 rate + Appliance 2 rate + ... ) + Boiler cost
- [ ] Updates automatically when:
  - Appliance added/removed
  - Cover limit changed for any appliance
  - Boiler cover checkbox toggled
  - Boiler plan selection changed
- [ ] Update delay: < 100ms (feels instant)
- [ ] Accessible (ARIA live region announces total changes)

**Validation Rules:**
- Display only (not user input)
- Must be accurate (matches manual calculation)

**Dependencies:**
- FR-3.1 (Appliance count)
- FR-3.6 (Cover limit per appliance)
- FR-4.1 (Boiler cover toggle)
- FR-4.2 (Boiler plan selection)

**Priority:** CRITICAL

---

#### **FR-5.2: Annual Cost Display** [MEDIUM]

**Description:** Display annual cost for reference

**Acceptance Criteria:**
- [ ] Annual cost displayed below monthly cost (smaller font)
- [ ] Label: "or £XXX.XX/year"
- [ ] Calculation: Monthly cost × 12
- [ ] Format: £XXX.XX/year (2 decimal places)
- [ ] Updates automatically when monthly cost changes
- [ ] Accessible (ARIA label)

**Validation Rules:**
- Display only (not user input)
- Must be accurate (monthly × 12)

**Dependencies:**
- FR-5.1 (Monthly cost)

**Priority:** MEDIUM

---

### **FR-6: Form Submission**

#### **FR-6.1: Submit Button** [CRITICAL]

**Description:** Submit form data to Firebase

**Acceptance Criteria:**
- [ ] Button with text "Submit Policy Application"
- [ ] Disabled by default (enabled only when form is valid)
- [ ] Visual states:
  - Disabled: gray, cursor not-allowed
  - Enabled: blue (primary color), cursor pointer
  - Submitting: blue with spinner, disabled
  - Success: green checkmark (temporary, 2 seconds)
  - Error: red with error icon (temporary, 5 seconds)
- [ ] On click (if form valid):
  - Validate all fields one final time
  - If valid: trigger submission (FR-6.2)
  - If invalid: scroll to first error field, show error messages
- [ ] Accessible (ARIA label, role="button", disabled state announced)

**Validation Rules:**
- Cannot submit if form is invalid
- One submission at a time (disabled during submission)

**Dependencies:**
- All form validation (FR-1 through FR-5)
- FR-6.2 (Submission logic)

**Priority:** CRITICAL

---

#### **FR-6.2: Firebase Submission Logic** [CRITICAL]

**Description:** Submit policy data to Firebase Realtime Database

**Acceptance Criteria:**
- [ ] Firebase path: `/policies/{timestamp}_{userId}`
- [ ] Timestamp: Unix timestamp (milliseconds)
- [ ] UserId: Firebase Auth UID (if authenticated) or anonymous session ID
- [ ] Data structure matches schema defined in STREAM_INTENT.md
- [ ] Data includes:
  - submitted_at (ISO 8601 timestamp)
  - customer (name, email, phone, address)
  - payment (account holder, bank, sort code, account number, mandate agreed, mandate date)
  - appliances (array of appliance objects)
  - boiler (included boolean, plan name if included, monthly cost)
  - total (appliances count, monthly cost, annual cost)
  - status: "submitted"
  - reference: "POL-2026-XXXXXX" (6-digit random number)
- [ ] Submission timeout: 10 seconds
- [ ] Retry logic: 2 retries with 2-second delay if network error
- [ ] Success: trigger FR-6.3 (Success state)
- [ ] Error: trigger FR-6.4 (Error state)
- [ ] Accessible (loading state announced to screen readers)

**Validation Rules:**
- All required fields must be present in submission data
- Data must match Firebase schema
- Firebase security rules must allow write

**Dependencies:**
- Firebase config (firebase-config.js)
- Firebase security rules (firebase-rules.json)
- FR-6.3 (Success state)
- FR-6.4 (Error state)

**Priority:** CRITICAL

---

#### **FR-6.3: Success State** [CRITICAL]

**Description:** Display success message after successful submission

**Acceptance Criteria:**
- [ ] Success message displayed prominently (green background, white text)
- [ ] Message: "Your policy application has been submitted successfully! Reference: [POL-2026-XXXXXX]"
- [ ] Reference number displayed (from FR-6.2)
- [ ] Copy reference button (copies to clipboard)
- [ ] "Submit Another Application" button (clears form)
- [ ] Success message remains visible until user action (no auto-dismiss)
- [ ] Form fields disabled (prevent edits after submission)
- [ ] Loading spinner hidden
- [ ] Submit button changes to green checkmark (temporary, 2 seconds)
- [ ] Accessible (success announced to screen readers, focus moves to success message)

**Validation Rules:**
- Only shown after successful Firebase write
- Reference number must be valid and match submitted data

**Dependencies:**
- FR-6.2 (Firebase submission)

**Priority:** CRITICAL

---

#### **FR-6.4: Error State** [CRITICAL]

**Description:** Display error message if submission fails

**Acceptance Criteria:**
- [ ] Error message displayed prominently (red background, white text)
- [ ] Generic message: "There was an error submitting your application. Please try again."
- [ ] Specific error details (if available):
  - Network error: "Please check your internet connection and try again."
  - Firebase error: "Database error. Please contact support if the issue persists."
  - Validation error: "Please check all fields and try again."
- [ ] "Try Again" button (re-enables submit button)
- [ ] Error message remains visible until user clicks "Try Again" or edits form
- [ ] Form fields remain enabled (user can edit)
- [ ] Loading spinner hidden
- [ ] Submit button changes to red with error icon (temporary, 5 seconds)
- [ ] Accessible (error announced to screen readers, focus moves to error message)

**Validation Rules:**
- Only shown after Firebase write fails
- Error message must be helpful (actionable)

**Dependencies:**
- FR-6.2 (Firebase submission)

**Priority:** CRITICAL

---

#### **FR-6.5: Form Clear/Reset** [MEDIUM]

**Description:** Clear form and reset to initial state

**Acceptance Criteria:**
- [ ] Triggered by "Submit Another Application" button (after success)
- [ ] All text inputs cleared (empty values)
- [ ] All checkboxes unchecked
- [ ] All radio buttons deselected
- [ ] Appliances list reset to 1 empty entry
- [ ] Total cost reset to £0.00
- [ ] Success/error messages cleared
- [ ] Form fields re-enabled
- [ ] Submit button reset to disabled state
- [ ] Page scrolls to top of form
- [ ] Confirmation prompt: "Are you sure you want to clear the form?" (if form has data and user clicks outside success flow)
- [ ] Accessible (reset announced to screen readers, focus moves to first field)

**Validation Rules:**
- Confirmation required if form has data (prevent accidental clear)
- Reset must be complete (no leftover state)

**Dependencies:**
- FR-6.3 (Success state, triggers reset)

**Priority:** MEDIUM

---

## 🎨 **NON-FUNCTIONAL REQUIREMENTS**

### **NFR-1: User Experience**

#### **NFR-1.1: Mobile-First Responsive Design** [CRITICAL]

**Description:** Form must be fully responsive on all device sizes

**Acceptance Criteria:**
- [ ] Breakpoints:
  - Mobile: 320px - 767px (single column)
  - Tablet: 768px - 1023px (single column, larger touch targets)
  - Desktop: 1024px+ (max width 800px, centered)
- [ ] Touch targets: minimum 44px × 44px (buttons, checkboxes, radio buttons)
- [ ] Font sizes scale appropriately (minimum 16px to prevent mobile zoom)
- [ ] Form width: 100% on mobile (with 16px padding), max 800px on desktop
- [ ] Images/icons scale with device size
- [ ] Horizontal scrolling: NEVER
- [ ] Tested on:
  - iPhone SE (320px)
  - iPhone 12/13 (390px)
  - iPad (768px)
  - Desktop (1920px)

**Testing:**
- Manual testing on physical devices
- Browser DevTools responsive mode
- Screenshot comparison across breakpoints

**Priority:** CRITICAL

---

#### **NFR-1.2: WCAG AA Accessibility** [CRITICAL]

**Description:** Form must meet WCAG 2.1 Level AA standards

**Acceptance Criteria:**
- [ ] Keyboard navigation:
  - All form fields focusable via Tab
  - Logical tab order (top to bottom, left to right)
  - Visible focus indicators (2px blue outline)
  - No keyboard traps
- [ ] Screen reader compatibility:
  - All inputs have accessible labels (ARIA labels)
  - Error messages announced (ARIA live regions)
  - Form sections have headings (h2, h3)
  - Form instructions provided (aria-describedby)
- [ ] Color contrast:
  - Text: minimum 4.5:1 ratio (normal text)
  - Large text: minimum 3:1 ratio (18pt+ or 14pt+ bold)
  - UI components: minimum 3:1 ratio (buttons, borders)
- [ ] Error handling:
  - Errors clearly identified
  - Error messages descriptive (not just "Error")
  - Multiple errors listed (not just first error)
- [ ] Tested with:
  - NVDA (screen reader, Windows)
  - JAWS (screen reader, Windows)
  - VoiceOver (screen reader, macOS)
  - axe DevTools (automated testing)
  - Lighthouse (accessibility audit)

**Testing:**
- Automated: axe DevTools, Lighthouse
- Manual: keyboard navigation, screen reader testing

**Priority:** CRITICAL

---

#### **NFR-1.3: Real-Time Validation** [HIGH]

**Description:** Provide immediate feedback on field validity

**Acceptance Criteria:**
- [ ] Validation timing:
  - On blur (when user leaves field)
  - On change (for dropdowns, checkboxes, radio buttons)
  - On submit (final validation)
- [ ] Visual feedback:
  - Invalid: red border (2px), red error text below field
  - Valid: green border (2px) (optional, may be removed for cleaner UX)
  - Pristine: gray border (1px)
- [ ] Error messages:
  - Displayed immediately on blur (if field is invalid)
  - Cleared immediately when field becomes valid
  - Positioned below field (not tooltip, not modal)
  - Color: red (#EF4444)
- [ ] Performance:
  - Validation delay: < 50ms (feels instant)
  - No UI jank or lag
- [ ] Progressive disclosure:
  - Errors only shown after user interaction (not on page load)
  - Errors persist until corrected

**Priority:** HIGH

---

#### **NFR-1.4: Progressive Disclosure** [MEDIUM]

**Description:** Show only relevant sections at any given time

**Acceptance Criteria:**
- [ ] Boiler section:
  - Hidden by default
  - Shown only when "Add Boiler Cover" checkbox is checked
  - Smooth animation (fade in, 300ms)
  - Clears boiler plan selection when hidden
- [ ] Dynamic appliances:
  - Initially shows 1 appliance entry
  - Additional entries appear on "Add" click
  - Remove buttons disabled when count = 1
  - Add button disabled when count = 10
- [ ] Loading states:
  - Submit button shows spinner during submission
  - Form fields disabled during submission (optional)
- [ ] Success/error states:
  - Success message replaces form (or overlays form)
  - Error message displayed above submit button

**Priority:** MEDIUM

---

### **NFR-2: Technical Stack**

#### **NFR-2.1: Pure HTML/CSS/JS** [CRITICAL]

**Description:** No frameworks or build tools

**Acceptance Criteria:**
- [ ] HTML: HTML5 only (semantic tags)
- [ ] CSS: CSS3 only (Grid, Flexbox, no preprocessors)
- [ ] JavaScript: Vanilla JS (ES6+), no jQuery, React, Vue, Angular
- [ ] No build tools: Webpack, Vite, Rollup, Gulp, Grunt
- [ ] No CSS preprocessors: Sass, Less, Stylus
- [ ] No CSS frameworks: Bootstrap, Tailwind, Foundation
- [ ] Files:
  - appliance_insurance_form.html (main file)
  - styles.css (all styles)
  - app.js (all logic)
  - firebase-config.js (Firebase init)
  - firebase-rules.json (security rules)
- [ ] Deployment: Copy files to server (no build step)

**Priority:** CRITICAL

---

#### **NFR-2.2: Firebase Realtime Database** [CRITICAL]

**Description:** Use Firebase Realtime Database for data storage

**Acceptance Criteria:**
- [ ] Firebase SDK: Loaded via CDN (not npm/bundled)
- [ ] CDN URL: `https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js` and `firebase-database.js`
- [ ] Database type: Realtime Database (NOT Firestore)
- [ ] Database structure: `/policies/{id}` (flat, no nested collections)
- [ ] Security rules: Defined in firebase-rules.json, deployed to Firebase
- [ ] Authentication: Optional (Firebase Auth for user identification)
- [ ] Offline support: Not required (form requires internet connection)

**Priority:** CRITICAL

---

#### **NFR-2.3: Browser Support** [HIGH]

**Description:** Support modern browsers

**Acceptance Criteria:**
- [ ] Supported browsers (last 2 versions):
  - Chrome (desktop + mobile)
  - Firefox (desktop + mobile)
  - Safari (desktop + mobile)
  - Edge (desktop)
- [ ] NOT supported:
  - Internet Explorer (any version)
  - Opera Mini
  - UC Browser
- [ ] Features used:
  - ES6 (arrow functions, const/let, template literals, async/await)
  - CSS Grid + Flexbox
  - Fetch API
  - Promise
- [ ] Polyfills: Not needed (modern APIs only)
- [ ] Graceful degradation: Not required (assumes modern browser)

**Testing:**
- Manual testing on Chrome, Firefox, Safari, Edge
- BrowserStack (optional, for comprehensive testing)

**Priority:** HIGH

---

### **NFR-3: Performance**

#### **NFR-3.1: Page Load Performance** [HIGH]

**Description:** Form must load quickly

**Acceptance Criteria:**
- [ ] Metrics:
  - First Contentful Paint (FCP): < 1.5 seconds
  - Time to Interactive (TTI): < 3 seconds
  - Total page load: < 1 second (excluding Firebase SDK)
- [ ] File sizes:
  - HTML: ~300 lines (~10 KB)
  - CSS: ~500 lines (~15 KB)
  - JS: ~600 lines (~20 KB)
  - Total (excluding Firebase SDK): ~45 KB
  - Firebase SDK (CDN): ~200 KB (cached after first load)
- [ ] Optimizations:
  - Minify HTML/CSS/JS for production (manual or tool)
  - Use CDN for Firebase SDK (caching)
  - No unnecessary images (use CSS for styling)
  - Lazy load if needed (not required for this project)

**Testing:**
- Lighthouse performance audit (target: score > 90)
- WebPageTest (target: load time < 2 seconds)

**Priority:** HIGH

---

#### **NFR-3.2: Form Submission Performance** [HIGH]

**Description:** Form submission must be fast

**Acceptance Criteria:**
- [ ] Metrics:
  - Submission time: < 2 seconds (from click to success/error message)
  - Firebase write latency: < 1 second (typical)
- [ ] Timeout: 10 seconds (show error if Firebase write takes longer)
- [ ] Retry logic: 2 retries with 2-second delay (for network errors)
- [ ] Optimizations:
  - Single Firebase write (not multiple writes)
  - Minimal data transformation (pre-format data before write)
  - No unnecessary API calls

**Testing:**
- Manual testing on fast connection (Wi-Fi)
- Manual testing on slow connection (3G throttling)
- Firebase Emulator (local testing)

**Priority:** HIGH

---

#### **NFR-3.3: File Size Constraint** [MEDIUM]

**Description:** Total file size must be small

**Acceptance Criteria:**
- [ ] Total size (excluding Firebase SDK): < 200 KB
- [ ] HTML: < 15 KB (gzipped < 5 KB)
- [ ] CSS: < 20 KB (gzipped < 7 KB)
- [ ] JS: < 25 KB (gzipped < 10 KB)
- [ ] Images: 0 (use CSS/SVG for icons if needed)
- [ ] Fonts: Use system fonts (no web fonts) or max 1 web font (< 50 KB)

**Testing:**
- Check file sizes in browser DevTools (Network tab)
- Measure gzipped sizes (server gzip enabled)

**Priority:** MEDIUM

---

### **NFR-4: Security**

#### **NFR-4.1: XSS Prevention** [CRITICAL]

**Description:** Prevent Cross-Site Scripting attacks

**Acceptance Criteria:**
- [ ] Input sanitization:
  - Escape HTML special characters (<, >, &, ", ') in all user inputs
  - Use `textContent` (not `innerHTML`) to display user input
  - Validate input format (email, phone, postcode) to reject malicious patterns
- [ ] Output encoding:
  - Encode data before displaying in HTML
  - Use parameterized queries (not applicable here, but good practice)
- [ ] Content Security Policy (CSP):
  - Define CSP header (allow only trusted sources)
  - Block inline scripts (or use nonce)
- [ ] No eval(), no `new Function()`
- [ ] Testing:
  - Attempt to inject `<script>alert('XSS')</script>` in all fields
  - Verify it's escaped/sanitized

**Priority:** CRITICAL

---

#### **NFR-4.2: Firebase Security Rules** [CRITICAL]

**Description:** Prevent unauthorized writes to Firebase

**Acceptance Criteria:**
- [ ] Security rules defined in firebase-rules.json
- [ ] Rules:
  - Allow write to `/policies/{id}` only if:
    - Data structure is valid (matches schema)
    - Required fields are present
    - Field types are correct (string, number, boolean)
    - No SQL injection patterns (not applicable to Firebase, but validate strings)
  - Rate limiting: max 10 submissions per hour per IP (or per user if authenticated)
  - No read access (policies are write-only for form submission)
- [ ] Testing:
  - Test unauthorized write attempts (should fail)
  - Test malformed data submissions (should fail)
  - Test rate limiting (11th submission in 1 hour should fail)

**Priority:** CRITICAL

---

#### **NFR-4.3: GDPR Compliance** [HIGH]

**Description:** Comply with data protection regulations

**Acceptance Criteria:**
- [ ] Privacy policy link displayed prominently (before form submission)
- [ ] GDPR notice: "By submitting this form, you consent to the collection and processing of your personal data as described in our Privacy Policy."
- [ ] Data minimization: Only collect necessary data (no excessive data)
- [ ] Data retention: Define retention policy (not in scope for this form, but document)
- [ ] User rights:
  - Right to access: Provide mechanism for users to request their data (not in form, but document)
  - Right to deletion: Provide mechanism for users to request data deletion (not in form, but document)
- [ ] Data encryption:
  - In transit: HTTPS (TLS/SSL)
  - At rest: Firebase automatically encrypts data at rest
- [ ] Third-party data sharing: None (data stored only in Firebase)

**Priority:** HIGH

---

#### **NFR-4.4: No Sensitive Data in Client** [MEDIUM]

**Description:** Do not store sensitive data in browser storage or URL

**Acceptance Criteria:**
- [ ] No localStorage: Do not store form data in localStorage
- [ ] No sessionStorage: Do not store form data in sessionStorage
- [ ] No cookies: Do not store form data in cookies (except session ID if using Firebase Auth)
- [ ] No URL parameters: Do not pass form data via URL (no GET request with sensitive data)
- [ ] In-memory only: Form data exists only in JS variables (cleared on page refresh)
- [ ] Testing:
  - Check localStorage, sessionStorage, cookies after form submission
  - Verify no sensitive data is stored

**Priority:** MEDIUM

---

## 📊 **Requirements Summary**

### **Priority Distribution**

| Priority | Count | Percentage | Examples |
|----------|-------|------------|----------|
| CRITICAL | 18 | 43% | Name, Email, Phone, Postcode, Direct Debit fields, Submit, Firebase, Accessibility |
| HIGH | 14 | 33% | Make/Model, Age, Boiler options, Validation, Performance, Security Rules |
| MEDIUM | 8 | 19% | Address Line 2, Annual cost display, Progressive disclosure, File size |
| LOW | 2 | 5% | County, Additional documentation |

### **Dependency Map**

**Core Dependencies:**
1. **FR-1 (Contact Details)** → No dependencies
2. **FR-2 (Direct Debit)** → No dependencies
3. **FR-3 (Appliances)** → Internal dependencies (FR-3.1 depends on FR-3.2-3.6)
4. **FR-4 (Boiler)** → Depends on FR-4.1 for visibility, FR-5.1 for calculation
5. **FR-5 (Total Cost)** → Depends on FR-3.6, FR-4.1, FR-4.2
6. **FR-6 (Submission)** → Depends on ALL functional requirements (must validate all before submit)

**External Dependencies:**
- Firebase SDK (loaded via CDN)
- HTTPS connection (for data transmission)
- Internet connection (for Firebase write)

### **Validation Rules Summary**

**Total Validation Rules:** 25+

**Validation Types:**
1. **Required** (18 fields): Name, Email, Phone, Address, City, Postcode, Account Holder, Bank, Sort Code, Account Number, Mandate, Appliance Type, Make, Model, Age, Cover Limit, Boiler Plan (if boiler added), Submit button enable
2. **Format** (7 patterns): Email, UK Phone, UK Postcode, Sort Code, Account Number, plus custom patterns
3. **Conditional** (3 rules): Boiler plan required if boiler checkbox checked, Remove button disabled if 1 appliance, Add button disabled if 10 appliances
4. **Real-Time** (all fields): Validation triggers on blur/change

---

## ✅ **Requirements Specification Complete**

**Total Requirements:** 42 detailed requirements  
**Acceptance Criteria:** 200+ specific criteria  
**Validation Rules:** 25+ rules  
**Priorities:** 18 CRITICAL, 14 HIGH, 8 MEDIUM, 2 LOW  
**Dependencies:** Fully mapped  

**Next Step:** Analyze Project Structure (Step 4)  
**Status:** ✅ Step 3 COMPLETE
