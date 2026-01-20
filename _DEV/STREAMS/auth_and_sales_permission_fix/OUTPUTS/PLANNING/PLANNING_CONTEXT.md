# Planning Context

**Stream:** auth_and_sales_permission_fix
**Date:** 2026-01-15T07:00:00.000Z
**Workflow:** PLANNING_ASSESSMENT
**Status:** IN PROGRESS

---

## 🎯 Goal

Fix firebaseConfig duplicate declaration and sales permission denied errors

---

## 📋 Issues Identified

### Issue 1: firebaseConfig Duplicate Declaration ❌ CRITICAL

**Error:** `auth.js:1 Uncaught SyntaxError: Identifier 'firebaseConfig' has already been declared`

**Root Cause:**
- Both `src/auth.js` (line 22) and `src/auth-db.js` (line 21) declare: `const firebaseConfig = window.firebaseConfig;`
- `const` declarations cannot be redeclared in same scope
- If both files load, JavaScript throws duplicate declaration error

**Files Affected:**
- `src/auth.js` - Line 22: `const firebaseConfig = window.firebaseConfig;`
- `src/auth-db.js` - Line 21: `const firebaseConfig = window.firebaseConfig;`

**Impact:** CRITICAL - Blocks page load if both files are loaded

---

### Issue 2: Sales Permission Denied ❌ CRITICAL

**Error:** `permission_denied at /sales: Client doesn't have permission to access the desired data`

**Root Cause:**
- Database rule requires `auth != null` (Firebase Auth)
- Anonymous auth in `admin.html` is async and may not complete before `loadSales` accesses `/sales`
- Database auth doesn't set Firebase Auth state

**Files Affected:**
- `src/admin.js` - Line 612: `const salesRef = db.ref('sales');`
- `src/admin.html` - Lines 436-447: Anonymous auth setup
- `database.rules.json` - Line 45: Sales read rule requires `auth != null`

**Impact:** CRITICAL - Blocks admin panel from loading sales data

---

## 📊 Requirements

1. **Fix firebaseConfig duplicate declaration** ❌ (CRITICAL)
2. **Fix sales permission denied** ❌ (CRITICAL)
3. **Identify root causes** (Required)
4. **Ensure security maintained** (Required)
5. **Test all functionality** (Required)

---

## 🔧 Affected Components

### Authentication System
- `src/auth.js` - Firebase Auth module (legacy)
- `src/auth-db.js` - Database Auth module (current)

### Admin Panel
- `src/admin.html` - Admin panel UI
- `src/admin.js` - Admin panel logic

### Database Rules
- `database.rules.json` - Security rules

---

## 📁 Files Requiring Changes

1. `src/auth.js` - Remove/change `const firebaseConfig` declaration
2. `src/auth-db.js` - Remove/change `const firebaseConfig` declaration
3. `src/admin.html` - Ensure anonymous auth completes before database access
4. `src/admin.js` - Wait for auth state before calling `loadSales`

---

## 🎯 Solution Approaches

### firebaseConfig Fix Options:
1. Remove local `const` declaration, use `window.firebaseConfig` directly
2. Check if `firebaseConfig` already exists before declaring
3. Use different approach to avoid duplicate declarations

### Sales Permission Fix Options:
1. Wait for anonymous auth to complete before loading sales
2. Use auth state listener to wait for auth
3. Add retry logic for permission errors
4. Ensure anonymous auth completes before any database access

---

**Planning Status:** Ready for complexity scoring
**Next Step:** Calculate planning score
