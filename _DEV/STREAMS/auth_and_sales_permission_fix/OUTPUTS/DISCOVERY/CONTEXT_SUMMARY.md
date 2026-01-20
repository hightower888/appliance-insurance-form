## Context Summary

**Goal:** Fix firebaseConfig duplicate declaration and sales permission denied errors

**Project Type:** bug_fix

**Relevant Directories:** 
- `src/` - Main application files
- `src/auth.js` - Firebase Auth module (line 22: `const firebaseConfig = window.firebaseConfig;`)
- `src/auth-db.js` - Database Auth module (line 21: `const firebaseConfig = window.firebaseConfig;`)
- `src/admin.html` - Admin panel (loads auth-db.js)
- `src/admin.js` - Admin panel logic (loadSales function at line 661)
- `database.rules.json` - Database security rules (sales requires `auth != null`)

### Extracted Requirements

1. **Fix firebaseConfig duplicate declaration** ❌ (CRITICAL - blocking page load)
2. **Fix sales permission denied** ❌ (CRITICAL - blocking admin panel)
3. **Identify root causes** (Required - investigate both errors)
4. **Ensure security maintained** (Required - verify auth and rules)
5. **Test all functionality** (Required - verify fixes work)

### Initial Findings

**Issue 1: firebaseConfig Duplicate Declaration**
- Error: `auth.js:1 Uncaught SyntaxError: Identifier 'firebaseConfig' has already been declared`
- Location: `auth.js:1:1` (but actual declaration is at line 22)
- Current state: Both `auth.js` (line 22) and `auth-db.js` (line 21) have `const firebaseConfig = window.firebaseConfig;`
- **Root Cause:** Even though using `window.firebaseConfig`, both files declare `const firebaseConfig` which causes duplicate declaration if both files load
- **Investigation needed:** Check if both files are being loaded, or if `const` declaration itself is the issue

**Issue 2: Sales Permission Denied**
- Error: `permission_denied at /sales: Client doesn't have permission to access the desired data`
- Location: `admin.js:661` in `loadSales` function
- Database rule: `"sales": { ".read": "auth != null" }` (line 45)
- **Root Cause:** Database rules require Firebase Auth (`auth != null`), but database auth (`auth-db.js`) doesn't set Firebase Auth state
- **Investigation needed:** Check if anonymous auth is working for sales, or if it's only set up for form_fields

**Investigation Priority:**
1. Check if both auth.js and auth-db.js are being loaded
2. Fix firebaseConfig const declaration conflict
3. Verify anonymous auth is working for sales access
4. Check database rules for sales path
5. Test all fixes
