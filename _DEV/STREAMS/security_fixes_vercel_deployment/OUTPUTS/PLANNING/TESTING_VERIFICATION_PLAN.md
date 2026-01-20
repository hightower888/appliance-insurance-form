# Testing and Verification Plan
**Date:** 2025-01-20  
**Stream:** security_fixes_vercel_deployment  
**Status:** Ready for Use

---

## Testing Strategy

### Testing Levels
1. **Unit Testing** - Individual components
2. **Integration Testing** - Component interactions
3. **Security Testing** - Vulnerability verification
4. **End-to-End Testing** - Full user flows

### Testing Environments
- **Local** - Development environment
- **Staging** - Pre-production (if available)
- **Production** - Live environment (after deployment)

---

## Phase 1: CSP and CORS Testing

### CSP Testing

**Test 1.1: CSP Header Verification**
```bash
# Command
curl -I https://sales-form-chi.vercel.app/auth/login | grep -i "content-security-policy"

# Expected Result
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-...' ...
# Should NOT contain: unsafe-inline, unsafe-eval

# Pass Criteria
✅ CSP header present
✅ No unsafe-inline
✅ No unsafe-eval
✅ Nonce present (or hash-based)
```

**Test 1.2: CSP Violations Check**
```bash
# Manual Test in Browser
1. Open https://sales-form-chi.vercel.app/auth/login
2. Open DevTools → Console
3. Check for CSP violation errors
4. Verify all scripts load

# Expected Result
✅ No CSP violations in console
✅ All scripts load successfully
✅ Page renders correctly
```

**Test 1.3: Inline Script Blocking**
```bash
# Test that inline scripts are blocked
# Add test inline script to page (if possible)
# Or check that existing inline scripts use nonces

# Expected Result
✅ Inline scripts without nonces are blocked
✅ Nonce-based scripts work
```

### CORS Testing

**Test 2.1: Allowed Origin**
```bash
# Command
curl -H "Origin: https://sales-form-chi.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://sales-form-chi.vercel.app/api/auth/login \
     -v

# Expected Result
< Access-Control-Allow-Origin: https://sales-form-chi.vercel.app
< Access-Control-Allow-Methods: GET, POST, OPTIONS
< Access-Control-Allow-Credentials: true

# Pass Criteria
✅ CORS header present
✅ Specific origin (not *)
✅ Methods listed
✅ Credentials allowed
```

**Test 2.2: Disallowed Origin**
```bash
# Command
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://sales-form-chi.vercel.app/api/auth/login \
     -v

# Expected Result
# Should NOT return Access-Control-Allow-Origin: *
# Should return 403 or no CORS headers

# Pass Criteria
✅ No CORS headers for disallowed origin
✅ Or returns 403 Forbidden
```

**Test 2.3: API Functionality**
```bash
# Test that API calls work from allowed origin
# Test in browser from sales-form-chi.vercel.app

# Expected Result
✅ API calls succeed from allowed origin
✅ API calls fail from disallowed origin
```

### Header Testing

**Test 3.1: Framework Headers Hidden**
```bash
# Command
curl -I https://sales-form-chi.vercel.app/auth/login | grep -i "nextjs\|vercel-id\|vercel-cache"

# Expected Result
# Should return no results (headers hidden)

# Pass Criteria
✅ No x-nextjs-* headers
✅ No x-vercel-id header
✅ No x-vercel-cache header
```

**Test 3.2: Security Headers Present**
```bash
# Command
curl -I https://sales-form-chi.vercel.app/auth/login

# Expected Headers
✅ Strict-Transport-Security
✅ X-Frame-Options
✅ X-XSS-Protection
✅ X-Content-Type-Options
✅ Referrer-Policy
✅ Permissions-Policy
✅ Content-Security-Policy
```

---

## Phase 2: Rate Limiting Testing

### Rate Limiting Tests

**Test 4.1: Rate Limit Enforcement**
```bash
# Script
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://sales-form-chi.vercel.app/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nHTTP: %{http_code}\n" \
    -s
  sleep 1
done

# Expected Result
Attempt 1-5: HTTP 401 or 403 (authentication failed)
Attempt 6: HTTP 429 (Too Many Requests) or generic error

# Pass Criteria
✅ First 5 attempts allowed
✅ 6th attempt blocked
✅ Appropriate error message
```

**Test 4.2: Rate Limit Reset**
```bash
# Test that rate limit resets after time window
# Wait 15 minutes after Test 4.1
# Then retry login

# Expected Result
✅ Login attempt succeeds after time window
✅ Rate limit counter reset
```

**Test 4.3: Legitimate Login**
```bash
# Test that legitimate login works
# Use valid credentials

# Expected Result
✅ Login succeeds
✅ Rate limit reset on successful login
✅ No false positives
```

### Error Message Testing

**Test 5.1: Generic Error Messages**
```bash
# Command
curl -X POST https://sales-form-chi.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}' \
  -s

# Expected Result
# Generic error message
# Should NOT contain: "NextAuth.js", "Next.js", framework details

# Pass Criteria
✅ Generic error message
✅ No framework details
✅ No implementation details
```

**Test 5.2: Error Page**
```bash
# Navigate to /auth/error in browser

# Expected Result
✅ Generic error message displayed
✅ No framework details
✅ User-friendly interface
✅ Links work correctly
```

---

## Phase 3: Final Verification

### Comprehensive Testing

**Test 6.1: Full Security Scan**
```bash
# Run verification script
./scripts/verify-security-fixes.sh

# Or manual checks:
# 1. CSP secure
# 2. CORS restricted
# 3. Rate limiting active
# 4. Headers hidden
# 5. Error messages generic
```

**Test 6.2: Functionality Testing**
- [ ] Login works with valid credentials
- [ ] All pages load correctly
- [ ] No console errors
- [ ] No CSP violations
- [ ] API endpoints work
- [ ] Error handling works

**Test 6.3: Performance Testing**
- [ ] Page load times acceptable
- [ ] No performance degradation
- [ ] Rate limiting doesn't slow legitimate requests

---

## Automated Verification Script

Create `scripts/verify-security-fixes.sh`:

```bash
#!/bin/bash

echo "🔍 Verifying Security Fixes for sales-form-chi.vercel.app"
echo "=================================================="
echo ""

BASE_URL="https://sales-form-chi.vercel.app"
PASSED=0
FAILED=0

# Test 1: CSP
echo "1. Testing CSP..."
CSP=$(curl -s -I "$BASE_URL/auth/login" | grep -i "content-security-policy" | head -1)
if echo "$CSP" | grep -q "unsafe-inline\|unsafe-eval"; then
  echo "❌ FAIL: CSP still contains unsafe directives"
  FAILED=$((FAILED + 1))
else
  echo "✅ PASS: CSP is secure"
  PASSED=$((PASSED + 1))
fi

# Test 2: CORS
echo ""
echo "2. Testing CORS..."
CORS=$(curl -s -I "$BASE_URL/api/auth/login" | grep -i "access-control-allow-origin" | head -1)
if echo "$CORS" | grep -q "\*"; then
  echo "❌ FAIL: CORS still allows all origins"
  FAILED=$((FAILED + 1))
else
  echo "✅ PASS: CORS is restricted"
  PASSED=$((PASSED + 1))
fi

# Test 3: Framework Headers
echo ""
echo "3. Testing Framework Headers..."
HEADERS=$(curl -s -I "$BASE_URL/auth/login" | grep -i "nextjs\|vercel-id" | head -1)
if [ -z "$HEADERS" ]; then
  echo "✅ PASS: Framework headers are hidden"
  PASSED=$((PASSED + 1))
else
  echo "⚠️  WARN: Some framework headers still visible"
  FAILED=$((FAILED + 1))
fi

# Test 4: Security Headers
echo ""
echo "4. Testing Security Headers..."
HEADERS=$(curl -s -I "$BASE_URL/auth/login")
REQUIRED_HEADERS=("Strict-Transport-Security" "X-Frame-Options" "X-XSS-Protection" "X-Content-Type-Options")
MISSING=0

for header in "${REQUIRED_HEADERS[@]}"; do
  if echo "$HEADERS" | grep -qi "$header"; then
    echo "  ✅ $header present"
  else
    echo "  ❌ $header missing"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -eq 0 ]; then
  echo "✅ PASS: All security headers present"
  PASSED=$((PASSED + 1))
else
  echo "❌ FAIL: $MISSING security headers missing"
  FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Please review."
  exit 1
fi
```

---

## Manual Testing Checklist

### Browser Testing
- [ ] Open site in Chrome
- [ ] Open site in Firefox
- [ ] Open site in Safari
- [ ] Check DevTools Console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify CSP violations (should be none)
- [ ] Test login functionality
- [ ] Test error pages

### Mobile Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Verify responsive design
- [ ] Test touch interactions

### Accessibility Testing
- [ ] Test with screen reader
- [ ] Test keyboard navigation
- [ ] Verify error messages are accessible

---

## Performance Testing

### Load Testing
- [ ] Test page load times
- [ ] Test API response times
- [ ] Verify no performance degradation
- [ ] Check resource loading

### Stress Testing
- [ ] Test rate limiting under load
- [ ] Test multiple concurrent logins
- [ ] Verify system stability

---

## Security Testing

### Penetration Testing
- [ ] Test XSS prevention
- [ ] Test CSRF protection
- [ ] Test injection attacks
- [ ] Verify authentication security

### Compliance Testing
- [ ] Verify OWASP Top 10 compliance
- [ ] Check GDPR compliance (if applicable)
- [ ] Verify security best practices

---

## Test Results Documentation

### Test Report Template

```markdown
# Security Fixes Test Report
**Date:** [Date]
**Tester:** [Name]
**Environment:** [Production/Staging]

## Test Results

### Phase 1: CSP and CORS
- [ ] CSP Test 1.1: ✅/❌
- [ ] CSP Test 1.2: ✅/❌
- [ ] CORS Test 2.1: ✅/❌
- [ ] CORS Test 2.2: ✅/❌

### Phase 2: Rate Limiting
- [ ] Rate Limit Test 4.1: ✅/❌
- [ ] Rate Limit Test 4.2: ✅/❌
- [ ] Error Message Test 5.1: ✅/❌

### Phase 3: Final Verification
- [ ] Comprehensive Test 6.1: ✅/❌
- [ ] Functionality Test 6.2: ✅/❌

## Issues Found
[List any issues]

## Recommendations
[List recommendations]
```

---

**Plan Created:** 2025-01-20  
**Status:** Ready for Use  
**Next Step:** Execute tests after each deployment phase
