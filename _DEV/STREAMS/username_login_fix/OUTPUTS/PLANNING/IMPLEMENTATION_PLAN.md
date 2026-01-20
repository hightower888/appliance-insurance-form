---
title: Implementation Plan - Username Login Fix
created: 2026-01-12T00:00:00Z
workflow: PLANNING_SIMPLE_AI
complexity: simple
estimated_tasks: 8
estimated_duration: 1 hour
---

# Implementation Plan - Username Login Fix

## Executive Summary

**Project Type:** Enhancement (Frontend UI/UX Fix)
**Complexity Level:** Simple
**Total Tasks:** 8
**Estimated Duration:** 1 hour
**Files Affected:** 1 file (src/login.html)

## Requirements

**Primary Requirement:**
Change the login form frontend to use username instead of email as the login credential, since the backend already supports username login but the frontend currently requires email.

**Success Criteria:**
- [ ] Login form displays "Username" field instead of "Email"
- [ ] Users can log in using username and password
- [ ] Validation messages reference username appropriately
- [ ] No email requirement in the login form
- [ ] Backend authentication works correctly with username
- [ ] All user roles can log in (admin, processor, agent)

## Features

### Feature 1: Update Login Form HTML
Change the email input field to username input field with appropriate labels and placeholders.

### Feature 2: Update JavaScript Form Handling
Update all JavaScript references from email to username, including variable names, validation, and error handling.

### Feature 3: Switch Authentication Script
Change script reference from auth.js (Firebase Auth, email-based) to auth-db.js (database auth, username-supported).

### Feature 4: Update Forgot Password Functionality
Update forgot password handler to work with username instead of email.

## Task Breakdown

**Total Tasks:** 8
**Estimated Lines:** ~50 lines modified

### Phase 1: Implementation (All tasks in single phase)

#### TASK_001: Change email input to username input in HTML
- **File:** `src/login.html`
- **Action:** EDIT_FILE
- **Lines:** ~10 lines
- **Dependencies:** None
- **Priority:** P0
- **Description:** Change the email input field (lines 31-40) to username input field with type="text", update id and name attributes, and change placeholder
- **Acceptance Criteria:**
  - [ ] Input field type changed from "email" to "text"
  - [ ] Field id changed from "email" to "username"
  - [ ] Field name changed from "email" to "username"
  - [ ] Placeholder updated to "Enter your username"
  - [ ] Error message span id updated to "username-error"

#### TASK_002: Update field label
- **File:** `src/login.html`
- **Action:** EDIT_FILE
- **Lines:** ~1 line
- **Dependencies:** [TASK_001]
- **Priority:** P0
- **Description:** Update label text from "Email" to "Username" (line 31)
- **Acceptance Criteria:**
  - [ ] Label text displays "Username" instead of "Email"
  - [ ] Label for attribute matches username input id

#### TASK_003: Update JavaScript variable references
- **File:** `src/login.html`
- **Action:** EDIT_FILE
- **Lines:** ~5 lines
- **Dependencies:** [TASK_001]
- **Priority:** P0
- **Description:** Change emailInput variable to usernameInput and update all references (lines 127, 139, 145, 150, 186, 189, 191)
- **Acceptance Criteria:**
  - [ ] Variable name changed from emailInput to usernameInput
  - [ ] All references to emailInput updated to usernameInput
  - [ ] getElementById calls updated to use "username"

#### TASK_004: Update validation messages
- **File:** `src/login.html`
- **Action:** EDIT_FILE
- **Lines:** ~3 lines
- **Dependencies:** [TASK_003]
- **Priority:** P0
- **Description:** Update validation error messages to reference username instead of email (lines 145, 150)
- **Acceptance Criteria:**
  - [ ] Error message text changed from "Email is required" to "Username is required"
  - [ ] Error message element id updated to "username-error"

#### TASK_005: Update error handling messages
- **File:** `src/login.html`
- **Action:** EDIT_FILE
- **Lines:** ~2 lines
- **Dependencies:** [TASK_003]
- **Priority:** P0
- **Description:** Update error messages in catch blocks and forgot password handler to reference username
- **Acceptance Criteria:**
  - [ ] Error messages reference username appropriately
  - [ ] User-facing messages updated

#### TASK_006: Switch script reference from auth.js to auth-db.js
- **File:** `src/login.html`
- **Action:** EDIT_FILE
- **Lines:** ~1 line
- **Dependencies:** None
- **Priority:** P0
- **Description:** Change script src from "auth.js" to "auth-db.js" (line 69)
- **Acceptance Criteria:**
  - [ ] Script src attribute changed to "auth-db.js"
  - [ ] auth-db.js file exists and supports username login

#### TASK_007: Update forgot password functionality
- **File:** `src/login.html`
- **Action:** EDIT_FILE
- **Lines:** ~10 lines
- **Dependencies:** [TASK_003]
- **Priority:** P1
- **Description:** Update forgot password handler (lines 184-204) to work with username. Since password reset requires email, show appropriate message or implement username-to-email lookup
- **Acceptance Criteria:**
  - [ ] Forgot password handler uses username instead of email
  - [ ] Appropriate message shown if email lookup needed
  - [ ] User experience is clear

#### TASK_008: Test username login end-to-end
- **File:** Manual testing
- **Action:** TEST
- **Lines:** N/A
- **Dependencies:** [TASK_001, TASK_002, TASK_003, TASK_004, TASK_005, TASK_006, TASK_007]
- **Priority:** P0
- **Description:** Test complete login flow with username for all user roles (admin, processor, agent)
- **Acceptance Criteria:**
  - [ ] Username login works for admin role
  - [ ] Username login works for processor role
  - [ ] Username login works for agent role
  - [ ] Error handling works correctly
  - [ ] Redirects work correctly after login
  - [ ] Password validation works

## Dependencies

**Task Sequence:**
1. TASK_001 → TASK_002 → TASK_003 → TASK_004 → TASK_005 → TASK_007
2. TASK_006 (can be done in parallel with TASK_001-005)
3. TASK_008 (depends on all above tasks)

**Blocking Tasks:**
- TASK_001: Must complete first (foundation for all other changes)
- TASK_006: Must complete before TASK_008 (needs auth-db.js loaded)
- TASK_008: Must complete last (final validation)

**Parallel Tasks:**
- TASK_006 can be done in parallel with TASK_001-005 (script reference change is independent)

## File Manifest

**Files to Modify (1):**
1. `src/login.html` - Change email field to username, update all JavaScript references, switch to auth-db.js

**Files to Reference (2):**
1. `src/auth-db.js` - Already supports username login (no changes needed)
2. `src/auth.js` - No longer used for login (kept for reference)

## Validation Checklist

**Pre-Implementation:**
- [x] All requirements understood
- [x] File paths verified
- [x] Dependencies mapped
- [x] Backend compatibility confirmed

**During Implementation:**
- [ ] Follow task sequence
- [ ] Test each task upon completion
- [ ] Verify no breaking changes

**Post-Implementation:**
- [ ] All acceptance criteria met
- [ ] Username login works for all roles
- [ ] Error handling works correctly
- [ ] No email requirement remains

## Risk Assessment

**Risks:** MINIMAL (simple project)

**Potential Issues:**
- **Issue:** Forgot password requires email lookup from username
  **Mitigation:** Show clear message or implement username-to-email lookup
  **Likelihood:** LOW
- **Issue:** Existing users may have email but not username
  **Mitigation:** Backend auth-db.js already handles both email and username
  **Likelihood:** LOW

## Estimated Timeline

**Total Duration:** 1 hour

**Breakdown:**
- Implementation: 45 minutes
- Testing: 15 minutes
- Documentation: 0 minutes (inline comments only)

**Can be completed in:** 1 session

## Next Steps

1. **Begin Implementation:** Start with TASK_001
2. **Follow Sequence:** Complete tasks in order
3. **Test Continuously:** Test after each task
4. **Mark Complete:** Check off acceptance criteria

## Success Metrics

- [ ] All 8 tasks completed
- [ ] All acceptance criteria met
- [ ] Username login works for all roles
- [ ] No breaking changes
- [ ] Ready for deployment

---

**Planning Complete:** 2026-01-12T00:00:00Z
**Ready for:** Execution Phase (EXECUTION_SIMPLE_AI)
