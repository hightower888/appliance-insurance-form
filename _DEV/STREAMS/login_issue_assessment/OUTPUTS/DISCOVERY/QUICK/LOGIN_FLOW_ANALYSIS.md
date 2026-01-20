# Login Flow Analysis

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** login_issue_assessment
**Workflow:** DISCOVERY_QUICK
**Step:** quick-2

---

## Files Analyzed

- `src/auth-db.js` - Login function (lines 114-224)
- `src/login.html` - Form handler (lines 136-181)

---

## Login Flow Overview

### Function: `loginUser(usernameOrEmail, password)`

**Location:** `src/auth-db.js` (line 114)

**Flow Steps:**
1. Normalize identifier to lowercase (line 117)
2. Check brute force protection (line 120)
3. Hash password with SHA-256 (line 132)
4. Search users database (line 136-137)
5. Match by email OR username (case-insensitive) (lines 156-157)
6. Validate password (line 153)
7. Store in sessionStorage (line 201)
8. Redirect based on role (lines 211-217)

---

## Login Flow Logic

### Step 1: Normalize Identifier
```javascript
const normalizedId = usernameOrEmail.toLowerCase().trim();
```
- Converts to lowercase for case-insensitive matching
- Trims whitespace

### Step 2: Brute Force Protection
```javascript
const lockStatus = loginAttempts.isLocked(normalizedId);
```
- Checks if account is locked (5 failed attempts = 15-minute lockout)
- Uses sessionStorage for attempt tracking

### Step 3: Password Hashing
```javascript
const passwordHash = await hashPasswordAsync(password);
```
- Uses SHA-256 hashing (Web Crypto API)
- Must match hash stored in database

### Step 4: Database Search
```javascript
const usersRef = database.ref('users');
const snapshot = await usersRef.once('value');
```
- Reads entire users database
- Requires `users.read: true` in database rules

### Step 5: User Matching
```javascript
const emailMatch = userData.email && userData.email.toLowerCase() === normalizedId;
const usernameMatch = userData.username && userData.username.toLowerCase() === normalizedId;
```
- Matches by email OR username (case-insensitive)
- Both checks are performed

### Step 6: Password Validation
```javascript
const passwordMatch = userData.passwordHash === passwordHash || userData.password === passwordHash;
```
- Checks both `passwordHash` (new format) and `password` (old format)
- Must match exactly

### Step 7: Session Storage
```javascript
sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
```
- Stores user object in sessionStorage
- Persists for browser session

### Step 8: Role-Based Redirect
```javascript
if (foundUser.role === 'admin') {
  window.location.href = '/admin';
} else if (foundUser.role === 'processor') {
  window.location.href = '/processor';
} else {
  window.location.href = '/form';
}
```
- Redirects based on user role

---

## Potential Failure Points

### 1. Database Read Access
**Issue:** Database rules must allow unauthenticated reads
**Current:** `users.read: true` ✅ (correct)
**Risk:** Low

### 2. User Not Found
**Issue:** User may not exist in database
**Possible Causes:**
- User not created
- Email/username mismatch
- Case sensitivity (should be handled by normalization)
**Risk:** High (likely cause for dan.young@wiseguys.co.uk)

### 3. Password Mismatch
**Issue:** Password hash may not match stored hash
**Possible Causes:**
- Wrong password
- Hash algorithm mismatch
- Stored hash format incorrect
**Risk:** High

### 4. Brute Force Lockout
**Issue:** Account may be locked after 5 failed attempts
**Current:** 15-minute lockout
**Risk:** Medium

### 5. Security Logger Errors
**Issue:** Security logger errors may block login
**Current:** Non-blocking (catches errors, does not throw)
**Risk:** Low (should not block)

### 6. Account Inactive
**Issue:** User account may be inactive
**Check:** `foundUser.status === 'inactive'` (line 189)
**Risk:** Medium

### 7. Database Connection
**Issue:** Database may not be initialized
**Check:** `if (!database)` in security logger
**Risk:** Low

---

## Error Handling

### Security Logger
- Errors are caught and logged (non-blocking)
- Does not throw errors
- Should not block login

### Login Errors
- Errors are thrown and caught by form handler
- Error messages displayed via `getAuthErrorMessage`
- User sees specific error messages

---

## Form Handler Analysis

### login.html Form Submission
```javascript
const username = usernameInput.value.trim();
const password = passwordInput.value;
await loginUser(username, password);
```

**Observations:**
- Form passes `username` field value (not email field)
- But auth-db.js accepts `usernameOrEmail` and will match email if entered
- Form label says "Username or Email" (correct)
- Input field is named "username" (works for both)

---

## Issues Identified

### Issue 1: User Data Verification Needed
**Description:** Need to verify user data for `dan.young@wiseguys.co.uk` in database
**Check:** User exists, email format, password hash format
**Priority:** Critical

### Issue 2: Password Hash Format
**Description:** Need to verify password hash matches expected format
**Check:** Hash algorithm (SHA-256), hash format (hex string)
**Priority:** High

### Issue 3: Email/Username Matching
**Description:** Need to verify email matching logic works for dan.young@wiseguys.co.uk
**Check:** Email stored correctly, case-insensitive matching works
**Priority:** High

---

## Recommendations

1. **Verify User Data:** Check if `dan.young@wiseguys.co.uk` exists in database
2. **Verify Password Hash:** Check password hash format and algorithm
3. **Test Email Matching:** Verify email matching logic works correctly
4. **Check Account Status:** Verify account is not inactive
5. **Check Brute Force Lockout:** Verify account is not locked

---

## Next Steps

- Continue with Admin Account Analysis (quick-3)
- Continue with Local Auth Analysis (quick-4)
