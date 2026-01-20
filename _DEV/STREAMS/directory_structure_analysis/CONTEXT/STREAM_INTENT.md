# Directory Structure Analysis Stream Intent

## Primary Goal
Comprehensively analyze and reorganize the project directory structure to ensure proper organization, identify workflow issues with directory finding, verify Vercel deployment status, and ensure all production files are correctly deployed to the live site.

## Scope
### Directory Structure Issues
- Root directory cluttered with markdown files and documentation
- _DEV folder contains meta files instead of organized outputs
- SRC files need proper organization
- OUTPUTS scattered across different locations
- Stream outputs mixed with actual code files

### Workflow & Deployment Issues
- Identify any workflow issues finding directories
- Verify Vercel deployment configuration
- Ensure production files (src/) are properly deployed
- Check if recent updates (calendar picker) are live on Vercel
- Validate file paths and deployment structure

### Organization Requirements
- Root directory should only contain essential project files
- Documentation should be organized in appropriate folders
- _DEV/STREAMS should contain only workflow outputs, not production code
- SRC files should be properly organized and deployed
- OUTPUTS should be in _DEV folder structure

## Success Criteria
- Complete directory structure analysis and mapping
- Identification of all organizational issues
- Workflow directory finding issues documented
- Vercel deployment status verified
- Production files confirmed deployed correctly
- Reorganization plan created with file locations
- All issues reported with solutions

## Priority
CRITICAL - Directory disorganization affects workflow efficiency, deployment reliability, and code maintainability

## Context
- **Project:** Appliance Insurance Form Portal
- **Deployment:** Vercel hosting
- **Issue:** Recent calendar picker updates not appearing on live site
- **Problem:** Directory structure is disorganized and affecting workflows
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement

## MCP Workflow Requirements
- **Stream Path:** `_DEV/STREAMS/directory_structure_analysis`
- **Workflow Type:** Extended Discovery → Planning → Execution
- **Enforcement Level:** Full MCP workflow intelligence with step contracts
- **Evidence Requirements:** Structured evidence objects with validation
- **Quality Gates:** Blocking reflection at critical checkpoints
