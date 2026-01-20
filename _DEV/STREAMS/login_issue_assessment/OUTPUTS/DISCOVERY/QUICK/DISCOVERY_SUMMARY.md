# Discovery Summary

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** login_issue_assessment
**Workflow:** DISCOVERY_QUICK
**Status:** ✅ COMPLETE

---

## Executive Summary

**Root Cause Identified:** Missing `passwordHash` field in database for `dan.young@wiseguys.co.uk` admin account.

**Primary Issue:** Users created via admin panel use Firebase Auth and do not store `passwordHash` in database. However, `auth-db.js` login requires `passwordHash` field to authenticate users.

**Local Auth Status:** ✅ Working correctly (no issues)

---

## Root Cause Analysis

### Primary Issue: Missing `passwordHash` Field

**Problem:**
- Admin panel (`admin.js`) creates users via Firebase Auth `createUserWithEmailAndPassword`
- Stores user data in database: `{username, email, role, status, ...}`
- **Does NOT store `passwordHash`** - password managed by Firebase Auth only
- `auth-db.js` login function requires `passwordHash` field (line 153)
- Result: Admin-created users cannot login via `auth-db.js`

**Affected Account:**
- `dan.young@wiseguys.co.uk` - created via admin panel, missing `passwordHash`

**Solution:**
1. Add `passwordHash` field to existing user record
2. Hash password using SHA-256 (hex format)
3. Update database: `/users/{userId}/passwordHash`

---

## Findings

### ✅ Login Flow Analysis
- Login flow logic is **correct**
- Supports username OR email (case-insensitive)
- Password hashing: SHA-256 (hex)
- Error handling: Correct (non-blocking security logger)

### ✅ Local Auth Analysis
- Localhost detection: **Working** (checks `localhost` and `127.0.0.1`)
- Persistence mode: **Correct** (LOCAL for localhost, SESSION for hosted)
- Local auth functionality: **Working** (no issues)

### ✅ Security Logger
- Errors are **non-blocking** (catches and logs, doesn't throw)
- Should not prevent login
- Password cleaning: **Working** (recursive cleanObject function)

### ✅ Database Rules
- `users.read: true` - **Correct** (allows unauthenticated reads for login)
- `security_logs.write: true` - **Correct** (allows logging unauthenticated events)

---

## Issues Identified

### Critical (1)
1. **Missing `passwordHash` field** - Prevents login for admin-created users

### High (1)
2. **Admin panel doesn't create users with `passwordHash`** - All future admin-created users will have same issue

### Medium (1)
3. **Dual auth system complexity** - Firebase Auth (`auth.js`) vs Database Auth (`auth-db.js`) creates confusion

### Low (0)
- None

---

## Recommendations

### Immediate Fix (Critical)
1. **Add `passwordHash` to `dan.young@wiseguys.co.uk`:**
   - Hash the password using SHA-256 (hex)
   - Update database: `/users/{userId}/passwordHash = <hash>`
   - User can then login via `auth-db.js`

### Short-term Fix (High)
2. **Update admin panel to create users with `passwordHash`:**
   - When creating user, hash password and store `passwordHash` in database
   - Store both Firebase Auth user AND database record with `passwordHash`
   - Or document that admin-created users must use Firebase Auth login

### Long-term Fix (Medium)
3. **Standardize on one auth system:**
   - Choose either Firebase Auth OR database auth
   - Remove dual auth system complexity
   - Update all login flows to use chosen system

---

## Files Affecting Login

1. `src/auth-db.js` - Database-based authentication (primary login)
2. `src/auth.js` - Firebase Auth-based authentication (secondary)
3. `src/login.html` - Login page (uses `auth-db.js`)
4. `src/admin.js` - User creation (creates users without `passwordHash`)
5. `src/services/security-logger.js` - Security logging (non-blocking)
6. `database.rules.json` - Database security rules (correct)

---

## Next Steps

1. **Add `passwordHash` to `dan.young@wiseguys.co.uk` user record**
2. **Test login with `dan.young@wiseguys.co.uk`**
3. **Update admin panel to create users with `passwordHash`**
4. **Document auth system usage (Firebase Auth vs Database Auth)**

---

## Discovery Status

✅ **COMPLETE**

**Ready for:** Implementation/Planning
