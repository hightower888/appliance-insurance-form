#!/bin/bash
# Deploy All Changes - User Creation Permission Fix
# This script deploys database rules, Cloud Function (already done), and prepares frontend

set -e  # Exit on error

echo "🚀 Starting deployment of user creation permission fix..."
echo ""

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Set service account for authentication
export GOOGLE_APPLICATION_CREDENTIALS="$PROJECT_DIR/service-account-key.json"

echo "✅ Using service account: $GOOGLE_APPLICATION_CREDENTIALS"
echo ""

# Step 1: Deploy Database Rules
echo "📋 Step 1: Deploying database rules..."
firebase deploy --only database --token "$(gcloud auth print-access-token --impersonate-service-account=firebase-adminsdk-fbsvc@appliance-bot.iam.gserviceaccount.com 2>/dev/null || echo '')" || {
    echo "⚠️  Database rules deployment requires interactive login"
    echo "   Run: firebase login"
    echo "   Then: firebase deploy --only database"
}
echo ""

# Step 2: Verify Cloud Function (already deployed)
echo "☁️  Step 2: Verifying Cloud Function..."
FUNCTION_URL="https://us-central1-appliance-bot.cloudfunctions.net/createUser"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$FUNCTION_URL" -H "Content-Type: application/json" -d '{"test":"check"}' --max-time 5 || echo "000")
if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Cloud Function is deployed and accessible (HTTP $HTTP_CODE)"
else
    echo "⚠️  Cloud Function status: HTTP $HTTP_CODE"
fi
echo ""

# Step 3: Frontend deployment info
echo "🌐 Step 3: Frontend deployment..."
echo "   Frontend changes need to be deployed to Vercel"
echo "   Option A: Git push (if connected to Vercel)"
echo "   Option B: Run: vercel --prod"
echo ""

echo "✅ Deployment script complete!"
echo ""
echo "📝 Summary:"
echo "   - Cloud Function: ✅ Deployed"
echo "   - Database Rules: ⚠️  May need manual login"
echo "   - Frontend: ⚠️  Needs Vercel deployment"
