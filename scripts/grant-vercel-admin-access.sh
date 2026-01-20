#!/bin/bash

# Grant Vercel Admin Access to Developer
# 
# Adds a developer as a team member with admin role on Vercel project
# 
# Usage: ./scripts/grant-vercel-admin-access.sh <email>
# Example: ./scripts/grant-vercel-admin-access.sh kennen_02@icloud.com
# 
# Requirements:
# - Must be logged in to Vercel CLI: vercel login
# - Must have admin access to the project

set -e

DEVELOPER_EMAIL="${1:-kennen_02@icloud.com}"

echo "🚀 Granting Vercel Admin Access to Developer"
echo ""
echo "Developer Email: $DEVELOPER_EMAIL"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ ERROR: Vercel CLI is not installed"
  echo "   Install: npm install -g vercel"
  exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "❌ ERROR: Not logged in to Vercel"
  echo "   Please login first: vercel login"
  exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Get current project info
echo "📋 Current Vercel Project Info:"
vercel ls 2>/dev/null || echo "   (Run 'vercel' in project directory to link project)"
echo ""

echo "📝 To add team member with admin access:"
echo ""
echo "Option 1: Via Vercel Dashboard (Recommended)"
echo "   1. Go to: https://vercel.com/dashboard"
echo "   2. Select your project: appliance-cover-form"
echo "   3. Go to Settings > Team"
echo "   4. Click 'Invite Member'"
echo "   5. Enter email: $DEVELOPER_EMAIL"
echo "   6. Select role: Admin"
echo "   7. Click 'Send Invitation'"
echo ""

echo "Option 2: Via Vercel API"
echo "   You can use the Vercel API to invite team members:"
echo "   curl -X POST 'https://api.vercel.com/v1/teams/{team-id}/members' \\"
echo "     -H 'Authorization: Bearer YOUR_VERCEL_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"$DEVELOPER_EMAIL\",\"role\":\"OWNER\"}'"
echo ""

echo "Option 3: Via Vercel CLI (if project is linked)"
echo "   vercel teams invite $DEVELOPER_EMAIL --role=admin"
echo ""

echo "📋 After invitation:"
echo "   1. Developer will receive email invitation"
echo "   2. Developer should accept invitation"
echo "   3. Developer can then:"
echo "      - Access project dashboard"
echo "      - Deploy via: vercel --prod"
echo "      - Manage environment variables"
echo "      - Manage domains"
echo "      - View deployment logs"
echo ""

echo "✅ Instructions provided. Please use one of the methods above."
echo ""
