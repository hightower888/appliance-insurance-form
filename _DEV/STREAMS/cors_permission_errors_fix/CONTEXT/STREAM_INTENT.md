---
title: "Stream Intent - CORS and Permission Errors Fix"
created: 2026-01-14
category: stream_context
status: active
---

# Stream Intent - CORS and Permission Errors Fix

**Created:** 2026-01-14  
**Status:** Active  
**Type:** Bug Fix - CORS and Database Permission Errors

---

## 🎯 **Primary Goal**

Fix errors preventing user creation in admin panel:
1. CORS error blocking Cloud Function requests
2. Permission denied error when writing to database (fallback method)

---

## 📋 **Requirements**

### **Functional Requirements**

#### **1. Fix CORS Error**
- Cloud Function `createUser` doesn't have CORS headers
- Error: "No 'Access-Control-Allow-Origin' header is present on the requested resource"
- Need to add CORS headers to Cloud Function

#### **2. Fix Permission Denied Error**
- Database write still fails with PERMISSION_DENIED
- Fallback method not working even after previous fixes
- Database rules may need adjustment or admin authentication issue

#### **3. Ensure User Creation Works**
- Cloud Function approach (after CORS fix)
- Fallback database approach (after permission fix)
- Both methods should work correctly

---

## 🔍 **Current Issues**

**Error 1:** CORS Violation
```
Access to fetch at 'https://us-central1-appliance-bot.cloudfunctions.net/createUser' 
from origin 'https://appliance-cover-form.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Error 2:** Permission Denied (Still Occurring)
```
Database write error: Error: PERMISSION_DENIED: Permission denied
Error creating user: Permission denied: Database rules do not allow user creation. 
Please ensure you are logged in as an admin and that database rules are properly configured.
```

---

## 🎯 **Success Criteria**

- ✅ Cloud Function has proper CORS headers
- ✅ CORS preflight requests succeed
- ✅ Database write permissions work for admin users
- ✅ User creation succeeds via Cloud Function
- ✅ User creation succeeds via fallback method
- ✅ No console errors during user creation
- ✅ All changes properly deployed

---

## 📁 **Relevant Files**

- `functions/createUser.js` - Cloud Function (needs CORS headers)
- `src/admin.js` - User creation logic
- `database.rules.json` - Database security rules
- Previous stream: `admin_js_errors_fix` - Recent fixes

---

## 🔄 **Related Streams**

- `admin_js_errors_fix` - Recent CSP and permission fixes
- `user_creation_permission_fix` - Previous fix attempt
