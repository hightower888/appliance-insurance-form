---
title: "Context Summary - Discovery Assessment Step 1"
created: 2026-01-08
workflow: DISCOVERY_ASSESSMENT
step: 1
category: discovery_output
---

# Context Summary - Appliance Insurance Form

**Stream:** appliance_insurance_form  
**Workflow:** DISCOVERY_ASSESSMENT  
**Step:** 1 - Load Context & Parse Intent  
**Created:** 2026-01-08

---

## 🎯 **Primary Goal**

Create a user-friendly HTML form that allows customers to sign up for home appliance insurance coverage, including:
1. General contact details collection
2. Direct debit payment setup
3. Multi-appliance registration (dynamic add/remove)
4. Optional boiler plan add-on (3 pricing tiers)
5. Real-time total cost calculation
6. Firebase Realtime Database submission

---

## 📊 **Project Type**

**Type:** NET-NEW FEATURE  
**Rationale:** No existing appliance insurance codebase. Standalone web application that will leverage existing Firebase integration patterns for consistency.

---

## 🔗 **Integrations Required**

### **Primary Integration**
- **Firebase Realtime Database**
  - Purpose: Store policy submissions
  - Data path: `/policies/{timestamp}_{userId}`
  - Existing resources: `SHARED_RESOURCES/APIS/firebase/`, `SHARED_RESOURCES/CONFIGS/firebase/`

### **Optional Integration**
- **Firebase Authentication**
  - Purpose: Session tracking, anonymous submissions
  - Use case: Generate unique user IDs, track submission history

---

## 📋 **Requirements Summary**

### **Functional Requirements (6 categories)**

1. **Contact Details Section** (8 fields)
   - Full Name, Email (validated), Phone (validated)
   - Address: Line 1, Line 2 (optional), City, Postcode (UK format), County (optional)

2. **Direct Debit Setup** (5 fields + mandate)
   - Account Holder Name, Bank Name
   - Sort Code (XX-XX-XX format), Account Number (8 digits)
   - Direct Debit Mandate Agreement (checkbox, required)

3. **Appliance Registration** (Dynamic entries)
   - Appliance Type (dropdown: 9 options)
   - Make/Brand (text), Model (text)
   - Age (dropdown: 5 ranges)
   - Cover Limit (radio: £500 or £800)
   - Add/Remove buttons (min 1, max 10 appliances)

4. **Boiler Plan Add-On** (Optional)
   - Checkbox: "Add Boiler Cover"
   - Radio options (if checked):
     - **Basic** - £14.99/month (Annual service + breakdown cover)
     - **Plus** - £19.99/month (+ parts replacement)
     - **Premium** - £24.99/month (+ full boiler replacement)

5. **Total Cost Calculation** (Real-time)
   - Base rate: £8.99/month (£500 cover) or £12.99/month (£800 cover)
   - Formula: (Appliances × base rate) + Boiler plan
   - Updates dynamically on any change

6. **Form Submission**
   - Loading spinner during submission
   - Success message: "Your policy application has been submitted! Reference: [POL-2026-XXXXXX]"
   - Error handling with clear messages
   - Form clears on success (with confirmation)

### **Non-Functional Requirements (4 categories)**

1. **User Experience**
   - Mobile-first responsive design (320px - 2560px)
   - WCAG AA accessibility (keyboard nav, screen reader, ARIA labels)
   - Real-time validation on blur (red border = invalid, green = valid)
   - Progressive disclosure (boiler options only show if checkbox checked)
   - Smooth animations for add/remove appliances

2. **Technical Stack**
   - Pure HTML5, CSS3 (Grid + Flexbox), Vanilla JavaScript (ES6+)
   - Firebase Realtime Database + Firebase SDK (CDN)
   - No frameworks, no build tools
   - Browser support: Chrome, Firefox, Safari, Edge (last 2 versions)

3. **Performance**
   - Page load: < 1 second
   - Form submission: < 2 seconds
   - Total file size: < 200KB (excluding Firebase SDK)

4. **Security**
   - XSS prevention (input sanitization)
   - Firebase security rules (data validation, rate limiting)
   - No sensitive data in localStorage or URL
   - GDPR compliance notice, privacy policy link

---

## 📁 **Relevant Directories**

### **Existing Resources**
- `SHARED_RESOURCES/APIS/firebase/` - Firebase integration code
- `SHARED_RESOURCES/CONFIGS/firebase/` - Firebase config files
- `SHARED_RESOURCES/INTEGRATIONS/OPENAI_UI/` - UI component reference (form patterns)

### **Stream Output Directory**
- `_DEV/STREAMS/appliance_insurance_form/OUTPUTS/` - All deliverables

---

## 📦 **Deliverables (6 files)**

1. `appliance_insurance_form.html` - Main form (~300 lines)
2. `styles.css` - Responsive styling (~500 lines)
3. `app.js` - Form logic, validation, Firebase integration (~600 lines)
4. `firebase-config.js` - Firebase initialization (~50 lines)
5. `firebase-rules.json` - Security rules (~100 lines)
6. `README.md` - Setup and deployment guide (~200 lines)

**Total Estimated Lines:** ~1,500 lines of code

---

## 🎨 **Design System**

### **Color Palette**
- Primary: `#2563EB` (Blue - trust, security)
- Secondary: `#10B981` (Green - success, add actions)
- Danger: `#EF4444` (Red - remove, errors)
- Neutral: `#6B7280` (Gray - borders, text)
- Background: `#F9FAFB` (Light gray)

### **Typography**
- Font: Inter, system-ui, sans-serif
- Headings: 600 weight
- Body: 400 weight
- Input labels: 500 weight

### **Layout**
- Max width: 800px (centered)
- Padding: 24px (mobile), 48px (desktop)
- Section spacing: 32px
- Card-based sections with subtle shadows

---

## ✅ **Initialization Status**

- [x] Stream directory structure created
- [x] STREAM_INTENT.md created (329 lines)
- [x] Primary goal parsed
- [x] Requirements extracted (6 functional + 4 non-functional)
- [x] Integrations identified (Firebase Realtime DB + Auth)
- [x] Relevant directories mapped
- [x] Project type determined (NEW FEATURE)
- [x] CONTEXT_SUMMARY.md generated

---

**Next Step:** File Structure Assessment (Step 2)  
**Status:** ✅ Step 1 Complete
