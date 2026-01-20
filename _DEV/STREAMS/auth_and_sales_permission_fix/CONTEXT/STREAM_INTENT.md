# Stream Intent: Auth Config & Sales Permission Fix

**Stream:** auth_and_sales_permission_fix
**Created:** 2026-01-15
**Priority:** CRITICAL

---

## 🎯 Primary Goal

Fix two critical errors:
1. `auth.js:1 Uncaught SyntaxError: Identifier 'firebaseConfig' has already been declared`
2. `admin.js:661 Error loading sales: Error: permission_denied at /sales`

---

## 📋 Requirements

1. **Fix firebaseConfig duplicate declaration** ❌ (CRITICAL - blocking)
2. **Fix sales permission denied** ❌ (CRITICAL - blocking)
3. **Identify root causes** (Required)
4. **Ensure security maintained** (Required)
5. **Test all functionality** (Required)

---

## 🔍 Problem Description

**Error 1: firebaseConfig Duplicate Declaration**
- Error: `auth.js:1 Uncaught SyntaxError: Identifier 'firebaseConfig' has already been declared`
- Location: `auth.js:1:1`
- Likely cause: Both `auth.js` and `auth-db.js` declaring `firebaseConfig`

**Error 2: Sales Permission Denied**
- Error: `permission_denied at /sales: Client doesn't have permission to access the desired data`
- Location: `admin.js:661` in `loadSales` function
- Likely cause: Database rules require `auth != null` but database auth doesn't set Firebase Auth state

---

## 🎯 Success Criteria

- [ ] No firebaseConfig duplicate declaration errors
- [ ] Admin panel can load sales data
- [ ] All pages load without console errors
- [ ] Security maintained
- [ ] All functionality works

---

## 📁 Relevant Files

- `src/auth.js` - Firebase Auth module
- `src/auth-db.js` - Database Auth module
- `src/admin.html` - Admin panel
- `src/admin.js` - Admin panel logic (loadSales function)
- `database.rules.json` - Database security rules

---

## 🔧 Investigation Areas

1. **firebaseConfig Declarations**
   - Check all firebaseConfig declarations
   - Identify where duplicates occur
   - Check script loading order

2. **Sales Permission**
   - Check database rules for /sales
   - Verify auth state when accessing sales
   - Check if anonymous auth needed

---

## 📊 Expected Outcome

After fix:
- No duplicate declaration errors
- Admin panel can load sales
- All pages work correctly
- Security maintained
