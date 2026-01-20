# Pattern Application Guide

**Generated:** 2026-01-09T06:30:00Z  
**Stream:** appliance_admin_deployment  
**Workflow:** PLANNING - Step 6

---

## Pattern Application Overview

**Total Patterns:** 6 critical patterns  
**Implementation Order:** Follows dependency chain  
**Pattern Source:** Discovery workflow  
**Relevance Scores:** All 9-10/10 (high)

---

## Pattern 1: Firebase Authentication Pattern

**Phase:** 1 (Foundation)  
**Relevance Score:** 10/10  
**Priority:** Critical

### Description
Implementing user registration, login, session management, and password recovery using Firebase Authentication. This includes handling user states (logged in/out) and protecting routes.

### Implementation Steps
1. **Firebase Auth SDK Integration**
   - Load Firebase Auth SDK via CDN
   - Initialize Firebase Auth in `app.js`
   - Configure Firebase project credentials

2. **Email/Password Authentication**
   - Create login form (`src/login.html`)
   - Implement `signInWithEmailAndPassword()`
   - Handle authentication errors
   - Redirect on successful login

3. **Session Management**
   - Use `onAuthStateChanged()` to track user state
   - Store user session in browser
   - Handle token refresh automatically
   - Persist session across page loads

4. **Password Reset**
   - Add "Forgot password" link
   - Implement `sendPasswordResetEmail()`
   - Handle password reset flow

### Files to Create/Modify
- `src/login.html` (new)
- `src/app.js` (modify - add auth logic)
- `src/auth.js` (new - auth utilities)

### Best Practices
- Never store passwords client-side
- Use Firebase's built-in password reset
- Handle all authentication errors gracefully
- Show clear error messages to users

### Success Criteria
- Users can log in with email/password
- Sessions persist across page loads
- Users can reset passwords
- Authentication errors handled gracefully

---

## Pattern 2: Session Management Pattern

**Phase:** 1 (Foundation)  
**Relevance Score:** 9/10  
**Priority:** Critical

### Description
Managing user sessions securely, including persistence, token refresh, and session expiry handling.

### Implementation Steps
1. **Session Persistence**
   - Use Firebase's `setPersistence()` with `LOCAL`
   - Store user state in `localStorage` or `sessionStorage`
   - Restore session on page load

2. **Token Refresh**
   - Firebase handles token refresh automatically
   - Monitor token expiry
   - Refresh tokens before expiry

3. **Session State Management**
   - Use `onAuthStateChanged()` to track login state
   - Update UI based on auth state
   - Clear session on logout

### Files to Create/Modify
- `src/app.js` (modify - add session management)
- `src/auth.js` (modify - add session utilities)

### Best Practices
- Use Firebase's built-in session management
- Don't store sensitive data in localStorage
- Clear session on logout
- Handle session expiry gracefully

### Success Criteria
- Sessions persist across page loads
- Tokens refresh automatically
- Session state tracked correctly
- Logout clears session properly

---

## Pattern 3: Protected Routes Pattern

**Phase:** 2 (Access Control)  
**Relevance Score:** 9/10  
**Priority:** Critical

### Description
Managing navigation within the single-page application (SPA) and restricting access to certain routes (e.g., `/admin`, `/sales`) based on user authentication and role.

### Implementation Steps
1. **Route Guards**
   - Create `checkAuth()` function
   - Create `checkRole()` function
   - Implement route protection logic

2. **Protected Routes**
   - Admin panel: Require admin role
   - Form page: Require authentication
   - Login page: Redirect if already logged in

3. **Unauthorized Access Handling**
   - Redirect to login if not authenticated
   - Redirect to form if not admin (for admin panel)
   - Show error messages

### Files to Create/Modify
- `src/app.js` (modify - add route guards)
- `src/auth.js` (modify - add role checks)

### Best Practices
- Check authentication before rendering protected content
- Check roles before allowing admin access
- Redirect appropriately based on auth state
- Don't rely solely on client-side checks (use security rules)

### Success Criteria
- Admin panel only accessible to admins
- Form only accessible to authenticated users
- Unauthorized access redirects appropriately
- Route guards work correctly

---

## Pattern 4: RBAC Implementation Pattern

**Phase:** 2 (Access Control)  
**Relevance Score:** 9/10  
**Priority:** Critical

### Description
Defining roles (Admin, Agent) and granting permissions based on these roles. Admins have full access (user management, all sales data), while Agents have limited access (submit forms, potentially view own sales).

### Implementation Steps
1. **Role Storage**
   - Use Firebase custom claims (preferred) OR
   - Store roles in Realtime Database user metadata
   - Set roles when creating users (admin only)

2. **Role Checks**
   - Create `isAdmin()` function
   - Create `isAgent()` function
   - Check roles before allowing actions

3. **Permission Enforcement**
   - Client-side: Check roles before UI actions
   - Server-side: Use Firebase Security Rules
   - Never rely solely on client-side checks

### Files to Create/Modify
- `src/auth.js` (modify - add role functions)
- `database.rules.json` (modify - add role-based rules)

### Best Practices
- Store roles securely (custom claims or database)
- Check roles on both client and server
- Never expose admin functions to non-admin users
- Use Firebase Security Rules for server-side enforcement

### Success Criteria
- Roles stored securely
- Role checks work correctly
- Permissions enforced properly
- Admin functions only accessible to admins

---

## Pattern 5: Admin CRUD Operations Pattern

**Phase:** 3 (Admin Features)  
**Relevance Score:** 10/10  
**Priority:** Critical

### Description
Implementing standard data manipulation operations for user/agent management within the Admin Panel.

### Implementation Steps
1. **Create User**
   - Create user form in admin panel
   - Use Firebase Admin SDK (via Cloud Functions) OR
   - Use Firebase Auth `createUserWithEmailAndPassword()` (if allowed)
   - Set user role (admin or agent)
   - Store user metadata

2. **Read Users**
   - Fetch all users from Firebase Auth (via Admin SDK) OR
   - Store user list in Realtime Database
   - Display users in admin panel
   - Show user details (email, role, status)

3. **Update User**
   - Edit user form
   - Update user email (if needed)
   - Update user role
   - Update user metadata

4. **Delete/Deactivate User**
   - Delete user from Firebase Auth (via Admin SDK) OR
   - Deactivate user (set status flag)
   - Handle user deletion carefully

### Files to Create/Modify
- `src/admin.html` (new)
- `src/admin.js` (new - admin panel logic)
- `src/app.js` (modify - add admin routes)

### Best Practices
- Validate all inputs before creating/updating
- Handle errors gracefully
- Confirm destructive actions (delete)
- Provide clear feedback to admin

### Success Criteria
- Admin can create users
- Admin can view all users
- Admin can edit users
- Admin can delete/deactivate users
- All operations work correctly

---

## Pattern 6: Database Security Rules Pattern

**Phase:** 3 (Admin Features)  
**Relevance Score:** 10/10  
**Priority:** Critical

### Description
Using Firebase Realtime Database Security Rules to enforce read/write permissions based on user roles and authentication status. Specifically, Admin-only read access to sales, and user/agent write-only access.

### Implementation Steps
1. **Security Rules Structure**
   - Define rules in `database.rules.json`
   - Structure: `{ "rules": { "sales": { ... } } }`
   - Use `.read` and `.write` properties

2. **Admin-Only Read Access**
   - Check if user is authenticated
   - Check if user has admin role
   - Allow read if both true
   - Deny read otherwise

3. **User Write-Only Access**
   - Check if user is authenticated
   - Allow write for authenticated users
   - Deny read for non-admin users
   - Validate data structure

### Files to Create/Modify
- `database.rules.json` (modify - add security rules)

### Security Rules Example
```json
{
  "rules": {
    "sales": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'",
      ".write": "auth != null",
      "$saleId": {
        ".validate": "newData.hasChildren(['customerName', 'agentId', 'appliances'])"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
        ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'"
      }
    }
  }
}
```

### Best Practices
- Never use overly permissive rules (`.read: true, .write: true`)
- Always check authentication (`auth != null`)
- Always check roles for admin access
- Validate data structure
- Test rules thoroughly

### Success Criteria
- Admin can read all sales
- Users can write sales (submit forms)
- Users cannot read sales
- Security rules enforce access correctly

---

## Pattern Application Summary

| Pattern | Phase | Priority | Status |
|---------|-------|----------|--------|
| Firebase Authentication | 1 | Critical | Pending |
| Session Management | 1 | Critical | Pending |
| Protected Routes | 2 | Critical | Pending |
| RBAC Implementation | 2 | Critical | Pending |
| Admin CRUD Operations | 3 | Critical | Pending |
| Database Security Rules | 3 | Critical | Pending |

**Implementation Order:** Follow phase order (1 → 2 → 3)  
**All Patterns:** Critical, must be followed

---

**Status:** ✅ Pattern Application Guide Complete  
**Next Step:** Step 7 - Generate Implementation Plan
