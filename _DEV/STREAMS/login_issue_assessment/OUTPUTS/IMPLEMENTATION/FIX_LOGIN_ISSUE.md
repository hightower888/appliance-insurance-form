# Fix Login Issue Implementation

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** login_issue_assessment
**Status:** Ready for Implementation

---

## Issue Summary

**Root Cause:** Missing `passwordHash` field in database for `dan.young@wiseguys.co.uk` admin account.

**Problem:** Users created via admin panel use Firebase Auth and do not store `passwordHash` in database. However, `auth-db.js` login requires `passwordHash` field.

---

## Solution

### Step 1: Add passwordHash to Existing User

**Script Created:** `scripts/add-password-hash.js`

**Usage:**
```bash
node scripts/add-password-hash.js dan.young@wiseguys.co.uk <password>
```

**What it does:**
1. Searches for user by email (`dan.young@wiseguys.co.uk`)
2. Hashes the password using SHA-256 (hex format) - matches `auth-db.js`
3. Updates user record in database: `/users/{userId}/passwordHash`

**Requirements:**
- `service-account-key.json` must exist in project root
- User must exist in database
- Password must be provided

---

## Implementation Steps

### 1. Run the Script

```bash
cd /Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/appliance_insurance_form
node scripts/add-password-hash.js dan.young@wiseguys.co.uk <actual-password>
```

**Note:** Replace `<actual-password>` with the actual password for `dan.young@wiseguys.co.uk`

### 2. Verify the Fix

After running the script:
1. Try logging in with `dan.young@wiseguys.co.uk` and the password
2. Login should succeed via `auth-db.js`

### 3. Test Local Auth

1. Open `http://localhost:3000/login.html` (or your local URL)
2. Login with `dan.young@wiseguys.co.uk` and password
3. Should redirect to `/admin` (admin role)

---

## Long-term Fix (Optional)

### Update Admin Panel to Create Users with passwordHash

**File:** `src/admin.js`

**Change needed:** When creating users via admin panel, also store `passwordHash` in database:

```javascript
// After creating user via Firebase Auth
const passwordHash = await hashPasswordAsync(password); // Use same hash function as auth-db.js
await db.ref(`users/${userId}`).update({
  passwordHash: passwordHash
});
```

**Note:** This requires adding the `hashPasswordAsync` function to `admin.js` (or importing from `auth-db.js`).

---

## Files Modified

1. **Created:** `scripts/add-password-hash.js` - Script to add passwordHash to existing users

---

## Testing Checklist

- [ ] Run script to add passwordHash
- [ ] Verify user record has passwordHash field in database
- [ ] Test login with `dan.young@wiseguys.co.uk`
- [ ] Verify redirect to `/admin` (admin role)
- [ ] Test local auth (localhost)
- [ ] Test hosted auth (if applicable)

---

## Notes

- The script uses SHA-256 hashing (hex format) which matches `auth-db.js`
- Password is hashed client-side in `auth-db.js` and compared with stored hash
- This fix only affects `auth-db.js` login - Firebase Auth login is unaffected
- Future users created via admin panel will still need this fix unless admin panel is updated
