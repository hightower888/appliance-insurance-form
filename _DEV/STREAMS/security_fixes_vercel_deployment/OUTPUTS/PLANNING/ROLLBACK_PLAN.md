# Rollback Plan - Security Fixes Deployment
**Date:** 2025-01-20  
**Stream:** security_fixes_vercel_deployment  
**Status:** Ready for Use

---

## Overview

This rollback plan provides step-by-step procedures to revert security fixes if critical issues are discovered during or after deployment.

---

## Rollback Scenarios

### Scenario 1: CSP Breaks Functionality
**Symptoms:**
- Pages don't load
- Scripts blocked by CSP
- Console shows CSP violations
- Critical features broken

**Rollback Steps:**
1. Identify which CSP directive is causing issues
2. Option A: Revert middleware.ts to previous version
3. Option B: Temporarily remove middleware.ts
4. Option C: Add exception to CSP (temporary)
5. Redeploy: `vercel --prod`
6. Verify functionality restored

**Time to Rollback:** 5-10 minutes

---

### Scenario 2: CORS Blocks Legitimate Requests
**Symptoms:**
- API calls failing
- CORS errors in console
- Cross-origin requests blocked
- Frontend can't communicate with backend

**Rollback Steps:**
1. Identify which origins are blocked
2. Option A: Add missing origins to allowedOrigins array
3. Option B: Temporarily allow all origins (not recommended)
4. Option C: Revert middleware.ts CORS configuration
5. Update middleware.ts
6. Redeploy: `vercel --prod`
7. Verify API calls work

**Time to Rollback:** 5-10 minutes

---

### Scenario 3: Rate Limiting Blocks Legitimate Users
**Symptoms:**
- Legitimate users can't log in
- False positive rate limiting
- User complaints
- High error rates

**Rollback Steps:**
1. Identify affected users
2. Option A: Increase rate limit threshold
3. Option B: Disable rate limiting temporarily
4. Option C: Revert to previous NextAuth configuration
5. Update configuration
6. Redeploy: `vercel --prod`
7. Monitor for stability

**Time to Rollback:** 10-15 minutes

---

### Scenario 4: Deployment Failure
**Symptoms:**
- Build fails
- Deployment errors
- Site down
- Vercel deployment failed

**Rollback Steps:**
1. Check Vercel deployment logs
2. Identify build error
3. Option A: Fix error and redeploy
4. Option B: Revert to previous Git commit
5. Option C: Redeploy previous Vercel deployment
6. Verify site is back up

**Time to Rollback:** 5-15 minutes

---

## Rollback Procedures by Phase

### Phase 1 Rollback: CSP and CORS

**Quick Rollback:**
```bash
# 1. Remove middleware.ts
rm middleware.ts

# 2. Redeploy
vercel --prod

# 3. Verify
curl -I https://sales-form-chi.vercel.app/auth/login
```

**Partial Rollback (CSP only):**
```typescript
// In middleware.ts, temporarily allow unsafe-inline
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.vercel.app;
  // ... rest of CSP
`;
```

**Partial Rollback (CORS only):**
```typescript
// In middleware.ts, temporarily allow all origins
const allowedOrigins = ['*']; // TEMPORARY - NOT RECOMMENDED
```

---

### Phase 2 Rollback: Rate Limiting

**Quick Rollback:**
```bash
# 1. Revert NextAuth configuration
git checkout HEAD~1 -- app/api/auth/[...nextauth]/route.ts
# Or restore from backup

# 2. Remove rate limiting integration
# Edit NextAuth config to remove rate limiting

# 3. Redeploy
vercel --prod
```

**Partial Rollback (Disable rate limiting):**
```typescript
// In nextauth-with-ratelimit.ts, comment out rate limiting
async authorize(credentials) {
  // const rateLimitResult = checkRateLimit(identifier, 5);
  // if (!rateLimitResult.allowed) {
  //   throw new Error('Invalid credentials');
  // }
  
  // Continue with authentication...
}
```

---

### Phase 3 Rollback: Error Page

**Quick Rollback:**
```bash
# 1. Remove error page
rm -rf app/auth/error

# 2. Redeploy
vercel --prod
```

---

## Git-Based Rollback

### If Using Git Integration

**Rollback to Previous Commit:**
```bash
# 1. Identify commit to rollback to
git log --oneline

# 2. Create rollback branch
git checkout -b rollback-security-fixes

# 3. Revert to previous commit
git revert HEAD
# Or
git reset --hard <previous-commit-hash>

# 4. Push rollback
git push origin rollback-security-fixes

# 5. Vercel will auto-deploy
# Or manually trigger deployment
```

**Rollback Specific Files:**
```bash
# Revert only middleware.ts
git checkout HEAD~1 -- middleware.ts
git commit -m "Rollback: Revert middleware.ts"
git push
```

---

## Vercel Dashboard Rollback

### Using Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - Navigate to project: sales-form-chi
   - Click on "Deployments" tab

2. **Find Previous Deployment:**
   - Look for deployment before security fixes
   - Check deployment timestamp
   - Verify it was working

3. **Redeploy Previous Version:**
   - Click on previous deployment
   - Click "..." menu
   - Select "Promote to Production"
   - Confirm promotion

4. **Verify Rollback:**
   - Check site is working
   - Verify functionality restored
   - Monitor for stability

---

## Emergency Rollback Procedure

### If Site is Down

**Immediate Actions (First 5 Minutes):**
1. [ ] Assess severity
2. [ ] Notify team
3. [ ] Check Vercel status page
4. [ ] Review deployment logs

**Quick Rollback (5-10 Minutes):**
1. [ ] Access Vercel dashboard
2. [ ] Promote previous deployment
3. [ ] Or remove problematic files
4. [ ] Redeploy immediately

**Verification (10-15 Minutes):**
1. [ ] Test critical functionality
2. [ ] Verify site is accessible
3. [ ] Monitor error rates
4. [ ] Document issue

---

## Rollback Verification

### After Rollback

**Immediate Checks:**
- [ ] Site is accessible
- [ ] Critical functionality works
- [ ] No error spikes
- [ ] User complaints stop

**Extended Monitoring:**
- [ ] Monitor for 1 hour
- [ ] Check error logs
- [ ] Verify stability
- [ ] Document lessons learned

---

## Prevention Measures

### Before Deployment
- [ ] Test thoroughly in staging
- [ ] Have rollback plan ready
- [ ] Backup current configuration
- [ ] Document current state

### During Deployment
- [ ] Deploy during low-traffic period
- [ ] Monitor closely
- [ ] Have rollback ready
- [ ] Keep team informed

### After Deployment
- [ ] Monitor for 24 hours
- [ ] Watch error rates
- [ ] Collect user feedback
- [ ] Be ready to rollback

---

## Rollback Decision Matrix

| Issue Severity | Impact | Rollback Decision |
|----------------|--------|-------------------|
| Critical - Site Down | High | Immediate Rollback |
| Critical - Security Breach | High | Immediate Rollback |
| High - Major Functionality Broken | Medium | Rollback within 1 hour |
| Medium - Minor Issues | Low | Fix forward or rollback |
| Low - Cosmetic Issues | Very Low | Fix forward |

---

## Communication Plan

### During Rollback

**Internal Communication:**
- [ ] Notify team immediately
- [ ] Update status page
- [ ] Document issue

**External Communication (if needed):**
- [ ] Update users if site was down
- [ ] Explain resolution
- [ ] Provide timeline

---

## Post-Rollback Actions

### Immediate (First Hour)
- [ ] Document what went wrong
- [ ] Identify root cause
- [ ] Plan fix for issue
- [ ] Update rollback plan if needed

### Short-term (24 Hours)
- [ ] Implement fix for issue
- [ ] Test fix thoroughly
- [ ] Plan re-deployment
- [ ] Review process

### Long-term (1 Week)
- [ ] Conduct post-mortem
- [ ] Update procedures
- [ ] Improve testing
- [ ] Enhance monitoring

---

## Rollback Checklist

### Pre-Rollback
- [ ] Issue identified and assessed
- [ ] Rollback method chosen
- [ ] Team notified
- [ ] Backup verified

### During Rollback
- [ ] Rollback steps executed
- [ ] Deployment reverted
- [ ] Verification tests run
- [ ] Status updated

### Post-Rollback
- [ ] Site functionality verified
- [ ] Monitoring active
- [ ] Issue documented
- [ ] Fix planned

---

**Plan Created:** 2025-01-20  
**Status:** Ready for Use  
**Next Step:** Keep this plan accessible during deployment
