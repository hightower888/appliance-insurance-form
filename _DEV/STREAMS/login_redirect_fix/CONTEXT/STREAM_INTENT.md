# Stream Intent: Login Redirect Fix

**Created:** 2026-01-08T12:00:00.000Z
**Stream:** login_redirect_fix

---

## Goal

Fix login redirect issue where page reloads instead of redirecting to admin panel after successful login with `dan.young@wiseguys.co.uk`.

---

## Requirements

### Primary
1. **REQ-1:** Fix login redirect - page should redirect to `/admin` after successful login
2. **REQ-2:** Identify ALL files affecting login and redirect flow
3. **REQ-3:** Fix any auth system conflicts between `auth-db.js` and `auth.js`
4. **REQ-4:** Ensure admin panel properly recognizes database auth users

### Secondary
5. **REQ-5:** Verify redirect works on both localhost and hosted
6. **REQ-6:** Ensure logout works correctly
7. **REQ-7:** Document the complete auth flow

---

## Context

- User can login (passwordHash added successfully)
- Login succeeds but page just reloads instead of redirecting
- No console errors
- `login.html` uses `auth-db.js` (database auth)
- `admin.html` was checking only Firebase Auth (`auth.js`)
- Already updated `admin.html` to check database auth but still not working
- Need to identify ALL files in the redirect chain

---

## Success Criteria

- [ ] Login redirects to `/admin` after successful login
- [ ] All files affecting login/redirect identified
- [ ] Auth system conflicts resolved
- [ ] Admin panel recognizes database auth users
- [ ] Works on localhost and hosted
- [ ] Logout works correctly
