# Username Login Fix Stream Intent

## Primary Goal
Change the login form frontend to use username instead of email as the login credential, since the backend already supports username login but the frontend currently requires email.

## Scope
### Frontend Login Form Update
- Change login form field from email to username
- Update field labels and placeholders
- Update validation messages
- Update error handling to reference username instead of email
- Ensure forgot password functionality is updated (if applicable)

### Backend Compatibility
- Verify backend (auth-db.js) already supports username login (confirmed - it does)
- Ensure no breaking changes to authentication flow
- Test that username login works end-to-end

## Success Criteria
- Login form displays "Username" field instead of "Email"
- Users can log in using username and password
- Validation messages reference username appropriately
- No email requirement in the login form
- Backend authentication works correctly with username

## Priority
CRITICAL - Users cannot log in because the form requires email even though users may not have email addresses

## Context
- **Current Issue:** Login form requires email field, but users may not have email addresses
- **Backend Status:** Backend (auth-db.js) already supports username login (lines 114-157)
- **Requirement:** Frontend should use username instead of email for login
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement

## MCP Workflow Requirements
- **Stream Path:** `_DEV/STREAMS/username_login_fix`
- **Workflow Type:** Discovery Assessment → Planning → Execution
- **Enforcement Level:** Full MCP workflow intelligence with step contracts
- **Evidence Requirements:** Structured evidence objects with validation
- **Quality Gates:** Blocking reflection at critical checkpoints
