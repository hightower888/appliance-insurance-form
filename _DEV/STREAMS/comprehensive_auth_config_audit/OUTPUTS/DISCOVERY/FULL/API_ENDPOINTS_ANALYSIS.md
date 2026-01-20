# API Endpoints & Links Analysis

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** comprehensive_auth_config_audit
**Workflow:** DISCOVERY_FULL
**Step:** full-4

---

## Firebase API Endpoints

### Database Endpoint
- **URL:** `https://appliance-bot-default-rtdb.firebaseio.com`
- **Used In:** auth-db.js (line 10), auth.js (line 11)
- **Status:** ✅ Production URL, correct

### Auth Domain
- **URL:** `appliance-bot.firebaseapp.com`
- **Used In:** auth-db.js (line 9), auth.js (line 10)
- **Status:** ✅ Production domain, correct

### Other Firebase Endpoints
- **API Key:** `AIzaSyD6uLFRoTZCrrwlsin0oAmxKcd_xc2-vzA`
- **Project ID:** `appliance-bot`
- **Storage Bucket:** `appliance-bot.firebasestorage.app`
- **Status:** ✅ All production endpoints, correct

---

## Cloud Function API Endpoints

### Create User Function
- **URL:** `https://us-central1-appliance-bot.cloudfunctions.net/createUser`
- **Used In:** admin.js (line 339)
- **Method:** POST
- **Status:** ✅ Production URL, correct

---

## Internal Links & Redirects

### Authentication Redirects
- **Admin:** `/admin` → rewrites to `/admin.html` (vercel.json line 11-13)
- **Processor:** `/processor` → rewrites to `/processor.html` (vercel.json line 18-21)
- **Form:** `/form` → rewrites to `/appliance_form.html` (vercel.json line 14-17)
- **Login:** `login.html` (relative path)

### Redirect Logic
- **auth-db.js:** Lines 212-217 (role-based redirects)
- **auth.js:** Lines 63-68 (role-based redirects)
- **logoutUser:** Redirects to `login.html` (auth-db.js line 241, auth.js line 131)
- **checkAuth:** Redirects to `login.html` (auth-db.js line 332, auth.js line 260)
- **checkRole:** Redirects to `appliance_form.html` (auth-db.js line 341, auth.js line 313)

**Status:** ✅ All redirects use relative paths, work via Vercel rewrites

---

## Localhost References Check

### Search Results
- **localhost:** Not found in production code
- **127.0.0.1:** Not found in production code
- **local:** Found in admin.js (lines 334, 390) - system email domain `@appliance-bot.local` (intentional, not localhost)

### System Email Domain
- **Pattern:** `username-{timestamp}@appliance-bot.local`
- **Purpose:** Generated system emails for users without email
- **Status:** ✅ Intentional, not a localhost reference

---

## Vercel Rewrites

### Configuration (vercel.json)
- `/` → `/login.html` (line 7-9)
- `/admin` → `/admin.html` (line 10-13)
- `/form` → `/appliance_form.html` (line 14-17)
- `/processor` → `/processor.html` (line 18-21)

**Status:** ✅ All rewrites configured correctly

---

## Issues Identified

**Status:** ✅ **NO ISSUES FOUND**

All API endpoints use production URLs:
- Firebase endpoints: Production
- Cloud Function endpoint: Production
- No localhost references
- All redirects use relative paths
- Vercel rewrites configured correctly

---

## Requirements Status

### REQ-5: Remove all localhost references
**Status:** ✅ **NO LOCALHOST REFERENCES FOUND**
- No localhost URLs in code
- No 127.0.0.1 references
- System email domain uses `.local` (intentional, not localhost)

### REQ-7: Verify all API endpoints and links
**Status:** ✅ **ALL VERIFIED**
- All Firebase endpoints correct
- Cloud Function endpoint correct
- All redirects work via Vercel rewrites
- No issues found

---

## Recommendations

1. **No Changes Needed:** All API endpoints and links are correct
2. **Document System Email Domain:** Document that `@appliance-bot.local` is intentional for system emails
3. **Continue Monitoring:** Regularly check for any localhost references in future changes

---

## Next Steps

- Continue with Configuration Files deep dive (full-5)
