# Authentication System Documentation

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** comprehensive_auth_config_audit

---

## Overview

This application uses **two authentication systems** that serve different purposes:

1. **auth-db.js** - Database-based authentication (primary for login)
2. **auth.js** - Firebase Auth-based authentication (used by some pages)

---

## System 1: auth-db.js (Database-Based)

### Purpose
Database-based authentication using Firebase Realtime Database instead of Firebase Auth.

### Used By
- `src/login.html` - Login page

### Login Method
```javascript
loginUser(usernameOrEmail, password)
```
- **Supports:** Username OR Email (case-insensitive)
- **Session:** sessionStorage
- **User Lookup:** Searches entire users database

### Features
- Username or email login
- Brute force protection (5 attempts, 15-minute lockout)
- SHA-256 password hashing
- Session-based persistence (sessionStorage)

### Session Management
- Uses `sessionStorage` to store current user
- Session persists only for current browser session
- Cleared when browser closes

---

## System 2: auth.js (Firebase Auth)

### Purpose
Firebase Auth-based authentication using Firebase Authentication service.

### Used By
- Other pages that require Firebase Auth (check individual pages)

### Login Method
```javascript
loginUser(email, password)
```
- **Supports:** Email ONLY
- **Session:** Firebase Auth session
- **User Lookup:** Firebase Auth service

### Features
- Email-only login
- Firebase Auth persistence (SESSION mode)
- Password reset via email
- Automatic user sync to database

### Session Management
- Uses Firebase Auth session persistence
- Set to `SESSION` mode (sessions persist only for current browser session)
- Managed by Firebase Auth service

---

## Key Differences

| Feature | auth-db.js | auth.js |
|---------|------------|---------|
| Login Method | `loginUser(usernameOrEmail, password)` | `loginUser(email, password)` |
| Identifier Support | Username OR Email | Email ONLY |
| Session Storage | sessionStorage | Firebase Auth session |
| User Lookup | Database search (O(n)) | Firebase Auth (optimized) |
| Password Reset | Not available | Available via email |
| Used By | login.html | Other pages |

---

## Signup Flow

### Current Implementation
- **Location:** Admin panel (`src/admin.js`)
- **Function:** `handleCreateUser`
- **Email Requirement:** Optional
- **Behavior:** If no email provided, system generates: `username-{timestamp}@appliance-bot.local`
- **Access:** Admin only (no public signup form)

### Process
1. Admin creates user via admin panel
2. Username is required
3. Email is optional
4. If no email, system generates unique email
5. User created via Cloud Function API or Firebase Auth fallback
6. User data stored in database with username and email (or system email)

---

## Database Rules

### Users Path
- **Read:** `true` (allows unauthenticated reads - **REQUIRED for auth-db.js**)
- **Write:** Admin only
- **Note:** Unauthenticated reads expose usernames/emails (passwords are hashed, so secure)

### Security Logs Path
- **Read:** Admin only
- **Write:** `true` (allows unauthenticated writes - **REQUIRED for security logging during login failures**)

---

## Recommendations

1. **Documentation:** This document clarifies which system is used where
2. **Standardization:** Consider standardizing on one system in the future
3. **Performance:** auth-db.js user lookup is O(n) - consider optimization for large user bases
4. **Session Management:** Both systems use session-based persistence (cleared on browser close)

---

## Files

- `src/auth-db.js` - Database-based authentication
- `src/auth.js` - Firebase Auth-based authentication
- `src/login.html` - Login page (uses auth-db.js)
- `src/admin.js` - User creation (admin panel)
