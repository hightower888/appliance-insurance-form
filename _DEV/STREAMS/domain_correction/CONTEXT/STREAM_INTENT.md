# Domain Correction Stream Intent

## Primary Goal
Identify the correct Vercel domain that does NOT contain the word "insurance" and deploy all form structure fixes to that domain. Ensure the project is using the most recent domain setup that complies with the "no insurance" requirement.

## Scope
### Domain Requirements
- Domain must NOT contain the word "insurance"
- Must be the most recent domain setup
- Must be a valid Vercel subdomain
- Must be properly linked to the project

### Deployment Correction
- Identify correct domain/project name
- Link project to correct Vercel project
- Deploy all fixes to correct domain
- Verify deployment on correct domain
- Update all references to use correct domain

## Success Criteria
- Correct domain identified (no "insurance" in name)
- Project linked to correct Vercel project
- All fixes deployed to correct domain
- Deployment verified on correct domain
- All documentation updated with correct domain

## Priority
CRITICAL - Deployed to wrong domain, need to use correct domain without "insurance"

## Context
- **Current Issue:** Deployed to `applianceinsuranceform.vercel.app` which contains "insurance"
- **Requirement:** Cannot use "insurance" anywhere in domain
- **Need:** Find most recent domain setup without "insurance"
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement

## MCP Workflow Requirements
- **Stream Path:** `_DEV/STREAMS/domain_correction`
- **Workflow Type:** Discovery Assessment → Planning → Execution
- **Enforcement Level:** Full MCP workflow intelligence with step contracts
- **Evidence Requirements:** Structured evidence objects with validation
- **Quality Gates:** Blocking reflection at critical checkpoints
