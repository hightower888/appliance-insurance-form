# Stream Intent: Admin Navigation Fix

**Stream:** admin_navigation_fix
**Created:** 2026-01-15
**Priority:** HIGH

---

## 🎯 Primary Goal

Fix navigation issue where admin user (dan.young@wiseguys.co.uk) can access admin page but cannot navigate to form or processor pages.

---

## 📋 Requirements

1. **Admin can access admin panel** ✅ (Working)
2. **Admin cannot navigate to form page** ❌ (Issue)
3. **Admin cannot navigate to processor page** ❌ (Issue)
4. **Identify root cause** (Required)
5. **Fix navigation/routing logic** (Required)
6. **Test all navigation paths** (Required)

---

## 🔍 Problem Description

When logging in as `dan.young@wiseguys.co.uk`:
- ✅ Login works
- ✅ Redirects to admin page successfully
- ❌ Cannot navigate to `/form` or `/processor` pages
- ❌ Navigation links/buttons may not be working
- ❌ Or access control may be blocking navigation

---

## 🎯 Success Criteria

- [ ] Admin user can navigate to `/form` page
- [ ] Admin user can navigate to `/processor` page
- [ ] Navigation works from admin panel
- [ ] No console errors
- [ ] Access control allows admin role to access all pages

---

## 📁 Relevant Files

- `src/admin.html` - Admin panel UI
- `src/admin.js` - Admin panel logic
- `src/auth-db.js` - Authentication system
- `src/appliance_form.html` - Form page
- `src/processor.html` - Processor page
- `src/login.html` - Login page with redirect logic

---

## 🔧 Investigation Areas

1. **Navigation Links/Buttons**
   - Check if links exist in admin.html
   - Verify href attributes
   - Check for JavaScript navigation handlers

2. **Access Control**
   - Check role-based access in auth-db.js
   - Verify redirect logic after login
   - Check page-level access checks

3. **Routing Logic**
   - Check vercel.json rewrites
   - Verify page access permissions
   - Check for client-side routing blocks

4. **Authentication State**
   - Verify user role is correctly set
   - Check session storage
   - Verify role checks on form/processor pages

---

## 📊 Expected Outcome

After fix:
- Admin users can access all pages (admin, form, processor)
- Navigation is intuitive and working
- No access control issues
- Clear error messages if access is denied
