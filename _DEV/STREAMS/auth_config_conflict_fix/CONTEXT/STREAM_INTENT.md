# Stream Intent: Auth Config Conflict Fix

**Stream:** auth_config_conflict_fix
**Created:** 2026-01-15
**Priority:** CRITICAL

---

## 🎯 Primary Goal

Fix two critical errors:
1. `auth.js:1 Uncaught SyntaxError: Identifier 'firebaseConfig' has already been declared` - Firebase config conflict
2. `field-config.js:62 Error getting form fields: Error: permission_denied at /form_fields` - Database permission denied

---

## 📋 Requirements

1. **Fix firebaseConfig duplicate declaration** ❌ (CRITICAL - blocking)
2. **Fix form_fields permission denied** ❌ (CRITICAL - blocking)
3. **Identify root cause of config conflict** (Required)
4. **Fix database permission issue** (Required)
5. **Verify all pages load without errors** (Required)
6. **Test admin panel functionality** (Required)

---

## 🔍 Problem Description

**Error 1: firebaseConfig Already Declared**
- Error: `auth.js:1 Uncaught SyntaxError: Identifier 'firebaseConfig' has already been declared`
- Likely cause: Both `auth.js` and `auth-db.js` are being loaded, both declare `firebaseConfig`
- Or: `firebaseConfig` declared multiple times in same page

**Error 2: Permission Denied on form_fields**
- Error: `permission_denied at /form_fields: Client doesn't have permission to access the desired data`
- Likely cause: Database rules require authentication, but user not authenticated properly
- Or: Database rules too restrictive for database auth users

---

## 🎯 Success Criteria

- [ ] No firebaseConfig duplicate declaration errors
- [ ] No permission denied errors on form_fields
- [ ] Admin panel can load form fields
- [ ] All pages load without console errors
- [ ] Authentication works correctly
- [ ] Database access works correctly

---

## 📁 Relevant Files

- `src/auth.js` - Firebase Auth module (may conflict with auth-db.js)
- `src/auth-db.js` - Database Auth module
- `src/admin.html` - Admin panel (loads auth-db.js)
- `src/appliance_form.html` - Form page (recently changed to auth-db.js)
- `src/processor.html` - Processor page (recently changed to auth-db.js)
- `src/services/field-config.js` - Form fields service (permission error)
- `src/admin.js` - Admin panel logic (uses field-config.js)
- `database.rules.json` - Database security rules

---

## 🔧 Investigation Areas

1. **Script Loading Order**
   - Check if both auth.js and auth-db.js are loaded
   - Check script load order in HTML files
   - Check for duplicate firebaseConfig declarations

2. **Database Rules**
   - Check form_fields read/write permissions
   - Verify rules allow database auth users
   - Check if auth != null requirement blocks database auth

3. **Authentication State**
   - Verify user is authenticated when accessing form_fields
   - Check if database auth sets proper auth state for rules
   - Verify sessionStorage is checked correctly

---

## 📊 Expected Outcome

After fix:
- No JavaScript syntax errors
- No database permission errors
- Admin panel can load and manage form fields
- All authentication works correctly
- All pages load without errors
