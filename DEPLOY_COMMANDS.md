# Deployment Commands - User Creation Permission Fix

**Quick Reference:** Commands to deploy all changes

---

## Option 1: Run All Commands at Once (Copy & Paste)

```bash
cd "/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/appliance_insurance_form" && \
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json" && \
firebase deploy --only database && \
echo "✅ Database rules deployed!" && \
echo "🌐 Frontend: Run 'vercel --prod' or push to Git"
```

---

## Option 2: Individual Commands (Run One by One)

### 1. Deploy Database Rules

```bash
cd "/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/appliance_insurance_form"
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
firebase deploy --only database
```

**If you get authentication error, use:**
```bash
firebase login
firebase deploy --only database
```

---

### 2. Verify Cloud Function (Already Deployed ✅)

```bash
curl -X POST https://us-central1-appliance-bot.cloudfunctions.net/createUser \
  -H "Content-Type: application/json" \
  -d '{"test":"check"}'
```

**Expected:** HTTP 403 or 400 (function exists, needs proper params)

---

### 3. Deploy Frontend to Vercel

**Option A: Git Push (if connected to Vercel)**
```bash
cd "/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/appliance_insurance_form"
git add src/admin.js database.rules.json
git commit -m "Fix user creation permission error"
git push
```

**Option B: Vercel CLI**
```bash
cd "/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/appliance_insurance_form"
vercel --prod
```

---

## Option 3: Use Service Account (Non-Interactive)

If you have `gcloud` CLI installed:

```bash
cd "/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/appliance_insurance_form"

# Activate service account
gcloud auth activate-service-account firebase-adminsdk-fbsvc@appliance-bot.iam.gserviceaccount.com \
  --key-file=./service-account-key.json

# Deploy database rules
firebase deploy --only database

# Deploy Cloud Function (already done, but can redeploy if needed)
cd functions
firebase deploy --only functions:createUser --force
cd ..
```

---

## Quick One-Liner (If Service Account Works)

```bash
cd "/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/appliance_insurance_form" && export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json" && firebase deploy --only database
```

---

## What Each Command Does

| Command | What It Does | Status |
|---------|--------------|--------|
| `firebase deploy --only database` | Deploys updated database rules | ⚠️ Needs auth |
| `firebase deploy --only functions:createUser` | Deploys Cloud Function | ✅ Already done |
| `vercel --prod` or `git push` | Deploys frontend changes | ⚠️ Needs Vercel |

---

## Troubleshooting

### If Database Rules Deployment Fails:

**Error:** "No authorized accounts"
```bash
firebase login
firebase deploy --only database
```

**Error:** "Permission denied" or "403"
```bash
# Try with service account
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
firebase deploy --only database
```

### If Frontend Deployment Fails:

**Error:** "Not logged in to Vercel"
```bash
vercel login
vercel --prod
```

---

## Verification Commands

After deployment, verify everything works:

```bash
# 1. Test Cloud Function
curl -X POST https://us-central1-appliance-bot.cloudfunctions.net/createUser \
  -H "Content-Type: application/json" \
  -d '{"test":"check"}'
# Should return: 403 or 400 (not 404)

# 2. Check database rules (in Firebase Console)
# Go to: Firebase Console > Realtime Database > Rules
# Should see updated rule with createdBy check

# 3. Test user creation (in browser)
# Log in as admin, try to create user
# Should work without permission denied error
```

---

## Current Status

- ✅ **Cloud Function:** Deployed
- ⚠️ **Database Rules:** Needs deployment (run command above)
- ⚠️ **Frontend:** Needs Vercel deployment

---

**Quick Start:** Run the commands in Option 1 or Option 2 above!
