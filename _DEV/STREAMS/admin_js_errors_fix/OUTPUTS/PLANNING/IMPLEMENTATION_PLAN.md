---
title: "Implementation Plan - CSP and Permission Errors Fix"
created: 2026-01-14
workflow: PLANNING_SIMPLE_AI
status: ready
estimated_tasks: 4
estimated_duration: 15 minutes
---

# Implementation Plan - CSP and Permission Errors Fix

**Generated:** 2026-01-14  
**Stream:** admin_js_errors_fix  
**Workflow:** PLANNING_SIMPLE_AI  
**Status:** Ready for Implementation

---

## Overview

Fix two critical errors preventing user creation in admin panel:
1. **CSP Violation:** Cloud Function URL blocked by Content Security Policy
2. **Permission Denied:** Database write fails for auth-db.js authenticated admins

---

## Features Identified

### Feature 1: Fix CSP Violation
- **Issue:** Cloud Function URL not in CSP `connect-src` directive
- **Location:** `vercel.json` headers configuration
- **Solution:** Add Cloud Functions domain to CSP allowlist

### Feature 2: Fix Database Permission Error
- **Issue:** Database rules don't allow writes from auth-db.js authenticated users
- **Location:** `database.rules.json` users node write rule
- **Solution:** Update rule to properly check admin role from auth-db.js users

---

## Task Breakdown

### TASK_001: Add Cloud Functions Domain to CSP
- **File:** `vercel.json`
- **Action:** EDIT_FILE
- **Lines:** ~1 line (add domain to connect-src)
- **Dependencies:** None
- **Priority:** P0 (critical - blocks Cloud Function)
- **Description:** Add `https://us-central1-appliance-bot.cloudfunctions.net` to the `connect-src` directive in Content-Security-Policy header
- **Acceptance Criteria:**
  - [ ] Cloud Function URL added to connect-src directive
  - [ ] CSP syntax remains valid
  - [ ] No other CSP directives affected
  - [ ] Cloud Function fetch requests no longer blocked

**Current CSP (line 53):**
```
connect-src 'self' wss://*.firebaseio.com https://*.firebaseio.com https://*.googleapis.com https://*.google.com https://www.gstatic.com https://vercel.live
```

**Updated CSP should include:**
```
connect-src 'self' wss://*.firebaseio.com https://*.firebaseio.com https://*.googleapis.com https://*.google.com https://www.gstatic.com https://vercel.live https://us-central1-appliance-bot.cloudfunctions.net
```

---

### TASK_002: Verify Database Rules for auth-db.js Users
- **File:** `database.rules.json`
- **Action:** EDIT_FILE (if needed)
- **Lines:** ~1-2 lines (may need rule adjustment)
- **Dependencies:** None
- **Priority:** P0 (critical - blocks fallback method)
- **Description:** Review and fix database write rule for users node to properly allow admin users authenticated via auth-db.js to create users
- **Acceptance Criteria:**
  - [ ] Rule allows writes when `createdBy` field references an existing admin user
  - [ ] Rule properly checks admin role from database (not just Firebase Auth)
  - [ ] Fallback user creation method works
  - [ ] Existing Firebase Auth admin writes still work

**Current Rule (line 8):**
```json
".write": "(auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin') || (newData.hasChild('createdBy') && root.child('users').child(newData.child('createdBy').val()).child('role').val() == 'admin')"
```

**Analysis:**
- Rule should work, but may need to check if `createdBy` value is a valid admin user ID
- May need to verify the rule logic handles auth-db.js user IDs correctly

---

### TASK_003: Test Cloud Function Connection (After CSP Fix)
- **File:** N/A (testing)
- **Action:** TEST
- **Lines:** N/A
- **Dependencies:** [TASK_001]
- **Priority:** P0
- **Description:** Verify Cloud Function connection works after CSP fix
- **Acceptance Criteria:**
  - [ ] No CSP violation errors in console
  - [ ] Cloud Function fetch request succeeds
  - [ ] User creation via Cloud Function works
  - [ ] Admin stays logged in after user creation

---

### TASK_004: Test Database Fallback Method (After Permission Fix)
- **File:** N/A (testing)
- **Action:** TEST
- **Lines:** N/A
- **Dependencies:** [TASK_002]
- **Priority:** P0
- **Description:** Verify database fallback method works after permission fix
- **Acceptance Criteria:**
  - [ ] No permission denied errors
  - [ ] User creation via fallback method works
  - [ ] Created user has correct data structure
  - [ ] Admin can create users when Cloud Function unavailable

---

## Implementation Sequence

1. **TASK_001** - Fix CSP (blocks Cloud Function)
2. **TASK_002** - Fix Database Rules (blocks fallback)
3. **TASK_003** - Test Cloud Function (depends on TASK_001)
4. **TASK_004** - Test Fallback (depends on TASK_002)

**Note:** TASK_001 and TASK_002 can be done in parallel, but both must complete before testing.

---

## Deployment

After implementation:
1. Deploy `vercel.json` changes to Vercel
2. Deploy `database.rules.json` changes to Firebase
3. Test both methods (Cloud Function and fallback)

---

## Risk Assessment

### Low Risk
- CSP change is additive (adding domain, not removing)
- Database rule change is targeted (only affects user creation)
- Both changes are isolated to specific functionality

### Mitigation
- Test both methods after deployment
- Keep fallback method as backup if Cloud Function fails
- Monitor for any new errors after deployment

---

## Success Criteria

- ✅ No CSP violation errors in console
- ✅ Cloud Function connection succeeds
- ✅ Database fallback method works
- ✅ User creation succeeds via either method
- ✅ Admin stays logged in after user creation
- ✅ No permission denied errors

---

**Plan Complete - Ready for Implementation**
