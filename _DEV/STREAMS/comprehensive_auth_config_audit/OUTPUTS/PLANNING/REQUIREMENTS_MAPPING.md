# Requirements Mapping

**Generated:** 2026-01-08T12:00:00.000Z
**Stream:** comprehensive_auth_config_audit
**Workflow:** PLANNING
**Step:** plan-2

---

## Issues to Requirements Mapping

### Authentication Issues (6)

#### Issue 1: Dual Auth Systems
**Files:** `src/auth-db.js`, `src/auth.js`
**Action:** Document or standardize
**Priority:** High
**Dependencies:** None

#### Issue 2: Login Label
**Files:** `src/login.html`
**Action:** Modify (change "Username" to "Username or Email")
**Priority:** High
**Dependencies:** None

#### Issue 3: Inconsistent Login Methods
**Files:** `src/auth-db.js`, `src/auth.js`
**Action:** Document differences
**Priority:** High
**Dependencies:** None

#### Issue 4: User Lookup Performance
**Files:** `src/auth-db.js`
**Action:** Optimize or document
**Priority:** Medium
**Dependencies:** None

#### Issue 5: Session Management Differences
**Files:** `src/auth-db.js`, `src/auth.js`
**Action:** Document differences
**Priority:** Medium
**Dependencies:** None

#### Issue 6: No Public Signup
**Files:** N/A (may be intentional)
**Action:** Document or create signup form
**Priority:** Low
**Dependencies:** None

---

### Database Issues (5)

#### Issue 1: Security Logs Write Rule
**Files:** `database.rules.json`
**Action:** Modify (allow unauthenticated writes or use server-side logging)
**Priority:** Critical
**Dependencies:** None

#### Issue 2: Security Logger Password Field
**Files:** `src/services/security-logger.js`
**Action:** Deploy fix (already fixed in code)
**Priority:** Critical
**Dependencies:** None

#### Issue 3: Form Fields Access
**Files:** `database.rules.json`
**Action:** Verify or modify
**Priority:** High
**Dependencies:** None

#### Issue 4: Users Read Rule
**Files:** `database.rules.json`
**Action:** Document (required for auth-db.js)
**Priority:** Low
**Dependencies:** None

#### Issue 5: Security Logs Validation
**Files:** `database.rules.json`
**Action:** Enhance validation (optional)
**Priority:** Low
**Dependencies:** None

---

### API Issues (0)
- No issues found

---

### Configuration Issues (3)

#### Issue 1: Firebase Rewrite Conflict
**Files:** `firebase.json`
**Action:** Document (Vercel takes precedence)
**Priority:** Low
**Dependencies:** None

#### Issue 2: Config Duplication
**Files:** `src/auth-db.js`, `src/auth.js`
**Action:** Consider centralization (optional)
**Priority:** Medium
**Dependencies:** None

#### Issue 3: No Environment Configs
**Files:** N/A
**Action:** Document (intentional)
**Priority:** Low
**Dependencies:** None

---

## Implementation Groups

### Group 1: Critical Security Fixes
- Fix security_logs write rule
- Deploy security logger password field fix

### Group 2: Authentication UI
- Update login label

### Group 3: Authentication Documentation
- Document dual auth systems
- Document login method differences
- Document session management differences

### Group 4: Database Rules
- Verify/modify form_fields access
- Document users read rule
- Enhance security_logs validation (optional)

### Group 5: Performance/Optimization
- Optimize user lookup (optional)
- Centralize Firebase config (optional)

### Group 6: Testing
- Test everything in hosted environment

---

## Dependencies

**No blocking dependencies** - All fixes can proceed in logical order.

**Recommended order:**
1. Critical fixes first
2. UI fixes
3. Database rules
4. Documentation
5. Performance/optimization
6. Testing

---

## Files to Modify

**Must Modify:**
- `src/login.html` - Update label
- `database.rules.json` - Fix security_logs write rule
- `src/services/security-logger.js` - Deploy fix (already fixed)

**May Modify:**
- `database.rules.json` - Verify form_fields access
- `src/auth-db.js` - Performance optimization (optional)

**Documentation:**
- Document dual auth systems
- Document session management
- Document users read rule requirement

---

## Next Steps

- Create detailed implementation plan (plan-3)
