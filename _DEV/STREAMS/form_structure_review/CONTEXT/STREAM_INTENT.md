# Form Structure Review Stream Intent

## Primary Goal
Comprehensively review and fix the appliance insurance form structure to eliminate duplicate contact details, ensure contact and DD details appear only once, implement proper one-to-many relationship for multiple appliances per record, and verify all updates are in the actual files Vercel is using with validation at end of execution.

## Scope
### Form Structure Issues
- Contact details appearing twice on the page
- Need contact and DD details to appear only once
- Current appliance handling needs review for one-to-many relationship
- Form structure needs proper organization

### Database Relationship Requirements
- One-to-many relationship: One customer record with multiple appliances
- Ability to add multiple appliances to a single record
- Proper data structure for appliance relationships
- Database schema alignment with form structure

### Deployment Verification
- Ensure updates are in files Vercel actually uses
- Validate source files match deployed files
- Verify deployment configuration is correct
- Add validation at end of execution to confirm deployment

## Success Criteria
- Contact details appear only once on form
- DD details appear only once on form
- Multiple appliances can be added to one record (1-to-many)
- Form structure properly organized
- All updates verified in Vercel deployment files
- Validation confirms deployment matches source

## Priority
CRITICAL - Form has duplicate sections affecting user experience and data structure needs proper one-to-many relationships

## Context
- **Project:** Appliance Insurance Form Portal
- **Deployment:** Vercel hosting
- **Issue:** Contact details appearing twice, need proper appliance relationships
- **Database:** Firebase Realtime Database
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement

## MCP Workflow Requirements
- **Stream Path:** `_DEV/STREAMS/form_structure_review`
- **Workflow Type:** Extended Discovery → Planning → Execution
- **Enforcement Level:** Full MCP workflow intelligence with step contracts
- **Evidence Requirements:** Structured evidence objects with validation
- **Quality Gates:** Blocking reflection at critical checkpoints
- **Deployment Validation:** Verify files match Vercel deployment at end
