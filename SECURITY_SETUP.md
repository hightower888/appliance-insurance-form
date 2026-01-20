# Security Setup Guide

## ⚠️ CRITICAL: Before Committing to GitHub

### 1. Move API Keys to Environment Variables

**Current Issue:** API keys are hardcoded in source files. These MUST be moved to environment variables before committing to GitHub.

**Files with hardcoded API keys:**
- `src/auth.js`
- `src/auth-db.js`
- `scripts/*.js` (7 files)

**Solution:** Use environment variables instead.

### 2. Create .env.local File

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your actual API key
# DO NOT commit .env.local to git
```

### 3. Update Code to Use Environment Variables

For client-side code (src/), you'll need to use build-time environment variables:
- Vite: `import.meta.env.VITE_FIREBASE_API_KEY`
- Or use a config file that reads from env

For scripts, use:
```javascript
const apiKey = process.env.FIREBASE_API_KEY || 'fallback';
```

### 4. Verify .gitignore

Ensure `.gitignore` includes:
- `.env`
- `.env.local`
- `.env.*.local`
- `service-account-key.json`
- Any files with secrets

### 5. Check for Exposed Secrets

Before committing, run:
```bash
# Check for API keys
grep -r "AIzaSy" --include="*.js" --include="*.json" src/ scripts/

# Should only find .env.example or documentation
```

### 6. GitHub Secrets (for CI/CD)

If using GitHub Actions, add secrets in:
Settings → Secrets and variables → Actions

Add:
- `FIREBASE_API_KEY`
- `VERCEL_TOKEN` (if needed)
- Other secrets

---

## Quick Security Checklist

- [ ] All API keys moved to environment variables
- [ ] `.env.local` created and added to `.gitignore`
- [ ] `.env.example` created (without real keys)
- [ ] Code updated to read from environment variables
- [ ] No hardcoded secrets in committed files
- [ ] `.gitignore` verified
- [ ] GitHub secrets configured (if using CI/CD)

---

## After Setup

1. **Local Development:**
   - Use `.env.local` for local development
   - Never commit `.env.local`

2. **Production (Vercel):**
   - Add environment variables in Vercel dashboard
   - Project Settings → Environment Variables

3. **CI/CD:**
   - Use GitHub Secrets for sensitive values
   - Never hardcode in workflow files

---

**Status:** ⚠️ **REQUIRES ACTION** - API keys still hardcoded in source files
