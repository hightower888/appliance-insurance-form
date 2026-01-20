# Grant Cloud Functions Deployment Permissions

This script grants the necessary permissions for the service account to deploy Cloud Functions.

## ⚠️ Important

**This script must be run with YOUR user account** (not the service account).  
Your account needs "Project Owner" or "IAM Admin" role to grant permissions.

## Quick Run

1. **Login with your user account:**
   ```bash
   gcloud auth login
   # OR
   firebase login
   ```

2. **Run the script:**
   ```bash
   ./grant-function-deploy-permissions.sh
   ```

## What It Does

1. Verifies you're logged in with a user account (not service account)
2. Grants the "Service Account User" role (`roles/iam.serviceAccountUser`) to the Firebase Admin SDK service account
3. This allows the service account to act as the App Engine default service account when deploying Cloud Functions

## Manual Alternative

If the script doesn't work, you can grant permissions manually:

1. **Via Google Cloud Console:**
   - Go to: https://console.cloud.google.com/iam-admin/iam?project=appliance-bot
   - Find: `firebase-adminsdk-fbsvc@appliance-bot.iam.gserviceaccount.com`
   - Click "Edit" → "Add Another Role"
   - Select: "Service Account User"
   - Save

2. **Via gcloud CLI:**
   ```bash
   gcloud projects add-iam-policy-binding appliance-bot \
     --member="serviceAccount:firebase-adminsdk-fbsvc@appliance-bot.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

## After Running

Once permissions are granted, deploy the Cloud Function:

```bash
firebase deploy --only functions:createUser --project appliance-bot
```

## Troubleshooting

If you get "Permission denied" errors:
- Make sure you're using a service account or user account with "Project Owner" or "IAM Admin" role
- The script uses the service account key, but you may need to run it with your own credentials that have admin permissions
