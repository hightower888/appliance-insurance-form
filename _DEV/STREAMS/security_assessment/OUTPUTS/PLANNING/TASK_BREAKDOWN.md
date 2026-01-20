# Task Breakdown - Security Assessment

**Generated:** 2025-01-09T00:00:00Z
**Stream:** security_assessment
**Workflow:** PLANNING - Step 8

---

## Task Breakdown Summary

**Total Tasks:** 12
**Total Phases:** 3
**Estimated Total Effort:** 5-8 hours

---

## Phase 1: Critical Fixes (2-3 hours)

### Task 1.1: Fix CSP - Remove unsafe-inline and unsafe-eval
**ID:** TASK-1.1  
**Priority:** CRITICAL  
**Effort:** 1-2 hours  
**Phase:** 1  
**Dependencies:** None

**Files to Modify:**
- `vercel.json` - MODIFY (Update CSP header)

**Actions:**
1. **MODIFY** `vercel.json` line 41:
   - Remove `'unsafe-inline'` from `script-src` directive
   - Remove `'unsafe-eval'` from `script-src` directive
   - Remove `'unsafe-inline'` from `script-src-elem` directive
   - Add nonce support if inline scripts needed

2. **IDENTIFY** all inline scripts in HTML files:
   - Scan `src/*.html` for `<script>` tags
   - List all inline scripts

3. **MOVE** inline scripts to external files OR add nonces:
   - Option A: Move to external JS files
   - Option B: Add nonce generation and use in CSP

4. **TEST** that all scripts load correctly:
   - Test all pages
   - Check browser console for CSP violations

**Acceptance Criteria:**
- CSP no longer contains `unsafe-inline` or `unsafe-eval`
- All scripts load and function correctly
- No CSP violations in browser console

**Related Requirements:** REQ-1, REQ-4

---

### Task 1.2: Secure Database Rules - Add Auth Checks
**ID:** TASK-1.2  
**Priority:** CRITICAL  
**Effort:** 1 hour  
**Phase:** 1  
**Dependencies:** None

**Files to Modify:**
- `database.rules.json` - MODIFY (Add auth requirements)

**Actions:**
1. **MODIFY** `database.rules.json`:
   - Change `users.read: true` to `users.read: "auth != null"`
   - Change `form_fields.read: true` to `form_fields.read: "auth != null"`
   - Change `form_fields.write: true` to `form_fields.write: "auth != null"`
   - Change `sales.read: true` to `sales.read: "auth != null"`
   - Change `sales.write: true` to `sales.write: "auth != null"`
   - Change `appliance_submissions.read: true` to `appliance_submissions.read: "auth != null"`
   - Change `appliance_submissions.write: true` to `appliance_submissions.write: "auth != null"`
   - Change `security_logs.write: true` to `security_logs.write: "auth != null"`

2. **TEST** authenticated access:
   - Verify authenticated users can read/write data
   - Test admin access to all data

3. **TEST** unauthenticated access:
   - Verify unauthenticated users are blocked
   - Test that public access is denied

**Acceptance Criteria:**
- All database paths require authentication
- Authenticated users can access their data
- Unauthenticated users are blocked
- Admin users can access all data

**Related Requirements:** REQ-2

---

## Phase 2: High Priority Fixes (3-4 hours)

### Task 2.1: Fix XSS - Sanitize User Data
**ID:** TASK-2.1  
**Priority:** HIGH  
**Effort:** 2-3 hours  
**Phase:** 2  
**Dependencies:** TASK-1.2 (Database rules needed for proper access control)

**Files to Modify:**
- `src/admin.js` - MODIFY (Add sanitization)
- `src/processor.js` - MODIFY (Add sanitization)
- `src/services/form-renderer.js` - MODIFY (Add sanitization)

**Files to Create:**
- `src/utils/sanitize.js` - CREATE (Sanitization utility)

**Actions:**
1. **CREATE** `src/utils/sanitize.js`:
   - Create `sanitizeHTML()` function
   - Escape HTML special characters
   - Return sanitized string

2. **MODIFY** `src/admin.js` line 198:
   - Import sanitize utility
   - Sanitize `user.email` and `user.username` before innerHTML

3. **MODIFY** `src/admin.js` line 632:
   - Sanitize `customerName`, `customerEmail`, `agentEmail` before innerHTML

4. **MODIFY** `src/services/form-renderer.js` line 118:
   - Sanitize `field.fieldLabel` and `field.fieldName` before innerHTML

5. **MODIFY** `src/processor.js` line 177:
   - Sanitize customer data before innerHTML

6. **TEST** XSS prevention:
   - Attempt XSS injection in user data
   - Verify it's escaped/sanitized
   - Test legitimate data displays correctly

**Acceptance Criteria:**
- All user data sanitized before innerHTML
- XSS attempts are blocked
- Legitimate data displays correctly
- No functionality broken

**Related Requirements:** REQ-3

---

### Task 2.2: Secure API Keys
**ID:** TASK-2.2  
**Priority:** MEDIUM  
**Effort:** 1 hour  
**Phase:** 2  
**Dependencies:** TASK-1.2 (Can be done in parallel with TASK-2.1)

**Files to Modify:**
- `src/auth.js` - MODIFY (Use Firebase config restrictions - no code change if using restrictions)
- `src/appliance_form.html` - MODIFY (Remove hardcoded API key if using env vars)
- `src/processor.html` - MODIFY (Remove hardcoded API key if using env vars)
- `src/auth-db.js` - MODIFY (Remove hardcoded API key if using env vars)

**Actions:**
1. **OPTION A - Firebase Config Restrictions (Recommended):**
   - **CONFIGURE** Firebase Console:
     - Go to Firebase Console > Authentication > Settings
     - Add domain restrictions to API key
     - Restrict to: `customer-web-from-flash.vercel.app`, `customer.web.from.flash`
   - No code changes needed

2. **OPTION B - Environment Variables:**
   - **CONFIGURE** Vercel environment variables:
     - Add `FIREBASE_API_KEY` to Vercel project settings
   - **MODIFY** `src/auth.js`:
     - Read API key from environment variable
   - **MODIFY** `src/appliance_form.html`:
     - Remove hardcoded API key
     - Use environment variable
   - **MODIFY** `src/processor.html`:
     - Remove hardcoded API key
     - Use environment variable
   - **MODIFY** `src/auth-db.js`:
     - Remove hardcoded API key
     - Use environment variable

3. **TEST** Firebase functionality:
   - Test authentication works
   - Test database access works
   - Verify API key restrictions work (if Option A)

**Acceptance Criteria:**
- API keys no longer hardcoded in HTML (if Option B)
- Firebase functionality works correctly
- API key restrictions configured (if Option A)

**Related Requirements:** REQ-6

---

## Phase 3: Verification (1-2 hours)

### Task 3.1: Verify Safe Browsing
**ID:** TASK-3.1  
**Priority:** CRITICAL  
**Effort:** 1-2 hours  
**Phase:** 3  
**Dependencies:** TASK-1.1, TASK-1.2, TASK-2.1, TASK-2.2 (All fixes complete)

**Files to Modify:** None (verification tasks)

**Actions:**
1. **TEST** all security fixes:
   - Test CSP changes work correctly
   - Test database rules block unauthorized access
   - Test XSS sanitization works
   - Test API key restrictions work

2. **DEPLOY** fixes to production:
   - Commit all changes
   - Deploy to Vercel
   - Verify deployment successful

3. **VERIFY** site works in production:
   - Test all pages load correctly
   - Test authentication works
   - Test form submissions work
   - Test admin panel works

4. **CHECK** Google Safe Browsing status:
   - Visit: https://transparencyreport.google.com/safe-browsing/search
   - Enter domain: `customer-web-from-flash.vercel.app`
   - Check current status

5. **REQUEST** Google Safe Browsing review (if still flagged):
   - Click "Request a review"
   - Explain fixes implemented
   - Submit review request

6. **MONITOR** Safe Browsing status:
   - Check status daily for 24-48 hours
   - Verify warning removed

**Acceptance Criteria:**
- All fixes tested and working
- Site deployed to production
- Google Safe Browsing review requested
- Warning removed (goal achieved)

**Related Requirements:** REQ-9

---

## Task Summary

| Task ID | Description | Phase | Effort | Priority | Files |
|---------|-------------|-------|--------|----------|-------|
| TASK-1.1 | Fix CSP | 1 | 1-2h | CRITICAL | vercel.json |
| TASK-1.2 | Secure Database Rules | 1 | 1h | CRITICAL | database.rules.json |
| TASK-2.1 | Fix XSS | 2 | 2-3h | HIGH | admin.js, processor.js, form-renderer.js, sanitize.js (new) |
| TASK-2.2 | Secure API Keys | 2 | 1h | MEDIUM | auth.js, appliance_form.html, processor.html, auth-db.js |
| TASK-3.1 | Verify Safe Browsing | 3 | 1-2h | CRITICAL | None (verification) |

**Total Tasks:** 5  
**Total Effort:** 5-8 hours

---

## File Modification Summary

**Files to Modify:** 9
- `vercel.json` - CSP configuration
- `database.rules.json` - Security rules
- `src/admin.js` - XSS sanitization
- `src/processor.js` - XSS sanitization
- `src/services/form-renderer.js` - XSS sanitization
- `src/auth.js` - API key (if using env vars)
- `src/appliance_form.html` - API key (if using env vars)
- `src/processor.html` - API key (if using env vars)
- `src/auth-db.js` - API key (if using env vars)

**Files to Create:** 1
- `src/utils/sanitize.js` - Sanitization utility

**Total Files:** 10

---

## Task Dependencies

```
TASK-1.1 (Fix CSP)
  └─ No dependencies

TASK-1.2 (Secure Database Rules)
  └─ No dependencies

TASK-2.1 (Fix XSS)
  └─ Depends on: TASK-1.2

TASK-2.2 (Secure API Keys)
  └─ Depends on: TASK-1.2
  └─ Can be parallel with: TASK-2.1

TASK-3.1 (Verify Safe Browsing)
  └─ Depends on: TASK-1.1, TASK-1.2, TASK-2.1, TASK-2.2
```

---

**Task Breakdown Status:** ✅ COMPLETE
