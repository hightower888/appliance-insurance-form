# Test Plan - Security Fixes

**Generated:** 2025-01-09T00:00:00Z
**Stream:** security_assessment

---

## Test Environment

**Local Server:** Python HTTP Server or Node http-server
**Port:** 8000
**URL:** http://localhost:8000

---

## Test Cases

### 1. CSP Security Test ✅
**Objective:** Verify `unsafe-eval` is removed from CSP

**Steps:**
1. Open browser DevTools → Network tab
2. Load any page (login.html, admin.html, etc.)
3. Check response headers for `Content-Security-Policy`
4. Verify header does NOT contain `unsafe-eval`
5. Verify header still contains `unsafe-inline` (expected)

**Expected Result:**
- ✅ CSP header present
- ✅ No `unsafe-eval` in CSP
- ✅ `unsafe-inline` present (temporary)

**Note:** Local server may not apply Vercel headers. Test in production or use Vercel CLI.

---

### 2. XSS Sanitization Test ✅
**Objective:** Verify user data is sanitized before innerHTML

**Steps:**
1. Open browser DevTools → Console
2. Navigate to admin panel
3. Check that `sanitizeHTML` function is available
4. Test sanitization:
   ```javascript
   // Test in console
   sanitizeHTML('<script>alert("XSS")</script>')
   // Should return: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
   ```
5. Check user table displays correctly
6. Check sales table displays correctly

**Expected Result:**
- ✅ `sanitizeHTML` function available
- ✅ Script tags are escaped
- ✅ User data displays correctly

---

### 3. Database Rules Test ⚠️
**Objective:** Verify database rules require authentication

**Steps:**
1. Deploy database rules to Firebase
2. Test unauthenticated access (should be blocked)
3. Test authenticated access (should work)
4. Check browser console for permission errors

**Expected Result:**
- ✅ Unauthenticated users blocked
- ✅ Authenticated users can access data

**Note:** Requires Firebase deployment. Use `scripts/deploy-database-rules.js`

---

### 4. Functionality Test ✅
**Objective:** Verify site still works after security fixes

**Steps:**
1. Test login page loads
2. Test authentication works
3. Test admin panel loads
4. Test processor panel loads
5. Test form submission works
6. Check browser console for errors

**Expected Result:**
- ✅ All pages load correctly
- ✅ No JavaScript errors
- ✅ All functionality works

---

### 5. Console Error Check ✅
**Objective:** Verify no CSP violations or errors

**Steps:**
1. Open browser DevTools → Console
2. Load all pages
3. Check for CSP violations
4. Check for JavaScript errors
5. Check for network errors

**Expected Result:**
- ✅ No CSP violations (except unsafe-inline warnings, expected)
- ✅ No JavaScript errors
- ✅ No network errors

---

## Quick Test Commands

### Start Local Server
```bash
# Option 1: Python
cd src
python3 -m http.server 8000

# Option 2: Node (if http-server installed)
npx http-server src -p 8000
```

### Test URLs
- Login: http://localhost:8000/login.html
- Admin: http://localhost:8000/admin.html
- Processor: http://localhost:8000/processor.html
- Form: http://localhost:8000/appliance_form.html

### Test Sanitization (Browser Console)
```javascript
// Test sanitization function
sanitizeHTML('<script>alert("XSS")</script>')
// Expected: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"

// Test with user data
sanitizeHTML('John<script>alert("XSS")</script>Doe')
// Expected: "John&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;Doe"
```

---

## Test Checklist

- [ ] Local server starts successfully
- [ ] All pages load without errors
- [ ] `sanitizeHTML` function available
- [ ] Sanitization works correctly
- [ ] No JavaScript errors in console
- [ ] Authentication works
- [ ] Admin panel works
- [ ] Processor panel works
- [ ] Forms submit correctly
- [ ] Database rules deployed (if testing auth)

---

## Known Limitations

1. **CSP Headers:** Local server won't apply Vercel headers. Test CSP in production or use Vercel CLI.
2. **Database Rules:** Requires Firebase deployment to test properly.
3. **API Key Restrictions:** Requires Firebase Console configuration.

---

**Test Status:** Ready to execute
