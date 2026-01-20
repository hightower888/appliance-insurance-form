# Redirect Flow Analysis

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** login_redirect_fix
**Workflow:** DISCOVERY_QUICK
**Status:** DISCOVERY ONLY - NO IMPLEMENTATION

---

## Executive Summary

**Issue:** Page reloads instead of redirecting to `/admin` after successful login with `dan.young@wiseguys.co.uk`.

**Root Cause Hypothesis:** Auth system conflict - `login.html` uses `auth-db.js` for login, but `admin.html` may not properly recognize database auth users, causing redirect loop or page reload.

---

## Complete Redirect Flow

### Step 1: User Submits Login Form (`login.html`)

**File:** `src/login.html`
**Line:** 163-168
**Code:**
```javascript
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  await loginUser(username, password); // Calls auth-db.js loginUser
});
```

**Script Load Order:**
1. `services/security-logger.js`
2. `auth-db.js` (database auth)
3. Form handler calls `loginUser` from `auth-db.js`

**Note:** `login.html` does NOT load `auth.js` (Firebase Auth).

---

### Step 2: Login Function Executes (`auth-db.js`)

**File:** `src/auth-db.js`
**Function:** `loginUser(usernameOrEmail, password)`
**Lines:** 114-224

**Flow:**
1. Normalize username/email (line 120-125)
2. Hash password using SHA-256 (line 127-135)
3. Search for user in database `/users` node (line 137-150)
4. Validate password hash (line 152-158)
5. Set `currentUser` variable (line 198)
6. Store in `sessionStorage` as `'currentUser'` (line 201)
7. Log successful login (line 206-208)
8. **Redirect based on role** (lines 210-218):
   ```javascript
   if (foundUser.role === 'admin') {
     window.location.replace('/admin');  // Line 213
   } else if (foundUser.role === 'processor') {
     window.location.replace('/processor');
   } else {
     window.location.replace('/form');
   }
   ```

**Key Finding:** Redirect uses `window.location.replace('/admin')` (NOT `window.location.href`).

---

### Step 3: Vercel Routing (`vercel.json`)

**File:** `vercel.json`
**Line:** 10-13
**Code:**
```json
{
  "source": "/admin",
  "destination": "/admin.html"
}
```

**Behavior:** `/admin` URL is rewritten to `/admin.html` by Vercel.

---

### Step 4: Admin Panel Loads (`admin.html`)

**File:** `src/admin.html`
**Script Load Order:**
1. `services/security-logger.js`
2. `auth-db.js` (database auth)
3. `auth.js` (Firebase Auth) ← **CONFLICT SOURCE**
4. `utils/sanitize.js`
5. `services/field-config.js`
6. `admin.js`
7. Inline script with `getCurrentUserFromDatabaseAuth()` helper

**Auth Check Flow (lines 453-485):**
```javascript
document.addEventListener('DOMContentLoaded', async function() {
  // Check database auth first (auth-db.js) - read directly from sessionStorage
  const dbUser = getCurrentUserFromDatabaseAuth();
  if (dbUser) {
    if (dbUser.role === 'admin') {
      // User is admin, allow access - DO NOT redirect
    } else {
      // User is authenticated but not admin, redirect to form
      window.location.href = '/form';
      return;
    }
  } else {
    // Not authenticated via database auth, check Firebase Auth
    if (typeof checkRole === 'function') {
      const isAdmin = await checkRole('/form');
      if (!isAdmin) {
        return; // Redirected
      }
    } else {
      // No auth system available, redirect to login
      window.location.href = '/login.html';
      return;
    }
  }
  // ... rest of initialization
});
```

**Helper Function (lines 439-450):**
```javascript
function getCurrentUserFromDatabaseAuth() {
  try {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      const dbUser = JSON.parse(stored);
      return dbUser; // Return user regardless of role, let caller check
    }
  } catch (e) {
    console.error('Error reading sessionStorage:', e);
  }
  return null;
}
```

**Key Finding:** `admin.html` has code to check database auth, but there may be timing issues or function conflicts.

---

## Function Conflicts Identified

### Conflict 1: `getCurrentUser()` Function

**auth-db.js (line 251-268):**
```javascript
function getCurrentUser() {
  if (currentUser) {
    return currentUser;
  }
  // Try to get from sessionStorage
  try {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  } catch (error) {
    console.error('Error reading session storage:', error);
  }
  return null;
}
```
**Type:** Synchronous function
**Returns:** User object or null

**auth.js (line 165-179):**
```javascript
async function getCurrentUser() {
  if (!auth || !auth.currentUser) {
    return null;
  }
  const firebaseUser = auth.currentUser;
  const role = await getUserRole(firebaseUser.uid);
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    role: role,
    ...firebaseUser
  };
}
```
**Type:** Async function (returns Promise)
**Returns:** Promise resolving to user object or null

**Impact:** Since `auth.js` loads AFTER `auth-db.js` in `admin.html`, the async version from `auth.js` overwrites the sync version from `auth-db.js`. This means `admin.js` calls to `getCurrentUser()` will use the Firebase Auth version, not the database auth version.

---

### Conflict 2: `checkRole()` Function

**auth-db.js (line 341-358):**
```javascript
async function checkRole(redirectTo = 'appliance_form.html') {
  const authenticated = await checkAuth();
  if (!authenticated) {
    return false;
  }
  const user = getCurrentUser(); // Calls sync version
  if (!user || user.role !== 'admin') {
    if (typeof securityLogger !== 'undefined' && securityLogger.logUnauthorizedAccess) {
      await securityLogger.logUnauthorizedAccess(redirectTo, user?.uid);
    }
    window.location.href = redirectTo;
    return false;
  }
  return true;
}
```

**auth.js (line 320-333):**
```javascript
async function checkRole(redirectTo = 'appliance_form.html') {
  const authenticated = await checkAuth();
  if (!authenticated) {
    return false;
  }
  const user = await getCurrentUser(); // Calls async version
  if (!user || user.role !== 'admin') {
    if (typeof securityLogger !== 'undefined' && securityLogger.logUnauthorizedAccess) {
      await securityLogger.logUnauthorizedAccess(redirectTo, user?.uid);
    }
    window.location.href = redirectTo;
    return false;
  }
  return true;
}
```

**Impact:** Both functions have the same name and signature. Since `auth.js` loads after `auth-db.js`, the Firebase Auth version overwrites the database auth version.

---

## Admin.js Dependencies

**File:** `src/admin.js`
**Function:** `initializeAdmin()` (line 80-87)
**Code:**
```javascript
async function initializeAdmin() {
  // Check admin access
  if (typeof checkRole === 'function') {
    const isAdmin = await checkRole('appliance_form.html');
    if (!isAdmin) {
      return; // Redirected
    }
  }
  // ... rest of initialization
}
```

**Problem:** `admin.js` calls `checkRole()` which, due to script load order, will be the Firebase Auth version, not the database auth version. This means `admin.js` will check Firebase Auth instead of database auth.

**Additional Calls to `getCurrentUser()`:**
- Line 282: `const currentAdmin = await getCurrentUser();` (in `handleCreateUser`)
- Line 533: `const currentAdmin = await getCurrentUser();` (in `handleUpdateUser`)
- Line 579: `const currentAdmin = await getCurrentUser();` (in `handleDeleteUser`)

**Impact:** All these calls will use the Firebase Auth version (async), not the database auth version (sync).

---

## Root Cause Analysis

### Primary Issue: Function Overwriting

1. **Script Load Order in `admin.html`:**
   - `auth-db.js` loads first (line 431)
   - `auth.js` loads second (line 432)
   - `auth.js` functions overwrite `auth-db.js` functions

2. **Result:**
   - `getCurrentUser()` becomes async (Firebase Auth version)
   - `checkRole()` becomes Firebase Auth version
   - `admin.js` uses Firebase Auth functions instead of database auth

3. **When User Logs In via Database Auth:**
   - `sessionStorage` contains user data
   - `admin.html` inline script checks `sessionStorage` correctly
   - BUT `admin.js` calls `getCurrentUser()` which checks Firebase Auth (not `sessionStorage`)
   - Firebase Auth has no user, so `admin.js` may redirect back to login

### Secondary Issue: Timing

- `admin.html` inline script checks database auth on `DOMContentLoaded`
- `admin.js` `initializeAdmin()` may run before or after the inline script
- If `admin.js` runs first and redirects, the inline script never executes

---

## Files Affecting Redirect Flow

1. **`src/auth-db.js`** - Login function, redirect logic (line 213: `window.location.replace('/admin')`)
2. **`src/login.html`** - Login form handler (line 168: calls `loginUser` from `auth-db.js`)
3. **`src/admin.html`** - Admin panel auth check (lines 453-485: checks database auth, then Firebase Auth)
4. **`src/admin.js`** - Admin logic (line 82: calls `checkRole`, lines 282/533/579: calls `getCurrentUser`)
5. **`src/auth.js`** - Firebase Auth (conflicts with `auth-db.js` functions)
6. **`vercel.json`** - Routing configuration (`/admin` -> `/admin.html`)

---

## Findings Summary

### ✅ What Works
- Login function in `auth-db.js` correctly stores user in `sessionStorage`
- Redirect in `auth-db.js` uses `window.location.replace('/admin')` (correct)
- Vercel routing correctly maps `/admin` to `/admin.html`
- `admin.html` inline script has helper to read from `sessionStorage`

### ❌ What Doesn't Work
- Function conflicts: `auth.js` overwrites `auth-db.js` functions
- `admin.js` uses Firebase Auth functions instead of database auth
- Script load order causes function overwriting
- `admin.js` may redirect before `admin.html` inline script can check database auth

---

## Recommended Fixes (For Planning Phase)

1. **Fix Function Conflicts:**
   - Rename functions in one of the auth files to avoid conflicts
   - OR: Use namespaced functions (e.g., `getCurrentUserDB()`, `getCurrentUserFirebase()`)
   - OR: Override `getCurrentUser()` in `admin.html` to check database auth first

2. **Fix Admin.js Dependencies:**
   - Update `admin.js` to check database auth before Firebase Auth
   - OR: Override `getCurrentUser()` and `checkRole()` in `admin.html` before loading `admin.js`

3. **Fix Script Load Order:**
   - Ensure `admin.html` inline script runs before `admin.js` initialization
   - OR: Move database auth check into `admin.js` initialization

4. **Ensure Redirect Completes:**
   - Verify `window.location.replace()` is not being intercepted
   - Add console logs to track redirect execution
   - Check for JavaScript errors that might prevent redirect

---

## Next Steps

1. Complete deep dive analysis of auth system conflicts
2. Document admin panel auth check logic in detail
3. Generate complete discovery summary
4. Hand off to Planning phase with all findings
