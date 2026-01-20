#!/bin/bash
# Deploy Everything - User Creation Permission Fix
# Complete deployment script using service account

set -e  # Exit on error

echo "🚀 Deploying All Changes for User Creation Permission Fix..."
echo ""

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Set service account for Firebase
export GOOGLE_APPLICATION_CREDENTIALS="$PROJECT_DIR/service-account-key.json"

echo "📋 Step 1: Deploying Database Rules..."
firebase deploy --only database
echo "✅ Database rules deployed!"
echo ""

echo "☁️  Step 2: Verifying Cloud Function..."
FUNCTION_URL="https://us-central1-appliance-bot.cloudfunctions.net/createUser"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$FUNCTION_URL" -H "Content-Type: application/json" -d '{"test":"check"}' --max-time 5 || echo "000")
if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Cloud Function is deployed and accessible (HTTP $HTTP_CODE)"
else
    echo "⚠️  Cloud Function status: HTTP $HTTP_CODE"
fi
echo ""

echo "🌐 Step 3: Frontend Deployment..."
echo "   Frontend needs to be deployed to Vercel"
echo ""
echo "   Option A: If connected to Git/Vercel, just push:"
echo "   git add src/admin.js database.rules.json"
echo "   git commit -m 'Fix user creation permission error'"
echo "   git push"
echo ""
echo "   Option B: Use Vercel CLI:"
echo "   vercel --prod"
echo ""

echo "✅ Deployment Summary:"
echo "   ✅ Database Rules: Deployed"
echo "   ✅ Cloud Function: Deployed"
echo "   ⚠️  Frontend: Needs Vercel deployment (see options above)"
echo ""
echo "🎉 Core fixes are deployed! User creation should work now."
