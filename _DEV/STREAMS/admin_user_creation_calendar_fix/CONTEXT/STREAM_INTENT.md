# Admin User Creation & Calendar Fix Stream Intent

## Primary Goal
Fix critical issues:
1. User creation only works for Dan Young's account, not Kenan's - all admins should be able to add users
2. Calendar picker on the form page is not working
3. Users aren't loading on the admin page - just says "loading" but doesn't load
4. **NEW:** Syntax errors:
   - "Identifier 'database' has already been declared" in field-config.js
   - "Unexpected token 'catch'" in admin.js:438
   - Missing autocomplete attribute on username input

## Scope

### Issue 1: Admin User Creation Access
- **Problem:** Only Dan Young's admin account can create users, Kenan's admin account cannot
- **Expected:** All admin accounts should be able to create users
- **Investigation Needed:**
  - Check Cloud Function authentication/authorization
  - Verify admin role checking logic
  - Check if there's hardcoded user ID checks
  - Review database rules for admin access

### Issue 2: Calendar Picker Not Working
- **Problem:** Calendar picker on the form page is not functioning
- **Expected:** Calendar should allow date selection for Direct Debit date
- **Investigation Needed:**
  - Check calendar library integration (Flatpickr)
  - Verify JavaScript initialization
  - Check for console errors
  - Review form field configuration

### Issue 3: Users Not Loading on Admin Page
- **Problem:** Users list shows "loading" but never loads
- **Expected:** Users list should load and display all users
- **Investigation Needed:**
  - Check `loadUsers()` function in admin.js
  - Verify database read permissions
  - Check for JavaScript errors
  - Review authentication state
  - Check Firebase database connection

### Issue 4: Syntax Errors (NEW)
- **Problem 4a:** "Identifier 'database' has already been declared" in field-config.js
- **Problem 4b:** "Unexpected token 'catch'" in admin.js:438
- **Problem 4c:** Missing autocomplete attribute on username input
- **Expected:** No syntax errors, proper autocomplete attributes
- **Investigation Needed:**
  - Fix duplicate database declaration in field-config.js
  - Fix missing closing brace in admin.js try-catch block
  - Add autocomplete="username" to username input

## Success Criteria
- [ ] All admin accounts can create users (not just Dan Young's)
- [ ] Calendar picker works on the form page
- [ ] Date selection saves correctly
- [ ] No console errors related to calendar
- [ ] Users list loads and displays correctly on admin page
- [ ] No infinite loading state
- [ ] No JavaScript syntax errors
- [ ] All form inputs have proper autocomplete attributes

## Priority
CRITICAL - Both issues block core functionality

## Context
- **Current Issue 1:** User creation restricted to specific admin account
- **Current Issue 2:** Calendar picker not working on form
- **Requirement:** Fix both issues and ensure all admins can manage users
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement

## MCP Workflow Requirements
- **Stream Path:** `_DEV/STREAMS/admin_user_creation_calendar_fix`
- **Workflow Type:** Discovery Assessment → Planning → Execution
- **Enforcement Level:** Full MCP workflow intelligence with step contracts
- **Evidence Requirements:** Structured evidence objects with validation
- **Quality Gates:** Blocking reflection at critical checkpoints
