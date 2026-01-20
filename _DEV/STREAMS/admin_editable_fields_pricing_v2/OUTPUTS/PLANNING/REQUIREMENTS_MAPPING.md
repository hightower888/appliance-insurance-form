# Requirements to Code Mapping

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** admin_editable_fields_pricing_v2

---

## Requirements Analysis

### REQ-001: Remove make, brand, model, and age as required fields

**Status:** ✅ Already implemented in code
**Location:** `src/app.js` line 633
**Current State:** Only appliance type is required
**Action Needed:** 
- Verify admin panel supports toggling required status
- Update admin.js if needed for field management UI

**Files to Modify:**
- `src/admin.js` - Add/verify field required toggle functionality

---

### REQ-002: Make pricing editable at per-appliance level

**Status:** ✅ Already implemented
**Location:** `src/app.js` lines 251-260 (appliance HTML generation)
**Current State:** Each appliance has editable cost input (`cost-${applianceId}`)
**Action Needed:**
- Verify input is functional
- Test calculation updates

**Files to Verify:**
- `src/app.js` - Verify cost input functionality
- `src/appliance_form.html` - Verify HTML structure

---

### REQ-003: Make pricing editable at per-boiler level

**Status:** ✅ Already implemented
**Location:** `src/appliance_form.html` lines 235-249
**Current State:** Boiler has editable cost input (`boilerCostInput`)
**Action Needed:**
- Verify input is functional
- Test calculation updates

**Files to Verify:**
- `src/app.js` - Verify boiler cost calculation
- `src/appliance_form.html` - Verify input structure

---

### REQ-004: Ensure total pricing is editable and working correctly

**Status:** ✅ Already implemented
**Location:** `src/app.js` lines 447-453
**Current State:** Total cost input with manual override support
**Action Needed:**
- Verify manual override functionality
- Test calculation updates

**Files to Verify:**
- `src/app.js` - Verify total calculation logic
- `src/appliance_form.html` - Verify input structure

---

### REQ-005: Fix number input arrows and editability

**Status:** ⚠️ CSS exists, needs verification
**Location:** `src/styles.css` lines 1087-1108
**Current State:** CSS rules for webkit and Firefox arrows exist
**Action Needed:**
- Verify arrows display in all browsers
- Test increment/decrement functionality
- Improve CSS if needed

**Files to Modify:**
- `src/styles.css` - Verify/improve number input arrow CSS

---

### REQ-006: Change auth persistence from LOCAL to SESSION

**Status:** ✅ Already set to SESSION
**Location:** `src/auth.js` line 29
**Current State:** `auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)`
**Action Needed:**
- Verify console message says SESSION (not LOCAL)
- Check for any other auth files that might set LOCAL

**Files to Verify:**
- `src/auth.js` - Verify persistence setting and console message
- Check for other auth-related files

---

## Implementation Order

1. **Verify Existing Implementations** (REQ-001, REQ-002, REQ-003, REQ-004, REQ-006)
   - Check current code state
   - Test functionality
   - Document any issues

2. **Fix Number Input Arrows** (REQ-005)
   - Verify CSS
   - Test across browsers
   - Improve if needed

3. **Enhance Admin Panel** (REQ-001 enhancement)
   - Add field required toggle UI
   - Verify field management

4. **Testing**
   - Test all changes
   - Verify pricing calculations
   - Test number inputs
   - Verify auth persistence

---

## Dependencies

- **Pricing Group:** REQ-002, REQ-003, REQ-004 (verify together)
- **Independent:** REQ-001, REQ-005, REQ-006 (can proceed in parallel)

---

## Files Summary

**Files to Verify:**
- `src/app.js` - Form validation, pricing calculations
- `src/appliance_form.html` - Input structures
- `src/auth.js` - Auth persistence

**Files to Modify:**
- `src/admin.js` - Field required toggle (if needed)
- `src/styles.css` - Number input arrows (if needed)
