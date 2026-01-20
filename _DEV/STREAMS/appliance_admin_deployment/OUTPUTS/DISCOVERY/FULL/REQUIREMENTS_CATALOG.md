# Requirements Catalog

**Generated:** 2026-01-09T05:55:00Z  
**Stream:** appliance_admin_deployment  
**Workflow:** DISCOVERY_FULL - Step 3

---

## Requirements Summary

| Category | Explicit | Implicit | Total | Priority Distribution |
|----------|----------|----------|-------|----------------------|
| Functional | 30 | 5 | 35 | HIGH: 35 |
| Non-Functional | 15 | 5 | 20 | HIGH: 15, MEDIUM: 5 |
| **Total** | **45** | **10** | **55** | **HIGH: 50, MEDIUM: 5** |

---

## Functional Requirements

### 1. Authentication System (10 requirements)

#### Explicit Requirements

**REQ-AUTH-001** - Firebase Authentication Integration
- **Description:** Integrate Firebase Authentication service
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Firebase Auth SDK loaded, configured, and initialized
- **Dependencies:** None

**REQ-AUTH-002** - User Login Functionality
- **Description:** Users can log in with email and password
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Login form accepts email/password, authenticates via Firebase, redirects on success
- **Dependencies:** REQ-AUTH-001

**REQ-AUTH-003** - User Logout Functionality
- **Description:** Users can log out of the system
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Logout button clears session, redirects to login
- **Dependencies:** REQ-AUTH-001

**REQ-AUTH-004** - Role-Based Access Control (RBAC)
- **Description:** System supports Admin and Agent roles with different permissions
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Users have roles (Admin/Agent), roles checked before access, permissions enforced
- **Dependencies:** REQ-AUTH-001

**REQ-AUTH-005** - Session Management
- **Description:** User sessions persist across page loads
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Session persists in browser, auto-refreshes tokens, handles expiry
- **Dependencies:** REQ-AUTH-001

**REQ-AUTH-006** - Protected Routes/Pages
- **Description:** Certain pages require authentication and specific roles
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Admin panel requires admin role, form requires authentication, unauthorized access redirects
- **Dependencies:** REQ-AUTH-001, REQ-AUTH-004

#### Implicit Requirements

**REQ-AUTH-007** - Error Handling for Auth Failures
- **Description:** System handles authentication errors gracefully
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** Implied
- **Acceptance Criteria:** Invalid credentials show error message, network errors handled, user-friendly error messages
- **Dependencies:** REQ-AUTH-002

**REQ-AUTH-008** - Password Reset Functionality
- **Description:** Users can reset forgotten passwords
- **Priority:** HIGH
- **Category:** Authentication
- **Source:** Implied
- **Acceptance Criteria:** "Forgot password" link, email sent, password reset flow works
- **Dependencies:** REQ-AUTH-001

**REQ-AUTH-009** - Password Strength Policy
- **Description:** Enforce secure password requirements
- **Priority:** MEDIUM
- **Category:** Authentication
- **Source:** Implied (Security best practice)
- **Acceptance Criteria:** Minimum length, complexity requirements, validation on client and server
- **Dependencies:** REQ-AUTH-002

**REQ-AUTH-010** - Session Timeout Configuration
- **Description:** Define and implement session timeout duration
- **Priority:** MEDIUM
- **Category:** Authentication
- **Source:** Implied
- **Acceptance Criteria:** Session expires after inactivity, user notified, graceful logout
- **Dependencies:** REQ-AUTH-005

---

### 2. Admin Panel (8 requirements)

#### Explicit Requirements

**REQ-ADMIN-001** - Admin-Only Access
- **Description:** Admin panel accessible only to users with Admin role
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Non-admin users cannot access admin panel, redirects to appropriate page
- **Dependencies:** REQ-AUTH-004

**REQ-ADMIN-002** - Create New Users/Agents
- **Description:** Admin can create new user accounts with email/password
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Admin form creates users, assigns initial role, sends invitation (optional)
- **Dependencies:** REQ-AUTH-001, REQ-ADMIN-001

**REQ-ADMIN-003** - View All Users/Agents
- **Description:** Admin can view list of all users in the system
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** User list displays all users, shows roles, searchable/filterable
- **Dependencies:** REQ-ADMIN-001

**REQ-ADMIN-004** - Edit User Details
- **Description:** Admin can edit user information (email, name, role)
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Edit form updates user data, validates input, saves to Firebase
- **Dependencies:** REQ-ADMIN-001

**REQ-ADMIN-005** - Delete/Deactivate Users
- **Description:** Admin can delete or deactivate user accounts
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Delete/deactivate action works, prevents deletion of last admin, confirmation dialog
- **Dependencies:** REQ-ADMIN-001

**REQ-ADMIN-006** - Assign Roles
- **Description:** Admin can assign Admin or Agent role to users
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Role assignment updates user metadata, changes take effect immediately
- **Dependencies:** REQ-ADMIN-001, REQ-AUTH-004

**REQ-ADMIN-007** - User Management Interface
- **Description:** Clean, intuitive UI for managing users
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Responsive design, clear navigation, loading states, error handling
- **Dependencies:** REQ-ADMIN-001

#### Implicit Requirements

**REQ-ADMIN-008** - Initial Admin Creation
- **Description:** System must support creation of first admin user
- **Priority:** HIGH
- **Category:** Admin Panel
- **Source:** Implied (Gap identified)
- **Acceptance Criteria:** Bootstrap process or manual admin creation method exists
- **Dependencies:** REQ-AUTH-001

---

### 3. Agent Association (4 requirements)

#### Explicit Requirements

**REQ-AGENT-001** - Automatic Agent Association
- **Description:** When agent is logged in, their ID/email automatically associated with form submissions
- **Priority:** HIGH
- **Category:** Agent Association
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Form submissions include agentId/agentEmail field, populated from auth session
- **Dependencies:** REQ-AUTH-001, REQ-FORM-002

**REQ-AGENT-002** - Agent ID in Submissions
- **Description:** Form submissions include agentId or agentEmail field
- **Priority:** HIGH
- **Category:** Agent Association
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** All submissions have agent identifier, stored in Firebase
- **Dependencies:** REQ-AGENT-001

**REQ-AGENT-003** - Agent View Own Submissions (Future)
- **Description:** Agents can view their own submissions (optional future feature)
- **Priority:** LOW (Future)
- **Category:** Agent Association
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Not required for initial implementation
- **Dependencies:** REQ-AGENT-001

**REQ-AGENT-004** - Admin View All with Agent Info
- **Description:** Admin can view all submissions with associated agent information
- **Priority:** HIGH
- **Category:** Agent Association
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Admin sales view shows agent name/email for each submission
- **Dependencies:** REQ-ADMIN-001, REQ-AGENT-001

---

### 4. Sales Database (6 requirements)

#### Explicit Requirements

**REQ-DB-001** - Store All Submissions
- **Description:** All form submissions stored in Firebase Realtime Database
- **Priority:** HIGH
- **Category:** Sales Database
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Submissions saved to Firebase, existing structure maintained
- **Dependencies:** None (existing)

**REQ-DB-002** - Admin-Only Read Access
- **Description:** Only admin users can read/view submissions
- **Priority:** HIGH
- **Category:** Sales Database
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Security rules enforce admin-only read, non-admin cannot query submissions
- **Dependencies:** REQ-AUTH-004, REQ-SEC-001

**REQ-DB-003** - User Write-Only Access
- **Description:** Authenticated users can write (submit forms) but not read
- **Priority:** HIGH
- **Category:** Sales Database
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Security rules allow authenticated writes, prevent reads for non-admin
- **Dependencies:** REQ-AUTH-001, REQ-SEC-001

**REQ-DB-004** - Structured Data with Agent Association
- **Description:** Submissions include agent association in data structure
- **Priority:** HIGH
- **Category:** Sales Database
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Data structure includes agentId/agentEmail, backward compatible with existing data
- **Dependencies:** REQ-AGENT-001

**REQ-DB-005** - Query and Filter Capabilities
- **Description:** Admin can query and filter submissions
- **Priority:** HIGH
- **Category:** Sales Database
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Admin can filter by agent, date, status, search functionality
- **Dependencies:** REQ-ADMIN-001, REQ-DB-002

#### Implicit Requirements

**REQ-DB-006** - Data Export Functionality
- **Description:** Admin can export submission data (CSV, JSON)
- **Priority:** MEDIUM
- **Category:** Sales Database
- **Source:** Implied (Gap identified)
- **Acceptance Criteria:** Export button generates downloadable file with submission data
- **Dependencies:** REQ-DB-005

---

### 5. Form Enhancement (5 requirements)

#### Explicit Requirements

**REQ-FORM-001** - Remove Manual Agent Field
- **Description:** Remove "Agents" input field from form
- **Priority:** HIGH
- **Category:** Form Enhancement
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Agent field removed from HTML, form still functions
- **Dependencies:** REQ-AGENT-001

**REQ-FORM-002** - Auto-Populate Agent from Session
- **Description:** Agent information automatically populated from logged-in user
- **Priority:** HIGH
- **Category:** Form Enhancement
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Agent info populated on form load, no manual input required
- **Dependencies:** REQ-AUTH-001, REQ-AGENT-001

**REQ-FORM-003** - Show Logged-In User Info
- **Description:** Form displays current logged-in user information
- **Priority:** HIGH
- **Category:** Form Enhancement
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** User email/name displayed on form, visible to user
- **Dependencies:** REQ-AUTH-001

**REQ-FORM-004** - Logout Functionality on Form
- **Description:** Form page includes logout button
- **Priority:** HIGH
- **Category:** Form Enhancement
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Logout button visible, works correctly, redirects after logout
- **Dependencies:** REQ-AUTH-003

#### Implicit Requirements

**REQ-FORM-005** - Maintain Existing Form Functionality
- **Description:** All existing form features must continue to work
- **Priority:** HIGH
- **Category:** Form Enhancement
- **Source:** Implied (Constraint)
- **Acceptance Criteria:** Appliance entry, boiler options, cost calculation, validation all work as before
- **Dependencies:** None (backward compatibility)

---

### 6. Deployment (6 requirements)

#### Explicit Requirements

**REQ-DEPLOY-001** - Deploy to Hosting Platform
- **Description:** Application deployed to Firebase Hosting, Vercel, or Railway
- **Priority:** HIGH
- **Category:** Deployment
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Application accessible via URL, all pages load correctly
- **Dependencies:** All functional requirements

**REQ-DEPLOY-002** - Production-Ready Configuration
- **Description:** Configuration optimized for production environment
- **Priority:** HIGH
- **Category:** Deployment
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Firebase config uses production settings, error handling enabled
- **Dependencies:** REQ-DEPLOY-001

**REQ-DEPLOY-003** - Environment Variables Setup
- **Description:** Environment variables configured for different environments
- **Priority:** HIGH
- **Category:** Deployment
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Environment variables loaded, different values for dev/prod
- **Dependencies:** REQ-DEPLOY-001

**REQ-DEPLOY-004** - Domain Configuration
- **Description:** Custom domain configured (if needed)
- **Priority:** MEDIUM
- **Category:** Deployment
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Custom domain points to hosting, SSL certificate configured
- **Dependencies:** REQ-DEPLOY-001

**REQ-DEPLOY-005** - SSL/HTTPS Enabled
- **Description:** Application served over HTTPS
- **Priority:** HIGH
- **Category:** Deployment
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** All pages load over HTTPS, no mixed content warnings
- **Dependencies:** REQ-DEPLOY-001

#### Implicit Requirements

**REQ-DEPLOY-006** - Monitoring and Logging
- **Description:** Production monitoring and error logging configured
- **Priority:** MEDIUM
- **Category:** Deployment
- **Source:** Implied
- **Acceptance Criteria:** Error tracking enabled, performance monitoring, logs accessible
- **Dependencies:** REQ-DEPLOY-001

---

## Non-Functional Requirements

### 7. Security (6 requirements)

#### Explicit Requirements

**REQ-SEC-001** - Firebase Security Rules
- **Description:** Security rules enforce database access control
- **Priority:** HIGH
- **Category:** Security
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Rules enforce admin-only read, user write-only, validated on Firebase
- **Dependencies:** REQ-AUTH-004

**REQ-SEC-002** - Admin-Only Routes Protected
- **Description:** Admin routes protected from unauthorized access
- **Priority:** HIGH
- **Category:** Security
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Client-side and server-side (security rules) protection
- **Dependencies:** REQ-AUTH-004, REQ-ADMIN-001

**REQ-SEC-003** - Authentication Required for Submission
- **Description:** Form submission requires user authentication
- **Priority:** HIGH
- **Category:** Security
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Unauthenticated users cannot submit, redirect to login
- **Dependencies:** REQ-AUTH-001

**REQ-SEC-004** - Secure Session Management
- **Description:** Sessions managed securely
- **Priority:** HIGH
- **Category:** Security
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Tokens stored securely, auto-refresh, expiry handled
- **Dependencies:** REQ-AUTH-005

**REQ-SEC-005** - Input Validation and Sanitization
- **Description:** All user inputs validated and sanitized
- **Priority:** HIGH
- **Category:** Security
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Client-side and server-side validation, XSS prevention, SQL injection prevention (N/A for Firebase)
- **Dependencies:** All form requirements

#### Implicit Requirements

**REQ-SEC-006** - Rate Limiting
- **Description:** Implement rate limiting for form submissions
- **Priority:** HIGH
- **Category:** Security
- **Source:** Implied (Security best practice)
- **Acceptance Criteria:** Limit submissions per user per time period, prevent abuse
- **Dependencies:** REQ-SEC-003

**REQ-SEC-007** - Audit Logging
- **Description:** Log admin actions for audit trail
- **Priority:** MEDIUM
- **Category:** Security
- **Source:** Implied (Security best practice)
- **Acceptance Criteria:** Admin actions logged (user creation, role changes, deletions)
- **Dependencies:** REQ-ADMIN-001

---

### 8. User Experience (6 requirements)

#### Explicit Requirements

**REQ-UX-001** - Clean Admin Panel UI
- **Description:** Admin panel has clean, professional interface
- **Priority:** HIGH
- **Category:** User Experience
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Modern design, consistent styling, intuitive layout
- **Dependencies:** REQ-ADMIN-007

**REQ-UX-002** - Responsive Design
- **Description:** Application works on mobile and desktop devices
- **Priority:** HIGH
- **Category:** User Experience
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Mobile-friendly layout, touch targets appropriate size, responsive breakpoints
- **Dependencies:** All UI requirements

**REQ-UX-003** - Loading States
- **Description:** Loading indicators shown during async operations
- **Priority:** HIGH
- **Category:** User Experience
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Spinners/loaders shown, user knows system is processing
- **Dependencies:** All async operations

**REQ-UX-004** - Error Handling
- **Description:** Errors displayed clearly to users
- **Priority:** HIGH
- **Category:** User Experience
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Error messages clear, actionable, user-friendly
- **Dependencies:** All operations

**REQ-UX-005** - Success/Error Notifications
- **Description:** Success and error notifications displayed to users
- **Priority:** HIGH
- **Category:** User Experience
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Toast notifications or alerts, auto-dismiss, accessible
- **Dependencies:** All operations

**REQ-UX-006** - Intuitive Navigation
- **Description:** Navigation is clear and easy to understand
- **Priority:** HIGH
- **Category:** User Experience
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Clear menu structure, breadcrumbs if needed, easy to find features
- **Dependencies:** REQ-ADMIN-007

---

### 9. Technical (6 requirements)

#### Explicit Requirements

**REQ-TECH-001** - Firebase Authentication
- **Description:** Use Firebase Authentication service
- **Priority:** HIGH
- **Category:** Technical
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Firebase Auth SDK integrated, configured correctly
- **Dependencies:** None

**REQ-TECH-002** - Firebase Realtime Database
- **Description:** Use existing Firebase Realtime Database
- **Priority:** HIGH
- **Category:** Technical
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Database connection maintained, existing data accessible
- **Dependencies:** None (existing)

**REQ-TECH-003** - Firebase Hosting
- **Description:** Deploy to Firebase Hosting (preferred) or alternative
- **Priority:** HIGH
- **Category:** Technical
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Hosting configured, application deployed
- **Dependencies:** REQ-DEPLOY-001

**REQ-TECH-004** - Role-Based Access Control
- **Description:** Implement RBAC system
- **Priority:** HIGH
- **Category:** Technical
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Roles defined, checked, enforced
- **Dependencies:** REQ-AUTH-004

**REQ-TECH-005** - Session Persistence
- **Description:** User sessions persist across page loads
- **Priority:** HIGH
- **Category:** Technical
- **Source:** STREAM_INTENT.md
- **Acceptance Criteria:** Session survives page refresh, browser close/reopen
- **Dependencies:** REQ-AUTH-005

#### Implicit Requirements

**REQ-TECH-006** - Browser Compatibility
- **Description:** Application works in Chrome, Firefox, Safari, Edge (last 2 versions)
- **Priority:** MEDIUM
- **Category:** Technical
- **Source:** Implied (Technical requirement)
- **Acceptance Criteria:** Tested in all browsers, no console errors, features work
- **Dependencies:** All frontend requirements

---

## Requirements Analysis

### Gaps Identified

1. **Initial Admin Creation** - No explicit requirement for creating first admin user
   - **Impact:** HIGH - System cannot be bootstrapped
   - **Recommendation:** Add requirement for bootstrap process

2. **Password Strength Policy** - No explicit requirement for password requirements
   - **Impact:** MEDIUM - Security concern
   - **Recommendation:** Define password policy requirements

3. **Session Timeout Duration** - No explicit requirement for session timeout
   - **Impact:** MEDIUM - Security and UX concern
   - **Recommendation:** Define timeout duration and behavior

4. **Concurrent Admin Operations** - No requirement for handling concurrent operations
   - **Impact:** LOW - Edge case
   - **Recommendation:** Document expected behavior

5. **Data Export Functionality** - No requirement for exporting submission data
   - **Impact:** MEDIUM - Admin may need this feature
   - **Recommendation:** Consider adding as future enhancement

### Conflicts Identified

**None** - All requirements are compatible and non-conflicting.

### Dependencies

**Critical Dependencies:**
1. Authentication System → Admin Panel (Admin panel requires auth)
2. Authentication System → Form Enhancement (Form requires auth)
3. Admin Panel → Agent Association (Admin needs to view agent info)
4. Security Rules → Sales Database (Database access requires rules)
5. All Functional Requirements → Deployment (Deploy after implementation)

**Implementation Order:**
1. Authentication System (Foundation)
2. Security Rules (Foundation)
3. Admin Panel (Depends on Auth)
4. Form Enhancement (Depends on Auth)
5. Agent Association (Depends on Auth + Form)
6. Sales Database (Depends on Security Rules)
7. Deployment (Depends on all)

---

## Requirements Summary by Priority

| Priority | Count | Percentage |
|----------|-------|------------|
| HIGH | 50 | 91% |
| MEDIUM | 5 | 9% |
| LOW (Future) | 1 | <1% |
| **Total** | **55** | **100%** |

---

## Requirements Summary by Category

| Category | Count |
|----------|-------|
| Authentication | 10 |
| Admin Panel | 8 |
| Agent Association | 4 |
| Sales Database | 6 |
| Form Enhancement | 5 |
| Deployment | 6 |
| Security | 7 |
| User Experience | 6 |
| Technical | 6 |
| **Total** | **55** |

---

**Status:** ✅ Requirements Catalog Complete  
**Next Step:** Step 4 - Analyze Project Structure
