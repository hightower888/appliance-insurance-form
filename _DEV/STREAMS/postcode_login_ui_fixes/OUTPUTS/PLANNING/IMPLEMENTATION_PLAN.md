# Implementation Plan

**Generated:** 2026-01-15T07:50:00.000Z  
**Stream:** postcode_login_ui_fixes  
**Planning Tier:** SIMPLE  
**Total Tasks:** 14

---

## Priority Order

**CRITICAL:** REQ-003 (Login fix) must be completed and deployed FIRST before any other work.

1. **REQ-003** (Critical): Login fix - 5 tasks → **DEPLOY** → Then proceed to others
2. **REQ-001** (Critical): Postcode lookup fix - 4 tasks
3. **REQ-002** (High): UI improvement - 3 tasks
4. **REQ-004** (High): Account creation verification - 2 tasks

---

## Phase 1: REQ-003 - Login Fix (MUST COMPLETE & DEPLOY FIRST)

### Task 1: Investigate Kenan Login Issue
- **File:** `src/auth-db.js`, `src/login.html`
- **Action:** Debug
- **Description:** Check database for Kenan user existence, verify password hash algorithm matches, check account status (active/inactive), test login flow with console logging
- **Dependencies:** None
- **Priority:** Critical

### Task 2: Debug Login Function
- **File:** `src/auth-db.js` (lines 119-230)
- **Action:** Debug
- **Description:** Review loginUser() function for issues: case sensitivity in username/email matching, brute force protection logic, password hash comparison, error handling
- **Dependencies:** Task 1
- **Priority:** Critical

### Task 3: Fix Identified Login Issue
- **File:** `src/auth-db.js`, `src/login.html` (if needed)
- **Action:** Modify
- **Description:** Apply fix based on investigation findings (e.g., fix password hash, account status, case sensitivity, or user creation)
- **Dependencies:** Task 2
- **Priority:** Critical

### Task 4: Test Login Fix
- **File:** `src/login.html`
- **Action:** Test
- **Description:** Verify Kenan can log in successfully, test other users to ensure no regression, verify redirects work correctly
- **Dependencies:** Task 3
- **Priority:** Critical

### Task 5: Deploy Login Fix to Production
- **File:** N/A (deployment)
- **Action:** Deploy
- **Description:** Deploy to Vercel production using `vercel --prod --yes`. Verify deployment successful and login works in production.
- **Dependencies:** Task 4
- **Priority:** Critical
- **BLOCKING:** All other requirements must wait until this completes

---

## Phase 2: REQ-001 - Postcode Lookup Fix (After REQ-003 Deployment)

### Task 6: Debug Postcode Service Loading
- **File:** `src/appliance_form.html` (line 716), `src/app.js` (line 175)
- **Action:** Debug
- **Description:** Check script tag order, verify `services/postcode-lookup.js` loads correctly, check browser console for errors, verify `postcodeLookup` object is available
- **Dependencies:** Task 5 (REQ-003 deployment)
- **Priority:** Critical

### Task 7: Debug Postcode API Calls
- **File:** `src/services/postcode-lookup.js` (lines 19-70)
- **Action:** Debug
- **Description:** Test Postcodes.io API directly, check CORS issues, verify network connectivity, test with sample postcodes, check error handling
- **Dependencies:** Task 6
- **Priority:** Critical

### Task 8: Fix Postcode Event Handlers
- **File:** `src/app.js` (lines 664-741)
- **Action:** Modify
- **Description:** Fix setupPostcodeLookup() timing issues, ensure DOM elements (postcodeLookupBtn, postcode) are available when function runs, verify event listeners attach correctly
- **Dependencies:** Task 7
- **Priority:** Critical

### Task 9: Test Postcode Lookup
- **File:** `src/appliance_form.html`
- **Action:** Test
- **Description:** Test postcode lookup end-to-end: enter postcode, click lookup button, verify address fields populate correctly, test error handling
- **Dependencies:** Task 8
- **Priority:** Critical

---

## Phase 3: REQ-002 - Postcode Lookup UI Improvement (After REQ-003 Deployment)

### Task 10: Improve Button Styling
- **File:** `src/appliance_form.html` (lines 128-134), `src/styles.css`
- **Action:** Modify
- **Description:** Enhance postcodeLookupBtn styling - improve button appearance, add hover states, better spacing, more professional look
- **Dependencies:** Task 5 (REQ-003 deployment)
- **Priority:** High

### Task 11: Enhance Status Message Display
- **File:** `src/appliance_form.html` (line 137), `src/app.js` (lines 748-776)
- **Action:** Modify
- **Description:** Improve postcodeLookupStatus visibility and styling - better colors, clearer typography, improved positioning, better success/error/info states
- **Dependencies:** Task 10
- **Priority:** High

### Task 12: Add Better Visual Feedback
- **File:** `src/app.js` (lines 691-731), `src/styles.css`
- **Action:** Modify
- **Description:** Improve loading states - add spinner or progress indicator, better button disabled state, smoother transitions, clearer user feedback during lookup
- **Dependencies:** Task 11
- **Priority:** High

---

## Phase 4: REQ-004 - Account Creation Verification (After REQ-003 Deployment)

### Task 13: Verify Admin Panel Account Creation
- **File:** `src/admin.js` (lines 400-415), `src/admin.html`
- **Action:** Verify
- **Description:** Test handleCreateUser function - create user with just username (no email), verify system email is generated, confirm systemEmail flag is set, verify user can log in with username
- **Dependencies:** Task 5 (REQ-003 deployment)
- **Priority:** High

### Task 14: Check for Public Signup Flow
- **File:** `src/` (all files)
- **Action:** Verify
- **Description:** Search codebase for public signup/registration forms, verify no email requirement exists in any signup flow, confirm only admin panel creates accounts
- **Dependencies:** Task 13
- **Priority:** High

---

## Summary

**Total Tasks:** 14
- **Phase 1 (REQ-003):** 5 tasks + deployment (BLOCKING)
- **Phase 2 (REQ-001):** 4 tasks
- **Phase 3 (REQ-002):** 3 tasks
- **Phase 4 (REQ-004):** 2 tasks

**Critical Path:** Tasks 1-5 (REQ-003) must complete and deploy before any other work begins.

**Estimated Duration:** 
- Phase 1: ~30-45 minutes (including deployment)
- Phase 2: ~20-30 minutes
- Phase 3: ~15-20 minutes
- Phase 4: ~10-15 minutes
- **Total:** ~75-110 minutes

---

**Status:** Ready for Implementation  
**Next Step:** Begin Phase 1, Task 1 (Investigate Kenan Login Issue)
