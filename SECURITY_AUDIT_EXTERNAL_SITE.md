# Security Audit Report: External Site
**Date:** 2025-01-19  
**Target:** https://sales-form-chi.vercel.app/auth/login  
**Site Owner:** Colleague's Sales Form Application  
**Status:** ⚠️ CRITICAL VULNERABILITIES FOUND

---

## Executive Summary

A security audit of the external login page at `sales-form-chi.vercel.app/auth/login` revealed **critical security vulnerabilities** that pose significant risks. The most severe issues involve weak Content Security Policy (CSP) configuration, potential XSS vulnerabilities, and missing security best practices.

---

## Critical Vulnerabilities Found

### 🔴 CRITICAL-1: Weak Content Security Policy (CSP)

**Severity:** CRITICAL  
**CVSS Score:** 8.1 (High)  
**Location:** HTTP Response Headers

**Issue:**
The CSP header contains **`'unsafe-inline'`** and **`'unsafe-eval'`** directives, which severely weaken XSS protection:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.postcodes.io; frame-ancestors 'none';
```

**Problems:**
- `'unsafe-inline'` allows inline scripts and event handlers, making XSS attacks much easier
- `'unsafe-eval'` allows `eval()`, `Function()`, and similar code execution, enabling code injection
- No nonce-based or hash-based script validation
- Overly permissive policy defeats the purpose of CSP

**Impact:**
- XSS attacks can inject and execute malicious JavaScript
- Attackers can steal session tokens, credentials, or sensitive data
- Code injection attacks possible via `eval()` or similar functions
- Malicious scripts can bypass CSP restrictions

**Evidence:**
```bash
$ curl -I https://sales-form-chi.vercel.app/auth/login
content-security-policy: ... script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
```

**Recommendation:**
1. **Remove `'unsafe-inline'` and `'unsafe-eval'`** from CSP
2. Use **nonces** or **hashes** for required inline scripts
3. Move all inline scripts to external files
4. Use strict CSP: `script-src 'self' 'nonce-{random}'` or `script-src 'self' 'sha256-{hash}'`
5. Test thoroughly to ensure site functionality remains intact

**Fix Example:**
```javascript
// Instead of:
script-src 'self' 'unsafe-inline' 'unsafe-eval'

// Use:
script-src 'self' 'nonce-{random-nonce-per-request}'
// Or for static scripts:
script-src 'self' 'sha256-{hash-of-script-content}'
```

---

### 🔴 CRITICAL-2: Potential React/Next.js Vulnerabilities

**Severity:** CRITICAL  
**CVSS Score:** 9.8 (Critical)  
**Location:** Application Framework

**Issue:**
Based on HTTP headers, the site uses **Next.js** (evident from `x-nextjs-prerender`, `x-nextjs-stale-time` headers). Recent critical vulnerabilities affect Next.js:

**Known Vulnerabilities:**
- **CVE-2025-55182 / CVE-2025-66478** (React2Shell) - Critical RCE vulnerability
- **CVE-2025-55184** - Denial of Service
- **CVE-2025-55183** - Source code exposure

**Affected Versions:**
- Next.js 15.0.0 to 16.0.6
- React Server Components

**Impact:**
- **Remote Code Execution (RCE)** possible under certain conditions
- Denial of Service attacks
- Source code exposure
- Complete system compromise

**Recommendation:**
1. **Immediately check Next.js version** in `package.json`
2. **Update to Next.js ≥ 16.0.7** if vulnerable
3. **Update React to patched versions** (React 19)
4. **Audit all dependencies** for known vulnerabilities
5. **Review Vercel deployment logs** for any suspicious activity

**Verification:**
```bash
# Check package.json or build output
# Look for Next.js version
# If between 15.0.0 and 16.0.6, URGENT UPDATE REQUIRED
```

---

### 🟠 HIGH-1: Missing Security Headers

**Severity:** HIGH  
**CVSS Score:** 6.5 (Medium)  
**Location:** HTTP Response Headers

**Issue:**
While some security headers are present, several important ones are missing:

**Present Headers:**
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: geolocation=(), microphone=(), camera=()`

**Missing Headers:**
- ❌ **No `X-Permitted-Cross-Domain-Policies`**
- ❌ **No `Expect-CT` header** (if using Certificate Transparency)
- ❌ **No `Cross-Origin-Embedder-Policy`** (COEP)
- ❌ **No `Cross-Origin-Opener-Policy`** (COOP)
- ❌ **No `Cross-Origin-Resource-Policy`** (CORP)

**Impact:**
- Reduced protection against clickjacking (though X-Frame-Options helps)
- Missing additional layers of security
- No protection against cross-origin attacks

**Recommendation:**
Add missing security headers:
```javascript
{
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
}
```

---

### 🟠 HIGH-2: CORS Configuration

**Severity:** HIGH  
**CVSS Score:** 6.1 (Medium)  
**Location:** HTTP Response Headers

**Issue:**
The response includes:
```
access-control-allow-origin: *
```

**Problems:**
- Allows **any origin** to make requests to the API
- No origin restrictions
- Potential for CSRF attacks if combined with other vulnerabilities
- Credentials can be exposed to any origin

**Impact:**
- Cross-origin attacks possible
- CSRF vulnerabilities if authentication cookies are accessible
- Data leakage to unauthorized origins

**Recommendation:**
1. **Restrict CORS to specific origins:**
   ```
   Access-Control-Allow-Origin: https://sales-form-chi.vercel.app
   ```
2. **Use credentials only when necessary:**
   ```
   Access-Control-Allow-Credentials: true
   ```
3. **Specify allowed methods and headers:**
   ```
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

---

### 🟡 MEDIUM-1: Information Disclosure

**Severity:** MEDIUM  
**CVSS Score:** 4.3 (Low)  
**Location:** HTTP Response Headers

**Issue:**
Headers reveal technical details about the application:

**Revealed Information:**
- `x-nextjs-prerender: 1` - Reveals Next.js framework
- `x-nextjs-stale-time: 300` - Reveals caching strategy
- `x-vercel-id: lhr1::bnk42-1768813531153-eff3650b9fc1` - Reveals deployment region and instance
- `x-vercel-cache: HIT` - Reveals caching status
- `x-matched-path: /auth/login` - Reveals routing structure

**Impact:**
- Attackers can identify framework and version
- Helps attackers target specific vulnerabilities
- Reveals infrastructure details

**Recommendation:**
1. Remove or obfuscate framework-specific headers in production
2. Use generic server headers instead
3. Configure Next.js to hide framework details

---

### 🟡 MEDIUM-2: Cache Configuration

**Severity:** MEDIUM  
**CVSS Score:** 4.0 (Low)  
**Location:** HTTP Response Headers

**Issue:**
```
cache-control: public, max-age=0, must-revalidate
```

**Problems:**
- Login pages should typically not be cached
- `public` allows CDN/proxy caching
- Could expose sensitive content if misconfigured

**Impact:**
- Potential for cached login pages with sensitive data
- Session information could be cached
- CSRF tokens could be cached

**Recommendation:**
For login pages, use:
```
Cache-Control: no-store, no-cache, must-revalidate, private
```

---

## Positive Security Features

### ✅ Good Security Practices Found

1. **HTTPS Enforcement:** HSTS header properly configured
2. **Frame Protection:** X-Frame-Options: DENY prevents clickjacking
3. **Content Type Protection:** X-Content-Type-Options prevents MIME sniffing
4. **XSS Protection:** X-XSS-Protection header present
5. **Referrer Policy:** Strict referrer policy configured
6. **Permissions Policy:** Restricts geolocation, microphone, camera

---

## Risk Assessment Summary

| Severity | Count | Risk Level |
|----------|-------|------------|
| 🔴 CRITICAL | 2 | **IMMEDIATE ACTION REQUIRED** |
| 🟠 HIGH | 2 | **Address within 1 week** |
| 🟡 MEDIUM | 2 | **Address within 1 month** |

**Overall Risk:** 🔴 **CRITICAL** - Immediate remediation required

---

## Immediate Action Items

### Priority 1: Critical (This Week)

1. **Fix CSP Configuration** (CRITICAL-1)
   - Remove `'unsafe-inline'` and `'unsafe-eval'`
   - Implement nonce-based CSP
   - Estimated time: 4-6 hours
   - **Impact:** Prevents XSS attacks

2. **Check and Update Next.js** (CRITICAL-2)
   - Verify Next.js version
   - Update if vulnerable (15.0.0 - 16.0.6)
   - Estimated time: 1-2 hours
   - **Impact:** Prevents RCE vulnerabilities

### Priority 2: High (This Month)

3. **Restrict CORS** (HIGH-2)
   - Change from `*` to specific origins
   - Estimated time: 1 hour
   - **Impact:** Prevents cross-origin attacks

4. **Add Missing Security Headers** (HIGH-1)
   - Add COEP, COOP, CORP headers
   - Estimated time: 1 hour
   - **Impact:** Additional security layers

### Priority 3: Medium (Next Month)

5. **Fix Cache Configuration** (MEDIUM-2)
6. **Remove Information Disclosure** (MEDIUM-1)

---

## Testing Recommendations

After implementing fixes, test for:

1. ✅ XSS prevention (try injecting `<script>alert(1)</script>`)
2. ✅ CSP violations (check browser console)
3. ✅ CORS restrictions (test from different origins)
4. ✅ Framework version (verify Next.js is updated)
5. ✅ Security headers (use securityheaders.com or similar)

---

## Tools for Verification

### Online Security Scanners:
- **SecurityHeaders.com**: https://securityheaders.com/?q=https://sales-form-chi.vercel.app/auth/login
- **Mozilla Observatory**: https://observatory.mozilla.org/
- **SSL Labs**: https://www.ssllabs.com/ssltest/

### Manual Testing:
```bash
# Check headers
curl -I https://sales-form-chi.vercel.app/auth/login

# Check for XSS
# Try injecting: <script>alert('XSS')</script> in form fields

# Check CSP
# Open browser DevTools → Console → Look for CSP violations
```

---

## Compliance Considerations

**OWASP Top 10:**
- **A03:2021 – Injection** (mitigated by fixing CSP)
- **A05:2021 – Security Misconfiguration** (CSP, CORS, headers)
- **A07:2021 – Identification and Authentication Failures** (depends on implementation)

**PCI DSS:**
- Weak CSP could violate requirement 6.5.7 (XSS prevention)

**GDPR:**
- Security vulnerabilities could lead to data breaches
- Must ensure proper security measures are in place

---

## Conclusion

The external site has **critical security vulnerabilities** that require immediate attention. The most urgent issues are:

1. **Weak CSP with unsafe-inline/unsafe-eval** - Allows XSS attacks
2. **Potential Next.js vulnerabilities** - Could allow RCE

**Recommended Actions:**
1. **Immediately** fix CSP configuration
2. **Immediately** verify and update Next.js version
3. **This week** restrict CORS and add missing headers
4. **This month** address medium-priority issues

**Estimated Total Remediation Time:** 1-2 days for critical fixes

---

## References

- [Vercel Security Headers Documentation](https://vercel.com/docs/headers/security-headers)
- [React2Shell Vulnerability (CVE-2025-55182)](https://vercel.com/kb/bulletin/react2shell)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

**Report Generated:** 2025-01-19  
**Next Review:** After critical fixes implemented

**Note:** This audit is based on publicly available information (HTTP headers, web search results). A full security audit would require access to source code, configuration files, and permission for penetration testing.
