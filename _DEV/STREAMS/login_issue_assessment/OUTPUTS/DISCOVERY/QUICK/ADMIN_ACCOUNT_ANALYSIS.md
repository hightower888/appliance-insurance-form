# Admin Account Analysis

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** login_issue_assessment
**Workflow:** DISCOVERY_QUICK
**Step:** quick-3

---

## Root Cause Identified

**Primary Issue:** Missing `passwordHash` field in database for `dan.young@wiseguys.co.uk`

### Problem

Users created via admin panel (`admin.js` `handleCreateUser`) use Firebase Auth `createUserWithEmailAndPassword`, then store user data in database **WITHOUT** `passwordHash` field. The password is managed by Firebase Auth only.

However, `auth-db.js` login function requires `passwordHash` field in database (line 153 checks `userData.passwordHash === passwordHash`).

### User Creation Process

**Admin Panel (`admin.js` line 238-442):**
1. Creates user via Firebase Auth: `auth.createUserWithEmailAndPassword(systemEmail, password)`
2. Stores user data in database (line 421): `{username, role, status, createdAt, email, ...}`
3. **Does NOT store `passwordHash`** - password managed by Firebase Auth

**Script (`create-test-users-db.js`):**
- Creates users directly in database with `passwordHash` field (line 95)
- Uses SHA-256 hash: `crypto.createHash('sha256').digest('hex')`
- Compatible with `auth-db.js` login

---

## User Data Structure Requirements

### For `auth-db.js` Login to Work:

User record must have:
- `email` or `username` (for matching)
- `passwordHash` (hex SHA-256 hash) - **REQUIRED**
- `role` (admin/agent/processor)
- `status` (active/inactive)

### Current Admin-Created Users:

User record has:
- `username`
- `email` (or systemEmail)
- `role`
- `status`
- **Missing: `passwordHash`** ❌

---

## Password Hashing Algorithm

**Algorithm:** SHA-256
**Format:** Hex string (lowercase)
**Implementation:**
- `auth-db.js`: Web Crypto API `crypto.subtle.digest('SHA-256')` → hex
- `create-test-users-db.js`: Node.js `crypto.createHash('sha256').digest('hex')`
- Both produce same format (compatible)

---

## Email/Username Matching Logic

**Logic:** Case-insensitive matching
- Email match: `userData.email.toLowerCase() === normalizedId`
- Username match: `userData.username.toLowerCase() === normalizedId`
- Both checks performed (OR logic)

**For `dan.young@wiseguys.co.uk`:**
- Should match if `email` field contains `dan.young@wiseguys.co.uk` (case-insensitive)
- Logic is correct

---

## All Potential Causes

1. **Missing `passwordHash` field** ⚠️ **PRIMARY CAUSE**
   - Admin-created users don't have `passwordHash`
   - `auth-db.js` requires `passwordHash` for login
   - **Solution:** Add `passwordHash` to user record, or use Firebase Auth login

2. **User not in database**
   - User may not exist
   - **Check:** Verify user exists in `/users` path

3. **Email mismatch**
   - Email stored differently (e.g., case, whitespace)
   - **Check:** Verify exact email format in database

4. **Password hash algorithm mismatch**
   - Different hashing algorithm used
   - **Check:** Verify hash algorithm (should be SHA-256 hex)

5. **Account inactive**
   - `status === 'inactive'` (line 189)
   - **Check:** Verify `status === 'active'`

6. **Brute force lockout**
   - Account locked after 5 failed attempts
   - **Check:** Clear sessionStorage `login_attempts_*` keys

7. **Database read access**
   - Database rules blocking read
   - **Check:** `users.read: true` (currently correct)

---

## Recommendations

### Immediate Fix:

1. **Add `passwordHash` to existing user:**
   - Hash the password using SHA-256
   - Update user record in database: `/users/{userId}/passwordHash`
   - Use same password user knows

2. **Or use Firebase Auth login:**
   - Use `auth.js` login instead of `auth-db.js`
   - Admin-created users work with Firebase Auth

### Long-term Fix:

1. **Update admin panel to create users with `passwordHash`:**
   - When creating user, hash password and store `passwordHash`
   - Store both Firebase Auth user AND database record with `passwordHash`

2. **Or standardize on one auth system:**
   - Choose either Firebase Auth OR database auth
   - Remove dual auth system complexity

---

## Next Steps

- Continue with Local Auth Analysis (quick-4)
- Then synthesize findings (quick-5)
