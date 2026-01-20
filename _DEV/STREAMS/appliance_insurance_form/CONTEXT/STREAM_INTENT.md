---
title: "Stream Intent - Appliance Insurance Form"
created: 2026-01-08
category: stream_context
status: active
---

# Stream Intent - Appliance Insurance Form

**Created:** 2026-01-08  
**Status:** Active  
**Type:** New Feature - Web Form with Firebase Integration

---

## 🎯 **Primary Goal**

Create a user-friendly HTML form that allows customers to sign up for home appliance insurance coverage, including:
- General contact details
- Direct debit payment setup
- Multiple appliances registration (type, make, model, age, cover limit)
- Optional boiler plan add-on
- Submit all data to Firebase Realtime Database

---

## 📋 **Requirements**

### **Functional Requirements**

#### **1. Contact Details Section**
- Full Name (required)
- Email Address (required, validated)
- Phone Number (required, validated)
- Address Line 1 (required)
- Address Line 2 (optional)
- City (required)
- Postcode (required, UK format)
- County (optional)

#### **2. Direct Debit Setup Section**
- Account Holder Name (required)
- Bank Name (required)
- Sort Code (required, format: XX-XX-XX)
- Account Number (required, 8 digits)
- Direct Debit Mandate Agreement Checkbox (required)

#### **3. Appliance Registration Section**
- **Dynamic Multi-Appliance Entry:**
  - Appliance Type (dropdown: Washing Machine, Dryer, Dishwasher, Fridge, Freezer, Oven, Cooker, Microwave, Other)
  - Make/Brand (text input)
  - Model (text input)
  - Age (dropdown: < 1 year, 1-2 years, 3-5 years, 6-10 years, 10+ years)
  - Cover Limit (radio: £500 or £800)
  
- **Add/Remove Appliance Buttons:**
  - "Add Another Appliance" button (green, + icon)
  - "Remove" button for each appliance (red, × icon)
  - Minimum: 1 appliance required
  - Maximum: 10 appliances

#### **4. Boiler Plan Add-On (Optional)**
- Checkbox: "Add Boiler Cover"
- If checked, show radio options:
  - **Basic Boiler Cover** - £14.99/month (Annual service + breakdown cover)
  - **Plus Boiler Cover** - £19.99/month (Annual service + breakdown + parts)
  - **Premium Boiler Cover** - £24.99/month (Annual service + breakdown + parts + replacement)

#### **5. Total Calculation**
- Display running total of monthly cost
- Formula: (Number of appliances × base rate) + boiler plan (if selected)
- Base rate per appliance: £8.99/month for £500 cover, £12.99/month for £800 cover
- Update total dynamically as user adds/removes appliances or changes selections

#### **6. Form Submission**
- Submit to Firebase Realtime Database
- Firebase path: `/policies/{timestamp}_{userId}`
- Show loading spinner during submission
- Success message: "Your policy application has been submitted! Reference: [ref_number]"
- Error handling: Display error message if submission fails
- Clear form on successful submission (with confirmation)

### **Non-Functional Requirements**

#### **User Experience**
- **Mobile-First Design:** Fully responsive (320px to 2560px)
- **Accessibility:** WCAG AA compliant
  - Keyboard navigation (Tab, Enter)
  - Screen reader compatible
  - ARIA labels on all inputs
  - Focus indicators visible
- **Validation:**
  - Real-time validation on blur
  - Clear error messages below each field
  - Disable submit button until form is valid
  - Red border on invalid fields, green on valid
- **Progressive Disclosure:** Only show boiler options if checkbox is checked
- **Visual Feedback:**
  - Loading states for submission
  - Success/error notifications
  - Smooth animations for add/remove appliances

#### **Technical Requirements**
- **Frontend:** Pure HTML, CSS, JavaScript (no frameworks initially)
- **Firebase Integration:**
  - Firebase Realtime Database
  - Firebase Authentication (optional: allow anonymous submissions with session tracking)
  - Use Firebase SDK (CDN)
- **Browser Support:** Chrome, Firefox, Safari, Edge (last 2 versions)
- **Performance:** Form submission < 2 seconds
- **Security:**
  - No sensitive data in URL/local storage
  - Firebase security rules to prevent unauthorized writes
  - Client-side validation + server-side validation (Firebase rules)

#### **Data Structure (Firebase)**
```json
{
  "policies": {
    "1704744000000_abc123": {
      "submitted_at": "2026-01-08T12:00:00Z",
      "customer": {
        "full_name": "John Smith",
        "email": "john@example.com",
        "phone": "07123456789",
        "address": {
          "line1": "123 High Street",
          "line2": "Flat 2",
          "city": "London",
          "postcode": "SW1A 1AA",
          "county": "Greater London"
        }
      },
      "payment": {
        "account_holder": "John Smith",
        "bank_name": "HSBC",
        "sort_code": "12-34-56",
        "account_number": "12345678",
        "mandate_agreed": true,
        "mandate_date": "2026-01-08T12:00:00Z"
      },
      "appliances": [
        {
          "id": "appliance_1",
          "type": "Washing Machine",
          "make": "Bosch",
          "model": "Serie 6 WAT28371GB",
          "age": "1-2 years",
          "cover_limit": 800,
          "monthly_cost": 12.99
        }
      ],
      "boiler": {
        "included": true,
        "plan": "Plus Boiler Cover",
        "monthly_cost": 19.99
      },
      "total": {
        "appliances_count": 1,
        "monthly_cost": 32.98,
        "annual_cost": 395.76
      },
      "status": "submitted",
      "reference": "POL-2026-001234"
    }
  }
}
```

---

## 🎨 **Design Requirements**

### **Visual Style**
- **Color Scheme:**
  - Primary: #2563EB (Blue - trust, security)
  - Secondary: #10B981 (Green - success, add actions)
  - Danger: #EF4444 (Red - remove, errors)
  - Neutral: #6B7280 (Gray - borders, text)
  - Background: #F9FAFB (Light gray)
  
- **Typography:**
  - Font: Inter, system-ui, sans-serif
  - Headings: 600 weight
  - Body: 400 weight
  - Input labels: 500 weight

### **Layout**
- Max width: 800px (centered)
- Padding: 24px mobile, 48px desktop
- Section spacing: 32px
- Card-based sections with subtle shadows
- Progress indicator (optional): Contact → Payment → Appliances → Summary

### **Input Styling**
- Height: 44px minimum (touch targets)
- Border: 1px solid #D1D5DB
- Border radius: 8px
- Focus: 2px blue ring
- Padding: 12px
- Font size: 16px (prevents mobile zoom)

---

## 🔧 **Technical Stack**

### **Frontend**
- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript (ES6+)

### **Backend/Database**
- Firebase Realtime Database
- Firebase Authentication (optional)

### **Tools**
- Firebase SDK (CDN): `https://www.gstatic.com/firebasejs/10.x.x/`
- No build tools (pure HTML/CSS/JS for simplicity)

---

## 📦 **Deliverables**

1. **HTML Form** (`appliance_insurance_form.html`)
   - Semantic HTML5
   - Accessible markup (ARIA labels)
   - Firebase integration

2. **CSS Stylesheet** (`styles.css`)
   - Responsive design (mobile-first)
   - Component-based styles
   - Animations and transitions

3. **JavaScript** (`app.js`)
   - Form validation
   - Dynamic appliance management
   - Firebase integration
   - Total calculation
   - Submission handling

4. **Firebase Configuration** (`firebase-config.js`)
   - Firebase initialization
   - Database reference setup
   - Security rules

5. **Firebase Security Rules** (`firebase-rules.json`)
   - Write permissions
   - Data validation

6. **Documentation** (`README.md`)
   - Setup instructions
   - Firebase setup guide
   - Usage guide
   - Deployment instructions

---

## ✅ **Success Criteria**

- [ ] Form loads in < 1 second
- [ ] All fields validate correctly
- [ ] Can add/remove appliances dynamically
- [ ] Total cost calculates correctly
- [ ] Data submits to Firebase successfully
- [ ] Success/error messages display correctly
- [ ] Form is fully responsive (mobile to desktop)
- [ ] WCAG AA accessible (contrast, keyboard, screen reader)
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] No console errors
- [ ] Firebase security rules prevent unauthorized access

---

## 🚧 **Constraints**

- Must use Firebase Realtime Database (not Firestore)
- No frontend frameworks (pure HTML/CSS/JS)
- Must support IE11 fallback (optional, nice-to-have)
- Total form file size < 200KB (excluding Firebase SDK)

---

## 🔒 **Security Considerations**

1. **Client-Side:**
   - Input sanitization (XSS prevention)
   - Email/phone validation
   - Sort code/account number format validation

2. **Firebase:**
   - Security rules to validate data structure
   - Rate limiting (max 10 submissions per IP per hour)
   - Required fields enforcement
   - Data type validation

3. **Privacy:**
   - No data stored in local storage
   - Clear privacy policy link
   - GDPR compliance notice
   - Direct debit mandate text

---

## 📊 **Complexity Estimate**

- **Files:** ~6 files (HTML, CSS, JS, Firebase config, rules, README)
- **Lines of Code:** ~1,500 total
  - HTML: ~300 lines
  - CSS: ~500 lines
  - JavaScript: ~600 lines
  - Firebase rules: ~100 lines
- **Integrations:** 1 (Firebase)
- **Time Estimate:** 1-2 days (Standard Execution)

---

## 🎯 **Next Steps**

1. Run Discovery Assessment workflow
2. Route to appropriate Design workflow (likely DESIGN_QUICK or DESIGN_FULL)
3. Route to appropriate Execution workflow (likely EXECUTION_STANDARD)
4. Test form with Firebase
5. Deploy to hosting (Firebase Hosting or other)

---

**Stream Created:** 2026-01-08  
**Ready for Discovery Assessment:** ✅
