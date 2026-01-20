# Implementation Plan

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** admin_editable_fields_pricing_v2
**Complexity:** Simple (22/100)
**Estimated Duration:** 1-2 hours

---

## Task Breakdown

### Phase 1: Verification & Analysis

#### Task 1.1: Verify Form Validation (REQ-001)
**File:** `src/app.js`
**Action:** Verify
**Lines:** 623-636
**Description:** Confirm that only appliance type is required, make/brand/model/age are optional
**Status:** Already implemented, verify only

#### Task 1.2: Verify Pricing Editability (REQ-002, REQ-003, REQ-004)
**Files:** `src/app.js`, `src/appliance_form.html`
**Action:** Verify
**Description:** 
- Verify per-appliance cost inputs are editable
- Verify per-boiler cost input is editable  
- Verify total cost input is editable with manual override
**Status:** Already implemented, verify functionality

#### Task 1.3: Verify Auth Persistence (REQ-006)
**File:** `src/auth.js`
**Action:** Verify
**Lines:** 28-35
**Description:** Confirm auth persistence is set to SESSION and console message is correct
**Status:** Already set to SESSION, verify console message

---

### Phase 2: Fixes & Improvements

#### Task 2.1: Fix Number Input Arrows (REQ-005)
**File:** `src/styles.css`
**Action:** Modify
**Lines:** 1075-1108
**Description:** 
- Verify number input arrows display in all browsers
- Improve CSS if needed for better visibility
- Test increment/decrement functionality
**Changes:**
- Ensure `-webkit-inner-spin-button` and `-webkit-outer-spin-button` are visible
- Verify Firefox `-moz-appearance: textfield` doesn't hide arrows
- Add explicit height and opacity for better visibility

#### Task 2.2: Update Admin Panel Field Management (REQ-001 Enhancement)
**File:** `src/admin.js`
**Action:** Modify
**Description:** 
- Verify/implement field required toggle functionality
- Ensure admin can toggle required status for any field
- Update UI to show required status clearly
**Status:** May need implementation or verification

---

### Phase 3: Testing

#### Task 3.1: Test Form Validation
**Description:** 
- Test form submission with only appliance type filled
- Verify make/brand/model/age are not required
- Test validation error messages

#### Task 3.2: Test Pricing Calculations
**Description:**
- Test per-appliance cost editing
- Test per-boiler cost editing
- Test total cost manual override
- Verify calculations update correctly

#### Task 3.3: Test Number Inputs
**Description:**
- Test increment/decrement arrows in Chrome, Firefox, Safari
- Verify arrows are visible and functional
- Test keyboard input
- Test step increments

#### Task 3.4: Test Auth Persistence
**Description:**
- Verify console shows "Auth persistence set to SESSION"
- Test login/logout behavior
- Verify session persistence works correctly

---

## Implementation Summary

**Total Tasks:** 10
- Verification: 3 tasks
- Fixes: 2 tasks  
- Testing: 4 tasks

**Files to Modify:**
- `src/styles.css` - Number input arrows (REQ-005)
- `src/admin.js` - Field management (REQ-001 enhancement)

**Files to Verify:**
- `src/app.js` - Validation and pricing
- `src/appliance_form.html` - Input structures
- `src/auth.js` - Auth persistence

**Estimated Effort:**
- Verification: 30 minutes
- Fixes: 30-60 minutes
- Testing: 30 minutes
- **Total: 1.5-2 hours**

---

## Success Criteria

- [ ] Make/brand/model/age are not required (verified)
- [ ] Pricing editable at all levels (verified/working)
- [ ] Number input arrows visible and functional
- [ ] Auth persistence set to SESSION (verified)
- [ ] Admin panel supports field required toggle
- [ ] All tests pass

---

## Next Steps

1. Execute Phase 1 (Verification)
2. Execute Phase 2 (Fixes)
3. Execute Phase 3 (Testing)
4. Document completion
