# Stream Intent - Form Enhancements: Postcode Lookup & Brand Management

**Stream Name:** form_enhancements_postcode_brands  
**Created:** 2026-01-15  
**Status:** Active  
**Priority:** High

---

## 🎯 Primary Goal

Enhance the appliance insurance form with:
1. **Postcode lookup functionality** with full address details (not just first line), editable if lookup is incorrect
2. **Brand management system** with autocomplete dropdown for consistent brand entry
3. **Expanded appliance types** (white and brown goods) with autocomplete functionality
4. **Admin panel integration** for managing brands

---

## 📋 Requirements

### 1. Postcode Lookup
- **Requirement:** Implement postcode lookup that returns full address details
- **Details:** 
  - Not just first line of address
  - Full address including street, city, county, postcode
  - Address fields should be editable if lookup is incorrect
  - User should be able to manually correct any address field
- **Priority:** High
- **Category:** Form Enhancement

### 2. Brand Management System
- **Requirement:** Create autocomplete dropdown for appliance brands
- **Details:**
  - List of 30 biggest appliance brands pre-populated
  - Dropdown with search/type-to-filter functionality
  - Consistent brand entry with correct spelling
  - "Other" option if brand not in list
  - Ability to add new brands via admin panel backend
- **Priority:** High
- **Category:** Data Management

### 3. Appliance Types Enhancement
- **Requirement:** Expand appliance types and add autocomplete
- **Details:**
  - Add more appliance types (white goods and brown goods)
  - Change appliance type selection to work like brand select
  - Type-to-narrow functionality (autocomplete)
  - Consistent entry with correct spelling
- **Priority:** High
- **Category:** Form Enhancement

### 4. Admin Panel Integration
- **Requirement:** Backend admin panel for brand management
- **Details:**
  - Ability to add new brands
  - Ability to edit existing brands
  - Ability to manage brand list
  - Integration with form brand dropdown
- **Priority:** Medium
- **Category:** Admin Features

---

## 🔍 Success Criteria

- [ ] Postcode lookup returns full address details
- [ ] Address fields are editable after lookup
- [ ] Brand dropdown with autocomplete works correctly
- [ ] 30 biggest brands pre-populated
- [ ] "Other" option available for brands not in list
- [ ] Admin panel can add/edit brands
- [ ] Appliance types expanded (white and brown goods)
- [ ] Appliance type selection has autocomplete
- [ ] All form fields work consistently
- [ ] No breaking changes to existing functionality

---

## 🚫 Out of Scope

- Changing existing form validation logic (unless required for new features)
- Modifying authentication system
- Changing database structure (unless necessary for brand storage)
- Redesigning entire form UI (only enhancements)

---

## 📊 Project Type

**Type:** Enhancement  
**Complexity:** Medium  
**Impact:** User Experience Improvement

---

## 🔗 Related Files/Directories

- `src/appliance_form.html` - Main form file
- `src/app.js` - Form logic
- `src/services/form-renderer.js` - Dynamic form rendering
- `src/admin.html` - Admin panel
- `src/admin.js` - Admin panel logic
- `src/services/field-config.js` - Field configuration service
- Database: `form_fields` path for field definitions

---

## 📝 Notes

- Must maintain backward compatibility with existing form submissions
- Brand list should be stored in database for easy management
- Postcode lookup API needs to be selected (UK postcode lookup service)
- Consider caching postcode lookups to reduce API calls
- Ensure mobile responsiveness for new features
