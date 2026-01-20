# Vercel Testing Guide - Security Fixes

**Generated:** 2025-01-09T00:00:00Z
**Stream:** security_assessment

---

## Vercel Testing Options

### Option 1: Local Testing with Vercel CLI (Recommended for CSP Testing)

**Command:**
```bash
vercel dev
```

**Benefits:**
- Tests CSP headers locally
- Tests all Vercel configurations
- No deployment needed
- Fast iteration

**Steps:**
1. Install Vercel CLI (if not installed):
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link project (if not already linked):
   ```bash
   vercel link
   ```

4. Start local dev server:
   ```bash
   vercel dev
   ```

5. Test URLs:
   - http://localhost:3000/login.html
   - http://localhost:3000/test-security-fixes.html
   - http://localhost:3000/admin.html

6. Check CSP headers:
   - Open DevTools → Network tab
   - Load any page
   - Check response headers
   - Verify `Content-Security-Policy` header
   - Verify NO `unsafe-eval` in CSP

---

### Option 2: Deploy to Preview/Staging

**Command:**
```bash
vercel
```

**Benefits:**
- Tests in real Vercel environment
- Gets preview URL
- Can share with team
- Tests production-like environment

**Steps:**
1. Deploy to preview:
   ```bash
   vercel
   ```

2. Get preview URL (shown in output)

3. Test preview URL:
   - Check CSP headers
   - Test all functionality
   - Verify security fixes

4. Test CSP:
   - Open DevTools → Network tab
   - Check response headers
   - Verify `Content-Security-Policy` header
   - Verify NO `unsafe-eval` in CSP

---

### Option 3: Deploy to Production

**Command:**
```bash
vercel --prod
```

**Benefits:**
- Tests in actual production environment
- Real domain testing
- Can test Google Safe Browsing

**Steps:**
1. Deploy to production:
   ```bash
   vercel --prod
   ```

2. Test production URL:
   - https://customer-web-from-flash.vercel.app
   - Check CSP headers
   - Test all functionality

3. Verify CSP:
   - Open DevTools → Network tab
   - Check response headers
   - Verify `Content-Security-Policy` header
   - Verify NO `unsafe-eval` in CSP

---

## CSP Header Testing

### What to Check

1. **Header Presence:**
   - `Content-Security-Policy` header should be present
   - Check in Network tab → Response Headers

2. **unsafe-eval Removal:**
   - Header should NOT contain `unsafe-eval`
   - Search header value for "unsafe-eval"
   - Should NOT be found

3. **unsafe-inline (Expected):**
   - Header may still contain `unsafe-inline`
   - This is expected (temporary)
   - Will be removed in future refactoring

### Test Script

```javascript
// Run in browser console on Vercel-deployed site
fetch(window.location.href)
  .then(r => {
    const csp = r.headers.get('Content-Security-Policy');
    console.log('CSP Header:', csp);
    console.log('Has unsafe-eval:', csp.includes('unsafe-eval'));
    console.log('Has unsafe-inline:', csp.includes('unsafe-inline'));
  });
```

---

## Database Rules Testing

### Deploy Database Rules

**Command:**
```bash
node scripts/deploy-database-rules.js
```

**Or manually:**
1. Go to Firebase Console
2. Realtime Database → Rules
3. Copy contents of `database.rules.json`
4. Paste and publish

### Test Database Rules

1. **Unauthenticated Access:**
   - Open site in incognito/private window
   - Try to access data
   - Should be blocked (403 error)

2. **Authenticated Access:**
   - Login with valid credentials
   - Try to access data
   - Should work

3. **Check Console:**
   - Open DevTools → Console
   - Look for permission errors
   - Unauthenticated users should see errors

---

## Complete Test Checklist

### CSP Testing
- [ ] CSP header present
- [ ] `unsafe-eval` NOT in CSP
- [ ] `unsafe-inline` present (expected)
- [ ] No CSP violations in console

### XSS Testing
- [ ] Sanitization function works
- [ ] User data sanitized
- [ ] XSS attempts blocked

### Database Rules Testing
- [ ] Rules deployed to Firebase
- [ ] Unauthenticated access blocked
- [ ] Authenticated access works

### Functionality Testing
- [ ] All pages load
- [ ] Authentication works
- [ ] Admin panel works
- [ ] Forms submit correctly
- [ ] No JavaScript errors

---

## Quick Test Commands

```bash
# Test locally with Vercel
vercel dev

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy database rules
node scripts/deploy-database-rules.js
```

---

**Test Status:** Ready for Vercel testing
