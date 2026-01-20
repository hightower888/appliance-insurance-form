## Detailed Implementation Plan

### Implementation Order
1. `src/login.html` - Single file modification, all changes in one pass

### File: `src/login.html`

**Purpose:** Update login form to use username instead of email for authentication

**Structure:**
- HTML form structure (lines 23-65)
- JavaScript form handling (lines 70-206)
- Script references (line 69)

**Changes Required:**
1. Change email input field to username input (lines 30-41)
2. Update label text (line 31)
3. Update JavaScript variable references (lines 127, 139, 145, 150, 186, 189, 191)
4. Update validation messages (lines 145, 150)
5. Update error handling (lines 172, 189)
6. Switch script reference from auth.js to auth-db.js (line 69)
7. Update forgot password handler (lines 184-204)

**Dependencies:**
- Imports: auth-db.js (supports username login)
- Used by: Login page only

**Tests:**
- Manual testing: Verify username login works for all roles
- Test cases:
  - Username login for admin role
  - Username login for processor role
  - Username login for agent role
  - Error handling with invalid username
  - Password validation
  - Redirect after successful login
