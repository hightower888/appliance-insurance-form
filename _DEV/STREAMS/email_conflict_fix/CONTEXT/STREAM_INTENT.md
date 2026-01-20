# Email Conflict Fix Stream Intent

## Primary Goal
Fix the issue where creating a user with username but no email results in "email already registered" error and permission denied in Firebase Auth.

## Scope
### Email Conflict Issue
- Investigate why system-generated emails (`username@appliance-bot.local`) conflict with existing Firebase Auth users
- Understand Firebase Auth email validation and uniqueness requirements
- Fix the user creation logic to handle email conflicts properly
- Ensure users can be created with username only (no email)

### Permission Denied Issue
- Investigate why permission denied error occurs
- Check Firebase Auth rules and database rules
- Ensure proper error handling and user feedback

### System-Generated Email Strategy
- Review current system email generation (`username@appliance-bot.local`)
- Consider alternative approaches (unique IDs, different domain, etc.)
- Ensure system emails don't conflict with real emails

## Success Criteria
- Users can be created with username only (no email provided)
- No "email already registered" errors when email is not provided
- No permission denied errors during user creation
- System-generated emails are unique and don't conflict
- Clear error messages if conflicts do occur

## Priority
CRITICAL - User creation is broken when email is not provided

## Context
- **Current Issue:** Creating user with username but no email results in "email already registered" error
- **Error:** Permission denied in Firebase Auth
- **System Email Format:** `username@appliance-bot.local`
- **Requirement:** Users should be creatable with username only
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement

## MCP Workflow Requirements
- **Stream Path:** `_DEV/STREAMS/email_conflict_fix`
- **Workflow Type:** Discovery Assessment → Planning → Execution
- **Enforcement Level:** Full MCP workflow intelligence with step contracts
- **Evidence Requirements:** Structured evidence objects with validation
- **Quality Gates:** Blocking reflection at critical checkpoints
