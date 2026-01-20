# Fix Implementation Plan

**Stream:** crm_debug_fixes  
**Date:** 2026-01-20  
**Status:** Ready for Implementation

---

## Summary

All service declaration conflicts have been fixed. One remaining issue: `searchLeads` function hoisting may need improvement.

---

## Fixes Applied ✅

### 1. Service Singleton Declarations
- ✅ Removed `let kpiCalculator = null;`
- ✅ Removed `let chartService = null;`
- ✅ Removed `let searchService = null;`
- ✅ All references now use `window.serviceName` pattern

### 2. Function Hoisting
- ✅ `closeLeadDetailModal` moved to top of file (line 53)
- ✅ `closeUploadModal` moved to top of file (line 65)
- ⚠️ `searchLeads` exists at line 1422 (function declaration, should be hoisted)

---

## Remaining Fix Needed

### Issue: searchLeads Function Location
**Current State:**
- Function defined at line 1422
- Function declarations are hoisted in JavaScript
- HTML script block at line 408 tries to expose it

**Recommendation:**
Move `searchLeads` function definition earlier in the file (before `initializeCRM` function) to ensure it's definitely available when HTML script block executes.

**Location:** Move to around line 70-80, after `closeUploadModal` function.

---

## Implementation Steps

1. **Move searchLeads Function**
   - Cut function from line 1422
   - Paste after `closeUploadModal` function (around line 70)
   - Verify function still works correctly

2. **Test in Browser**
   - Verify no console errors
   - Test search functionality
   - Verify all services accessible

3. **Deploy**
   - Deploy to Vercel
   - Deploy to Firebase
   - Verify production works

---

## Testing Checklist

- [ ] No duplicate declaration errors in console
- [ ] `searchLeads` function accessible from HTML
- [ ] Search functionality works end-to-end
- [ ] All services (kpiCalculator, chartService, searchService) accessible
- [ ] Modal close functions work
- [ ] No other JavaScript errors

---

## Risk Assessment

**Low Risk:**
- Moving function definition is safe (function declarations are hoisted)
- All service fixes are already applied
- Changes are minimal and isolated

**Mitigation:**
- Test thoroughly before deployment
- Keep backup of current working state
- Deploy to staging first if available

---

**Status:** Ready for Implementation  
**Estimated Time:** 15 minutes  
**Priority:** High (fixes broken functionality)
