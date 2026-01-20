# Implementation Plan

**Date:** 2026-01-20  
**Stream:** crm_bug_fixes_round2  
**Workflow:** PLANNING  
**Status:** ✅ Planning Complete

## Planning Summary

**Complexity:** 40/100 (Low-Medium)  
**Estimated Tasks:** 8  
**Implementation Order:** Bug 1 → Bug 5 → Bug 2 → Bug 3 → Bug 4

## Bug Fix Tasks

### Bug 1: clearFilters Scope/Timing Issue
**File:** `src/crm.js`  
**Status:** Partial fix - window assignment exists but timing issue possible

**Tasks:**
1. Verify `window.clearFilters = clearFilters;` is at line 1668
2. Check script loading order in HTML
3. Verify function is assigned before HTML onclick tries to call it

**Priority:** High  
**Estimated Time:** 15 minutes

---

### Bug 2: Variable Redeclaration
**Files:** `src/services/security-logger.js`, `src/app.js`  
**Status:** Partial fix - code shows `let authUser` but errors persist

**Tasks:**
1. Search entire codebase for any remaining `const user` in these functions
2. Verify no other variable conflicts
3. Check for cached code issues

**Priority:** High  
**Estimated Time:** 20 minutes

---

### Bug 3: Firebase Initialization
**File:** `src/services/comments-service.js`  
**Status:** Partial fix - checks exist but may not cover all paths

**Tasks:**
1. Verify all code paths check Firebase initialization
2. Ensure `anonymousAuthReady` is properly awaited
3. Verify fallback to localStorage works
4. Check if constructor should delay initialization

**Priority:** Medium  
**Estimated Time:** 25 minutes

---

### Bug 4: Permission Errors
**Files:** `src/crm.js`, `src/services/form-renderer.js`, `src/app.js`, `src/services/security-logger.js`  
**Status:** Partial fix - auth checks exist but errors persist

**Tasks:**
1. Verify `window.anonymousAuthReady` is set correctly
2. Check Firebase security rules allow anonymous auth
3. Add retry logic if auth fails
4. Verify all database access waits for auth
5. Add better error handling

**Priority:** Critical  
**Estimated Time:** 45 minutes

---

### Bug 5: DOM Timing
**Files:** `src/services/keyboard-navigation-service.js`, `src/services/user-preferences-service.js`  
**Status:** Partial fix - checks exist but may be incomplete

**Tasks:**
1. Verify all DOM access is protected in keyboard-navigation-service
2. Verify `applyTheme()` fully protects `document.body.classList` access
3. Ensure all methods check for DOM readiness

**Priority:** Medium  
**Estimated Time:** 20 minutes

## Implementation Order

1. **Bug 1** - clearFilters (quick verification)
2. **Bug 5** - DOM timing (complete missing checks)
3. **Bug 2** - Variable redeclaration (verify all instances)
4. **Bug 3** - Firebase init (verify all paths)
5. **Bug 4** - Permission errors (most complex)

## Dependencies

- Script load order → Bug 1
- DOM readiness → Bug 5
- Firebase initialization → Bug 3, Bug 4
- Auth state → Bug 4

## Testing Strategy

1. Clear browser cache
2. Test each fix individually
3. Check browser console for errors
4. Verify functionality works
5. Test edge cases

## Risk Assessment

- **Low Risk:** Bug 1, Bug 2, Bug 5
- **Medium Risk:** Bug 3
- **High Risk:** Bug 4 (may need Firebase rules changes)

---

**Planning Complete** ✅
