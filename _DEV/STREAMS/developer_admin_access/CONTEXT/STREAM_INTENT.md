# Developer Admin Access Setup Stream Intent

## Primary Goal
Grant full admin access to developer (kennen_02@icloud.com) for Firebase and Vercel platforms, enabling them to develop and deploy the appliance insurance form project independently.

## Scope
### Firebase Admin Access
- Grant IAM permissions in Google Cloud Console
- Provide Firebase project access
- Enable Cloud Functions deployment permissions
- Enable Database rules deployment permissions
- Enable Authentication management
- Enable Realtime Database access

### Vercel Admin Access
- Add developer as team member with admin role
- Grant project access
- Enable deployment permissions
- Enable environment variable management
- Enable domain management

### Documentation
- Create API access documentation
- Document Firebase project details
- Document Vercel project details
- Provide access credentials and setup instructions

## Success Criteria
- Developer has full Firebase IAM permissions
- Developer has Vercel admin access
- All deployment permissions granted
- API access documented
- Developer can independently deploy and manage project

## Priority
CRITICAL - Developer needs immediate access to begin work

## Context
- **Developer Email:** kennen_02@icloud.com
- **Firebase Project:** appliance-bot
- **Vercel Project:** appliance-cover-form (or similar)
- **Platform:** Vercel + Firebase
- **Requirement:** Full admin access for development and deployment

## API Registration Details
From API registration documents:
- **Firebase Project ID:** appliance-bot
- **Firebase Database URL:** https://appliance-bot-default-rtdb.firebaseio.com
- **Firebase Auth Domain:** appliance-bot.firebaseapp.com
- **Cloud Function URL:** https://us-central1-appliance-bot.cloudfunctions.net/createUser
- **Vercel Domain:** appliance-cover-form.vercel.app
- **Service Account:** firebase-adminsdk-fbsvc@appliance-bot.iam.gserviceaccount.com

## Workflow
**Workflow:** Discovery Assessment AI (manual execution, no MCP)
**Steps:**
1. Discovery Assessment - Analyze access requirements
2. Create access scripts
3. Grant Firebase IAM permissions
4. Grant Vercel team access
5. Document API access details
6. Verify access
