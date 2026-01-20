# Vercel Domain Setup Stream Intent

## Primary Goal
Create a new clean Vercel domain without Google Safe Browsing issues and ensure proper routing is configured for /form, /admin, and /processor routes with role-based access control for each user level.

## Scope
### New Domain Creation
- Create new Vercel domain without "insurance" and without Safe Browsing issues
- Ensure domain is clean and professional
- Link project to new domain
- Deploy all fixes to new domain

### Route Configuration
- Ensure /form route works for all authenticated users (agents, processors, admins)
- Ensure /admin route works only for admin users
- Ensure /processor route works for processor and admin users
- Verify role-based access control is working
- Test all routes and redirects

### User Level Access
- **Agents:** Can access /form only
- **Processors:** Can access /form and /processor
- **Admins:** Can access /form, /processor, and /admin
- **Unauthenticated:** Redirected to / (login page)

## Success Criteria
- New clean Vercel domain created and deployed
- All routes (/form, /admin, /processor) working correctly
- Role-based access control enforced
- No Google Safe Browsing issues
- All fixes deployed to new domain
- Firebase authorized domains updated

## Priority
CRITICAL - Need clean domain without Safe Browsing issues and proper routing for all user levels

## Context
- **Current Issue:** Old domain has Google Safe Browsing "dangerous site" warning
- **Requirement:** New clean domain without "insurance" word
- **Routing:** Need /form, /admin, /processor routes working
- **Access Control:** Role-based access for each route
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement

## MCP Workflow Requirements
- **Stream Path:** `_DEV/STREAMS/vercel_domain_setup`
- **Workflow Type:** Discovery Assessment → Planning → Execution
- **Enforcement Level:** Full MCP workflow intelligence with step contracts
- **Evidence Requirements:** Structured evidence objects with validation
- **Quality Gates:** Blocking reflection at critical checkpoints
