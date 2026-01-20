#!/bin/bash

# Script to grant Service Account User role for Cloud Functions deployment
# This allows the service account to deploy Cloud Functions
#
# IMPORTANT: This script must be run with YOUR user account (not the service account)
# Your account needs "Project Owner" or "IAM Admin" role to grant permissions

set -e

PROJECT_ID="appliance-bot"
SERVICE_ACCOUNT_EMAIL="firebase-adminsdk-fbsvc@appliance-bot.iam.gserviceaccount.com"

echo "🔐 Granting Service Account User role for Cloud Functions deployment..."
echo "Project: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""
echo "⚠️  NOTE: This script must be run with YOUR user account (not the service account)"
echo "    Make sure you're logged in with: firebase login or gcloud auth login"
echo ""

# Check if user is logged in (not service account)
CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
if [[ "$CURRENT_ACCOUNT" == *"gserviceaccount.com"* ]]; then
  echo "❌ ERROR: You're using a service account. Please login with your user account:"
  echo "   gcloud auth login"
  echo "   OR"
  echo "   firebase login"
  exit 1
fi

if [ -z "$CURRENT_ACCOUNT" ]; then
  echo "❌ ERROR: Not logged in. Please login first:"
  echo "   gcloud auth login"
  echo "   OR"
  echo "   firebase login"
  exit 1
fi

echo "✅ Using account: $CURRENT_ACCOUNT"
echo ""

# Set project
gcloud config set project $PROJECT_ID

# Grant Service Account User role
echo "📝 Granting 'Service Account User' role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

echo ""
echo "✅ Service Account User role granted!"
echo ""
echo "🎯 Now you can deploy Cloud Functions:"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json"
echo "   firebase deploy --only functions:createUser --project $PROJECT_ID"
echo ""
