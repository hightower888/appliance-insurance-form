# Repository Setup Plan

**Date:** 2025-01-27  
**Stream:** github_repository_setup

---

## Overview

Plan for creating a secure GitHub repository for the appliance insurance form project with proper secret management.

---

## Prerequisites

### ✅ Completed
- Git repository initialized
- .gitignore configured
- .env.example created
- GitHub Actions security check created
- README.md created
- SECURITY_SETUP.md created

### ⚠️ Required Before Proceeding
- Move hardcoded API keys to environment variables
- Test environment variable setup locally
- Verify no secrets in code

---

## Repository Structure

```
appliance_insurance_form/
├── .github/
│   └── workflows/
│       └── security-check.yml      # Security scanning
├── src/                            # Source code
├── functions/                      # Firebase functions
├── scripts/                        # Utility scripts
├── .gitignore                      # Excludes secrets
├── .env.example                    # Environment template
├── README.md                       # Project documentation
├── SECURITY_SETUP.md               # Security guide
└── database.rules.json             # Firebase rules
```

---

## Setup Steps

### Step 1: Secure Code (REQUIRED)

**Create Firebase Config Loader:**

```javascript
// src/config/firebase-config.js
export function getFirebaseConfig() {
  // For client-side: Use build-time env vars or window injection
  if (typeof window !== 'undefined' && window.firebaseConfig) {
    return window.firebaseConfig;
  }
  
  // Fallback to hardcoded (development only)
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "development-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "appliance-bot.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://appliance-bot-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "appliance-bot",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "appliance-bot.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "190852477335",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:190852477335:web:b720a9a9217ae5fffe94d2"
  };
}
```

**Update Scripts to Use dotenv:**

```javascript
// scripts/*.js
require('dotenv').config({ path: '.env.local' });
const apiKey = process.env.FIREBASE_API_KEY;
```

### Step 2: Verify Security

```bash
# Check for hardcoded keys
grep -r "AIzaSy" --include="*.js" src/ scripts/ | grep -v ".env.example"

# Should return nothing
```

### Step 3: Create GitHub Repository

**Option A: GitHub CLI**
```bash
gh repo create appliance-insurance-form \
  --public \
  --description "Lead management system for appliance insurance" \
  --clone=false
```

**Option B: GitHub Web UI**
1. Go to https://github.com/new
2. Repository name: `appliance-insurance-form`
3. Description: "Lead management system for appliance insurance"
4. Visibility: Public or Private
5. Don't initialize with README (we have one)
6. Create repository

### Step 4: Initial Commit

```bash
# Stage files (excluding secrets)
git add .

# Verify no secrets are staged
git diff --cached | grep "AIzaSy"

# Commit
git commit -m "Initial commit: Appliance insurance form lead management system

- Performance optimizations (pagination, caching, query optimization)
- Secure database rules with data isolation
- CRM, Processor, and Admin interfaces
- Comprehensive documentation"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/appliance-insurance-form.git

# Push
git push -u origin main
```

### Step 5: Configure Repository

1. **Branch Protection:**
   - Settings → Branches → Add rule
   - Require pull request reviews
   - Require status checks (security-check)

2. **Secrets (if using CI/CD):**
   - Settings → Secrets and variables → Actions
   - Add: `FIREBASE_API_KEY`, `VERCEL_TOKEN` (if needed)

3. **Environment Variables (Vercel):**
   - Vercel Dashboard → Project Settings → Environment Variables
   - Add all Firebase config variables

---

## Security Checklist

- [ ] All API keys moved to environment variables
- [ ] No hardcoded secrets in code
- [ ] .gitignore verified
- [ ] .env.local not committed
- [ ] Security check workflow added
- [ ] README includes security notes
- [ ] Branch protection enabled
- [ ] Environment variables configured in Vercel

---

## Post-Setup

1. **Test Deployment:**
   - Verify Vercel deployment works with env vars
   - Test all functionality

2. **Documentation:**
   - Update README with setup instructions
   - Document environment variable requirements

3. **Monitoring:**
   - Set up GitHub Dependabot (optional)
   - Monitor security alerts

---

## Rollback Plan

If issues occur:
1. Revert commit if secrets exposed
2. Regenerate API key in Firebase Console
3. Update all environments with new key
4. Fix code and recommit

---

**Status:** ⚠️ **BLOCKED** - Awaiting code security fixes
