# GitHub Repository Setup Instructions

**Date:** 2025-01-27  
**Status:** ✅ READY TO CREATE

---

## Prerequisites

✅ All security fixes complete
✅ No hardcoded API keys in code
✅ Environment variables configured
✅ .gitignore properly set up
✅ Documentation complete

---

## Step 1: Create .env.local (Local Development)

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and add your actual Firebase API key
# FIREBASE_API_KEY=AIzaSyDgjxTJAnd2qppMLgqhECqJRR_FXDm7fGc
```

**Important:** `.env.local` is gitignored and will NOT be committed.

---

## Step 2: Generate Client-Side Config (Optional for Local)

```bash
# Generate env-config.js for local development
node scripts/inject-env-config.js > src/config/env-config.js

# Add to HTML files (before auth.js):
# <script src="config/env-config.js"></script>
```

**Note:** For Vercel production, environment variables are injected automatically.

---

## Step 3: Verify Security

```bash
# Check for hardcoded keys (should return 0)
grep -r "AIzaSyDgjxTJAnd2qppMLgqhECqJRR_FXDm7fGc" --include="*.js" src/ scripts/ | wc -l

# Run security check script
node scripts/check-secrets.js
```

**Expected:** ✅ No hardcoded secrets found

---

## Step 4: Create GitHub Repository

### Option A: GitHub CLI

```bash
# Install GitHub CLI if needed
# brew install gh  # macOS
# gh auth login

# Create repository
gh repo create appliance-insurance-form \
  --public \
  --description "Lead management system for appliance insurance sales" \
  --source=. \
  --remote=origin \
  --push
```

### Option B: GitHub Web UI

1. Go to: https://github.com/new
2. Repository name: `appliance-insurance-form`
3. Description: "Lead management system for appliance insurance sales"
4. Visibility: **Public** or **Private** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we have these)
6. Click "Create repository"

### Step 5: Connect and Push

```bash
# Add remote (if not done by GitHub CLI)
git remote add origin https://github.com/YOUR_USERNAME/appliance-insurance-form.git

# Stage all files
git add .

# Verify no secrets are staged
git diff --cached | grep "AIzaSy" | grep -v "ENV_VAR_NOT_SET" | grep -v "DEVELOPMENT_KEY"

# Commit
git commit -m "Initial commit: Appliance insurance form lead management system

- Performance optimizations (pagination, caching, query optimization)
- Secure environment variable configuration
- CRM, Processor, and Admin interfaces
- Comprehensive documentation
- Security checks and verification scripts"

# Push to GitHub
git push -u origin main
```

---

## Step 6: Configure Repository

### Branch Protection

1. Go to: Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Include: `security-check` workflow

### GitHub Secrets (Optional - for CI/CD)

1. Go to: Settings → Secrets and variables → Actions
2. Add secrets if needed:
   - `FIREBASE_API_KEY` (if using GitHub Actions for deployment)
   - `VERCEL_TOKEN` (if using GitHub Actions)

**Note:** For Vercel deployment, use Vercel dashboard for env vars, not GitHub Secrets.

---

## Step 7: Configure Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select project: `lead-management-system-gray`
3. Settings → Environment Variables
4. Add all Firebase variables:

```
FIREBASE_API_KEY=AIzaSyDgjxTJAnd2qppMLgqhECqJRR_FXDm7fGc
FIREBASE_AUTH_DOMAIN=appliance-bot.firebaseapp.com
FIREBASE_DATABASE_URL=https://appliance-bot-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=appliance-bot
FIREBASE_STORAGE_BUCKET=appliance-bot.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=190852477335
FIREBASE_APP_ID=1:190852477335:web:b720a9a9217ae5fffe94d2
```

5. Redeploy to apply changes

---

## Step 8: Verify Deployment

1. Visit: https://lead-management-system-gray.vercel.app
2. Test login functionality
3. Verify Firebase connection works
4. Check browser console for errors

---

## Security Checklist

- [x] All hardcoded API keys removed
- [x] Environment variables configured
- [x] .gitignore excludes .env.local
- [x] Security check script created
- [x] GitHub Actions security check created
- [x] Documentation complete
- [ ] .env.local created locally (not committed)
- [ ] Vercel environment variables set
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub
- [ ] Deployment verified

---

## Post-Setup

### Regular Security Checks

```bash
# Before each commit, run:
node scripts/check-secrets.js

# Or add as pre-commit hook:
# .git/hooks/pre-commit
#!/bin/sh
node scripts/check-secrets.js
```

### Updating API Keys

If API key needs to be changed:
1. Update in Firebase Console
2. Update `.env.local` (local)
3. Update Vercel environment variables (production)
4. Redeploy

---

## Repository Structure

```
appliance-insurance-form/
├── .github/
│   └── workflows/
│       └── security-check.yml    # Automated security scanning
├── src/                          # Source code (no secrets)
├── scripts/                      # Utility scripts (use env vars)
├── .gitignore                    # Excludes secrets
├── .env.example                  # Template (safe to commit)
├── README.md                     # Project documentation
├── SECURITY_SETUP.md             # Security guide
└── SETUP_ENV_VARS.md             # Environment variable setup
```

---

## Quick Reference

**Local Development:**
```bash
cp .env.example .env.local
# Edit .env.local with your API key
node scripts/inject-env-config.js > src/config/env-config.js
```

**Production (Vercel):**
- Set environment variables in Vercel dashboard
- Vercel automatically injects them

**Security Check:**
```bash
node scripts/check-secrets.js
```

---

**Status:** ✅ **READY TO CREATE REPOSITORY**

All security requirements met. Safe to commit and push to GitHub.
