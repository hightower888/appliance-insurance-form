# User Data Location Explanation

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** login_issue_assessment

---

## Where Your User Data is Stored

Your user account (`dan.young@wiseguys.co.uk`) is stored in **TWO places**:

### 1. Firebase Authentication (Firebase Auth)
**Location:** Firebase Auth service (managed by Google)
**Contains:**
- Email: `dan.young@wiseguys.co.uk`
- Password: Encrypted and stored by Firebase (you can't see it)
- User UID: Unique identifier (e.g., `abc123xyz...`)

**Status:** ✅ **Still exists** - We did NOT delete this

### 2. Realtime Database
**Location:** `/users/{userId}` in Firebase Realtime Database
**Contains:**
- Email: `dan.young@wiseguys.co.uk`
- Role: `admin`
- Status: `active`
- Username (if set)
- Other metadata

**Status:** ✅ **Still exists** - We did NOT delete this

**Missing Field:** ❌ `passwordHash` - This is what we need to add

---

## What We Did (Discovery Only)

**We did NOT delete anything.** We only:
1. ✅ Analyzed the login system
2. ✅ Identified the missing `passwordHash` field
3. ✅ Created a script to add it

**Your user directory still exists in both places.**

---

## Why Login Doesn't Work

The login page (`login.html`) uses `auth-db.js` which:
1. Reads user data from **Realtime Database** (`/users/{userId}`)
2. Checks for `passwordHash` field
3. Compares entered password (hashed) with stored `passwordHash`

**Problem:** Your user record in database is missing `passwordHash` field.

**Solution:** Add `passwordHash` field to your user record in database.

---

## How to Check Your User Data

### Option 1: Firebase Console
1. Go to: https://console.firebase.google.com
2. Select project: **appliance-bot**
3. Go to **Authentication > Users** - You should see `dan.young@wiseguys.co.uk`
4. Go to **Realtime Database > users** - You should see your user record (with UID)

### Option 2: Run the Script
The script we created will show you:
- Your user ID
- Your email
- Your role
- Your status
- Then add the missing `passwordHash` field

```bash
node scripts/add-password-hash.js dan.young@wiseguys.co.uk <your-password>
```

---

## Summary

- ✅ **Firebase Auth:** Your user still exists
- ✅ **Database:** Your user directory still exists
- ❌ **Missing:** `passwordHash` field in database
- ✅ **Fix:** Run the script to add `passwordHash`

**Nothing was deleted - we just need to add one field to make login work!**
