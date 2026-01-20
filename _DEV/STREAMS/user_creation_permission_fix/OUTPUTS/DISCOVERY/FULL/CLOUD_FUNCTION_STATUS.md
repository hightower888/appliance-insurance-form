---
title: "Cloud Function Deployment Status"
created: 2026-01-14
status: checked
---

# Cloud Function Deployment Status

**Checked:** 2026-01-14  
**Function:** `createUser`  
**URL:** `https://us-central1-appliance-bot.cloudfunctions.net/createUser`

---

## Status: ❌ NOT DEPLOYED / NOT ACCESSIBLE

**HTTP Response:** 404 (Not Found)

---

## Analysis

### Function Exists Locally
✅ **Function file exists:** `functions/createUser.js`  
✅ **Entry point configured:** `functions/index.js` exports `createUser`  
✅ **Dependencies configured:** `functions/package.json` has required dependencies

### Deployment Status
❌ **Function not accessible:** HTTP 404 response  
❌ **Possible reasons:**
1. Function not deployed to Firebase
2. Function deployed but URL incorrect
3. Function deployed but region mismatch
4. Function deleted or disabled

---

## Impact on User Creation

### Current Behavior
- Admin clicks "Add New User"
- Code tries Cloud Function first (line 356 in admin.js)
- Cloud Function returns 404
- Code falls back to direct database write (line 418)
- **Database write fails** due to permission rules

### Solution Required
Since Cloud Function is not available, we need to:
1. **Option A:** Deploy the Cloud Function
2. **Option B:** Fix database rules to support auth-db.js
3. **Option C:** Use Firebase Auth for admin operations

---

## Recommendation

**Primary:** Deploy Cloud Function (preferred path)  
**Fallback:** Fix database rules to support database-based authentication

---

## Next Steps

1. Deploy Cloud Function OR
2. Implement alternative solution (database rules fix or Firebase Auth for admin)
