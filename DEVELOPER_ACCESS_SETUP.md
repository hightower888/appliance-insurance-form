# Developer Admin Access Setup Guide

**Developer Email:** kennen_02@icloud.com  
**Created:** 2026-01-14  
**Status:** Ready for Execution

---

## Quick Start

### 1. Grant Firebase Admin Access

```bash
# First, login with your admin account
gcloud auth login

# Run the access script
node scripts/grant-firebase-admin-access.js kennen_02@icloud.com
```

**What this does:**
- Grants 7 IAM roles for full Firebase/Google Cloud access
- Enables deployment, database management, and all admin functions
- Developer will receive email invitation

### 2. Grant Vercel Admin Access

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/dashboard
2. Select project: `appliance-cover-form`
3. Go to **Settings** > **Team**
4. Click **"Invite Member"**
5. Enter email: `kennen_02@icloud.com`
6. Select role: **Admin**
7. Click **"Send Invitation"**

**Option B: Via Script**
```bash
./scripts/grant-vercel-admin-access.sh kennen_02@icloud.com
```
(This script provides detailed instructions)

---

## What Developer Gets

### Firebase Access
- ✅ Full Firebase Console access
- ✅ Google Cloud Console access
- ✅ Deploy database rules
- ✅ Deploy Cloud Functions
- ✅ Manage authentication
- ✅ Manage Realtime Database
- ✅ Manage Cloud Storage
- ✅ Full IAM permissions

### Vercel Access
- ✅ Project dashboard access
- ✅ Deploy to production (`vercel --prod`)
- ✅ Manage environment variables
- ✅ Manage domains
- ✅ View deployment logs
- ✅ Access project settings

---

## API Access Details

All API details are documented in:
**`_DEV/STREAMS/developer_admin_access/OUTPUTS/DISCOVERY/API_ACCESS_DOCUMENTATION.md`**

### Quick Reference

**Firebase:**
- Project ID: `appliance-bot`
- Database: `https://appliance-bot-default-rtdb.firebaseio.com`
- Console: https://console.firebase.google.com/project/appliance-bot

**Vercel:**
- Project: `appliance-cover-form`
- Dashboard: https://vercel.com/dashboard

---

## Verification Steps

After granting access, developer should:

1. **Check Email**
   - Accept Google Cloud invitation
   - Accept Vercel invitation (if sent)

2. **Verify Firebase Access**
   ```bash
   firebase login
   firebase use appliance-bot
   firebase projects:list
   ```

3. **Verify Vercel Access**
   ```bash
   vercel login
   vercel ls
   ```

4. **Test Deployment**
   - Firebase: `firebase deploy --only database` (test)
   - Vercel: `vercel` (preview deployment)

---

## Troubleshooting

### Firebase Access Issues
- **Error:** "Permission denied"
  - Verify IAM roles: `gcloud projects get-iam-policy appliance-bot`
  - Check developer email is listed with correct roles

### Vercel Access Issues
- **Error:** "Not authorized"
  - Verify team membership in Vercel Dashboard
  - Check role is set to "Admin"

### Script Execution Issues
- **Error:** "gcloud not found"
  - Install: https://cloud.google.com/sdk/docs/install
- **Error:** "Not logged in"
  - Run: `gcloud auth login`
  - Use admin account (not service account)

---

## Files Created

1. **`scripts/grant-firebase-admin-access.js`**
   - Automated Firebase IAM permission granting

2. **`scripts/grant-vercel-admin-access.sh`**
   - Vercel access instructions and guidance

3. **`_DEV/STREAMS/developer_admin_access/OUTPUTS/DISCOVERY/API_ACCESS_DOCUMENTATION.md`**
   - Comprehensive API access documentation

4. **`_DEV/STREAMS/developer_admin_access/OUTPUTS/DISCOVERY/DISCOVERY_ASSESSMENT_REPORT.md`**
   - Discovery assessment and implementation plan

---

## Next Steps

1. ✅ Execute Firebase access script
2. ✅ Grant Vercel access via dashboard
3. ⏳ Wait for developer to accept invitations
4. ⏳ Developer verifies access
5. ⏳ Developer begins development work

---

**Status:** Ready for execution  
**Contact:** If you need any assistance, refer to the detailed documentation in `_DEV/STREAMS/developer_admin_access/`
