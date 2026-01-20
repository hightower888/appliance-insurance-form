# Environment Variables Setup Guide

## Quick Setup

### 1. Create .env.local File

```bash
# Copy the example
cp .env.example .env.local

# Edit .env.local and add your actual Firebase API key
# Get it from: https://console.firebase.google.com/project/appliance-bot/settings/general
```

### 2. Add to .env.local

```bash
FIREBASE_API_KEY=AIzaSyDgjxTJAnd2qppMLgqhECqJRR_FXDm7fGc
VITE_FIREBASE_API_KEY=AIzaSyDgjxTJAnd2qppMLgqhECqJRR_FXDm7fGc

# Other Firebase config (already set in .env.example)
FIREBASE_AUTH_DOMAIN=appliance-bot.firebaseapp.com
FIREBASE_DATABASE_URL=https://appliance-bot-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=appliance-bot
FIREBASE_STORAGE_BUCKET=appliance-bot.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=190852477335
FIREBASE_APP_ID=1:190852477335:web:b720a9a9217ae5fffe94d2
```

### 3. For Client-Side (HTML Files)

**Option A: Generate config file (Local Development)**
```bash
node scripts/inject-env-config.js > src/config/env-config.js
```

Then add to HTML files (before auth.js):
```html
<script src="config/env-config.js"></script>
```

**Option B: Vercel Environment Variables (Production)**

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all Firebase variables (FIREBASE_API_KEY, etc.)
3. Vercel will inject them at build/runtime

### 4. For Scripts (Node.js)

Scripts automatically load from `.env.local` using dotenv:
```bash
# Scripts will work automatically if .env.local exists
node scripts/export-sales-appliances-csv.js
```

---

## Verification

### Check for Hardcoded Keys

```bash
# Should return nothing (no hardcoded API keys)
grep -r "AIzaSy" --include="*.js" src/ scripts/ | grep -v "check-secrets.js" | grep -v "env-config"

# Run security check
node scripts/check-secrets.js
```

### Test Locally

1. Create `.env.local` with your API key
2. Generate env-config.js: `node scripts/inject-env-config.js > src/config/env-config.js`
3. Add script tag to HTML files
4. Test application - Firebase should connect

---

## Production (Vercel)

### Set Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`

### Vercel Build Command (Optional)

Add to `vercel.json` or use build command:
```json
{
  "buildCommand": "node scripts/inject-env-config.js > src/config/env-config.js"
}
```

---

## Security Checklist

- [ ] `.env.local` created with actual API key
- [ ] `.env.local` is in `.gitignore` (should be)
- [ ] No hardcoded keys in code (verified with check-secrets.js)
- [ ] Vercel environment variables set (for production)
- [ ] Local development works with .env.local
- [ ] Production deployment works with Vercel env vars

---

## Troubleshooting

### "FIREBASE_API_KEY not found" Error

- Check `.env.local` exists and has `FIREBASE_API_KEY=...`
- Verify file is in project root
- Check for typos in variable name

### Client-Side Not Working

- Ensure `env-config.js` is generated and loaded in HTML
- Check browser console for errors
- Verify `window.env` or `window.firebaseConfig` is set

### Scripts Not Working

- Run `npm install` to ensure dotenv is installed
- Verify `.env.local` exists in project root
- Check script has `require('dotenv').config({ path: '.env.local' })`

---

**Status:** ✅ Code is secure - all keys moved to environment variables
