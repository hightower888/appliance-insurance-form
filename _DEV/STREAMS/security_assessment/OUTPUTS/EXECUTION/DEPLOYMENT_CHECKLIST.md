# Deployment Checklist - Security Assessment

**Generated:** 2025-01-09T00:00:00Z
**Stream:** security_assessment
**Status:** Ready for Deployment

---

## Pre-Deployment Checklist

### ✅ Code Changes Complete
- [x] CSP `unsafe-eval` removed
- [x] Database rules secured
- [x] XSS sanitization implemented
- [x] Sanitization utility created
- [x] All files modified and tested locally

### ⚠️ Manual Configuration Required

#### 1. Firebase API Key Restrictions
**Status:** PENDING  
**Time:** 5 minutes  
**Action Required:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `appliance-bot`
3. Navigate to: **Authentication** → **Settings** → **Authorized domains**
4. Find API Key restrictions section
5. Add domain restrictions:
   - `customer-web-from-flash.vercel.app`
   - `customer.web.from.flash`
6. Save restrictions

**Why:** Prevents unauthorized use of API key from other domains

---

## Deployment Steps

### Step 1: Review Changes
- [ ] Review all modified files
- [ ] Verify no breaking changes
- [ ] Check that all security fixes are applied

### Step 2: Commit Changes
```bash
git add .
git commit -m "Security fixes: Remove unsafe-eval, secure database rules, fix XSS vulnerabilities"
git push
```

### Step 3: Deploy to Vercel
- [ ] Changes will auto-deploy if connected to Git
- [ ] OR manually deploy via Vercel CLI:
  ```bash
  vercel --prod
  ```
- [ ] Wait for deployment to complete
- [ ] Verify deployment URL: `https://customer-web-from-flash.vercel.app`

### Step 4: Test in Production
- [ ] Test login page loads correctly
- [ ] Test authentication works
- [ ] Test admin panel loads
- [ ] Test processor panel loads
- [ ] Test form submission works
- [ ] Check browser console for errors
- [ ] Check browser console for CSP violations

### Step 5: Verify Security Fixes
- [ ] Verify CSP header (check Network tab)
  - Should NOT contain `unsafe-eval`
  - May still contain `unsafe-inline` (expected)
- [ ] Test database access (authenticated users can access)
- [ ] Test database access (unauthenticated users blocked)
- [ ] Test XSS protection (try injecting script tags in user data)

---

## Post-Deployment Verification

### Google Safe Browsing Check

1. **Check Current Status:**
   - Visit: https://transparencyreport.google.com/safe-browsing/search
   - Enter domain: `customer-web-from-flash.vercel.app`
   - Check status

2. **If Still Flagged:**
   - Click "Request a review"
   - Explain fixes implemented:
     - Removed `unsafe-eval` from CSP
     - Secured database rules
     - Fixed XSS vulnerabilities
     - Added authentication requirements
   - Submit review request

3. **Monitor Status:**
   - Check daily for 24-48 hours
   - Google typically reviews within 24-48 hours
   - Verify warning removed

### Security Headers Verification

Check that security headers are properly set:
- [ ] `Content-Security-Policy` - Contains no `unsafe-eval`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: SAMEORIGIN`
- [ ] `Strict-Transport-Security` header present
- [ ] `Referrer-Policy` header present

**Tool:** Use browser DevTools → Network tab → Check response headers

---

## Rollback Plan

If deployment causes issues:

1. **Revert CSP changes:**
   - Restore `unsafe-eval` temporarily if needed
   - Note: This is NOT recommended, only for emergency

2. **Revert database rules:**
   - Restore previous rules if authentication breaks
   - Note: This reduces security, use only if critical

3. **Revert via Git:**
   ```bash
   git revert HEAD
   git push
   ```

---

## Success Criteria

- [x] All code changes committed
- [ ] Firebase API key restrictions configured
- [ ] Changes deployed to production
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Forms submit correctly
- [ ] No CSP violations in console
- [ ] Database rules enforce authentication
- [ ] Google Safe Browsing review requested
- [ ] Warning removed (within 24-48 hours)

---

## Notes

### Known Limitations
- `unsafe-inline` still present in CSP (needs onclick handler refactoring)
- This is less critical than `unsafe-eval` but should be addressed in future

### Future Improvements
- Replace onclick handlers with addEventListener
- Remove `unsafe-inline` from CSP
- Implement nonce-based CSP for inline scripts

---

**Deployment Status:** ⏳ READY FOR DEPLOYMENT

**Estimated Time:** 30-45 minutes (including testing and verification)
