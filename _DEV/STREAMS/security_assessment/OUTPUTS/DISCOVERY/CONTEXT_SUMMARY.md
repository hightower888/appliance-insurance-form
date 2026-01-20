## Context Summary

**Goal:** Investigate and fix security issues causing Google to mark the site as dangerous. Identify vulnerabilities, security misconfigurations, and potential threats that could trigger Google's Safe Browsing warnings.

**Project Type:** Security Audit & Fix

**Relevant Directories:** 
- `src/` - Application source code
- `vercel.json` - Security headers and CSP configuration
- `database.rules.json` - Firebase security rules
- `scripts/` - Security-related scripts

### Extracted Requirements

1. **REQ-1: Analyze Security Headers** - Review CSP, HSTS, and other security headers in vercel.json
2. **REQ-2: Review Database Security Rules** - Check Firebase Realtime Database rules for overly permissive access
3. **REQ-3: Identify XSS Vulnerabilities** - Find instances of unsafe innerHTML usage with user data
4. **REQ-4: Check for Malicious Code Patterns** - Scan for eval(), unsafe-inline, unsafe-eval in CSP
5. **REQ-5: Review Authentication Security** - Verify auth implementation doesn't expose vulnerabilities
6. **REQ-6: Check External Dependencies** - Verify all external scripts are from trusted sources
7. **REQ-7: Identify Root Cause** - Determine why Google is flagging the site
8. **REQ-8: Implement Security Fixes** - Fix all identified vulnerabilities
9. **REQ-9: Verify Safe Browsing** - Ensure site passes Google Safe Browsing checks

### Foundation Components Initialization

**LearningSystem:**
- Status: ✅ Initialized
- Purpose: Pattern recognition for security vulnerabilities and routing decisions
- Ready for: assess-4b pattern query
- Pattern store: Empty (will populate during execution)
- Query parameters: project_type, complexity_score, security_issues
- Storage location: project_state.json["learning_patterns"]

**DriftPrevention:**
- Status: ✅ Initialized
- Purpose: Detect and prevent work from deviating from security assessment goals
- Baseline captured: Security assessment intent - identify and fix Google flagging issues
- Goal alignment threshold: 0.8 (80% required for PASS)
- Ready for: assess-4 drift check before routing
- Alignment calculation: (goal_to_complexity + routing_to_requirements) / 2

**ContextStorageService:**
- Status: ✅ Initialized
- Purpose: Preserve security assessment context with structured metadata
- Storage format: JSON with metadata (type, relevance, step_id, timestamp)
- Ready for: assess-2 file structure storage, assess-3 characteristics storage
- Retrieval enabled: Yes (via context IDs in project_state.json)
- Context ID format: ctx_assess[step]_[ISO8601_timestamp]

### Initial Security Findings (Preliminary)

**Critical Issues Identified:**
1. **CSP with unsafe-inline and unsafe-eval** - Found in vercel.json line 41
2. **Extensive innerHTML usage** - 46 instances found, potential XSS if user data not sanitized
3. **Overly permissive database rules** - Multiple `.write: true` and `.read: true` rules
4. **Firebase API key exposed** - Hardcoded in HTML files

**Priority:** CRITICAL - Site flagged as dangerous by Google
