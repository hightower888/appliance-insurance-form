# Task Breakdown

**Stream:** auth_and_sales_permission_fix
**Date:** 2026-01-15T07:15:00.000Z
**Workflow:** PLANNING_SIMPLE_AI
**Total Tasks:** 6

---

## Feature 1: Fix firebaseConfig Duplicate Declaration

### TASK_001: Remove const firebaseConfig from auth.js
- **File:** `src/auth.js`
- **Action:** EDIT_FILE
- **Lines:** ~2 lines (remove line 22, update references)
- **Dependencies:** None
- **Priority:** P0 (CRITICAL)
- **Description:** Remove `const firebaseConfig = window.firebaseConfig;` declaration and use `window.firebaseConfig` directly throughout the file
- **Acceptance Criteria:**
  - [ ] No `const firebaseConfig` declaration in auth.js
  - [ ] All references to `firebaseConfig` use `window.firebaseConfig` directly
  - [ ] File still initializes Firebase correctly
  - [ ] No syntax errors

### TASK_002: Remove const firebaseConfig from auth-db.js
- **File:** `src/auth-db.js`
- **Action:** EDIT_FILE
- **Lines:** ~2 lines (remove line 21, update references)
- **Dependencies:** None
- **Priority:** P0 (CRITICAL)
- **Description:** Remove `const firebaseConfig = window.firebaseConfig;` declaration and use `window.firebaseConfig` directly throughout the file
- **Acceptance Criteria:**
  - [ ] No `const firebaseConfig` declaration in auth-db.js
  - [ ] All references to `firebaseConfig` use `window.firebaseConfig` directly
  - [ ] File still initializes Firebase correctly
  - [ ] No syntax errors

---

## Feature 2: Fix Sales Permission Denied

### TASK_003: Ensure anonymous auth completes before database access in admin.html
- **File:** `src/admin.html`
- **Action:** EDIT_FILE
- **Lines:** ~15 lines (modify anonymous auth script)
- **Dependencies:** None
- **Priority:** P0 (CRITICAL)
- **Description:** Modify anonymous auth sign-in to wait for completion before allowing database access. Use Promise or auth state listener to ensure auth is ready.
- **Acceptance Criteria:**
  - [ ] Anonymous auth sign-in completes before any database access
  - [ ] Auth state is verified before proceeding
  - [ ] Error handling for auth failures
  - [ ] Works for both form_fields and sales access

### TASK_004: Wait for auth state before loadSales in admin.js
- **File:** `src/admin.js`
- **Action:** EDIT_FILE
- **Lines:** ~10 lines (modify loadSales function)
- **Dependencies:** [TASK_003]
- **Priority:** P0 (CRITICAL)
- **Description:** Modify `loadSales` function to wait for Firebase Auth state (anonymous auth) before accessing `/sales` database path. Use auth state listener or check auth.currentUser.
- **Acceptance Criteria:**
  - [ ] loadSales waits for auth state before accessing /sales
  - [ ] No permission denied errors
  - [ ] Sales data loads successfully
  - [ ] Error handling for auth/permission failures

---

## Testing & Validation

### TASK_005: Test firebaseConfig fix
- **File:** Manual testing
- **Action:** TEST
- **Lines:** N/A
- **Dependencies:** [TASK_001, TASK_002]
- **Priority:** P0 (CRITICAL)
- **Description:** Test that both auth.js and auth-db.js can be loaded without duplicate declaration errors. Verify pages load correctly.
- **Acceptance Criteria:**
  - [ ] No firebaseConfig duplicate declaration errors in console
  - [ ] All pages load without syntax errors
  - [ ] Firebase initializes correctly
  - [ ] Works even if both files accidentally load

### TASK_006: Test sales permission fix
- **File:** Manual testing
- **Action:** TEST
- **Lines:** N/A
- **Dependencies:** [TASK_003, TASK_004]
- **Priority:** P0 (CRITICAL)
- **Description:** Test that admin panel can load sales data without permission errors. Verify anonymous auth works correctly.
- **Acceptance Criteria:**
  - [ ] No permission denied errors when loading sales
  - [ ] Admin panel displays sales data correctly
  - [ ] Anonymous auth completes successfully
  - [ ] All database access works correctly

---

## Task Sequence

**Parallel Tasks:**
- TASK_001 and TASK_002 can be done in parallel (both fix const declarations)

**Sequential Tasks:**
- TASK_003 must complete before TASK_004 (auth setup before use)
- TASK_001 and TASK_002 must complete before TASK_005 (fixes before testing)
- TASK_003 and TASK_004 must complete before TASK_006 (fixes before testing)

**Execution Order:**
1. TASK_001: Fix auth.js (parallel with TASK_002)
2. TASK_002: Fix auth-db.js (parallel with TASK_001)
3. TASK_003: Fix admin.html auth setup
4. TASK_004: Fix admin.js loadSales
5. TASK_005: Test firebaseConfig fix
6. TASK_006: Test sales permission fix

---

**Total Tasks:** 6
**Estimated Duration:** < 30 minutes
**Complexity:** Simple
