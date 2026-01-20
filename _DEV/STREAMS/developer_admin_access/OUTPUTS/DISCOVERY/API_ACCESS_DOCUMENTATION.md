# API Access Documentation

**Generated:** 2026-01-14  
**Stream:** developer_admin_access  
**Purpose:** Provide API access details for developer

---

## Firebase Project Details

### Project Information
- **Project ID:** `appliance-bot`
- **Project Name:** Appliance Insurance Form
- **Database URL:** `https://appliance-bot-default-rtdb.firebaseio.com`
- **Auth Domain:** `appliance-bot.firebaseapp.com`
- **Storage Bucket:** `appliance-bot.firebasestorage.app`

### Firebase Console Access
- **Firebase Console:** https://console.firebase.google.com/project/appliance-bot
- **Google Cloud Console:** https://console.cloud.google.com/home/dashboard?project=appliance-bot

### API Endpoints

#### Realtime Database
- **URL:** `https://appliance-bot-default-rtdb.firebaseio.com`
- **Rules File:** `database.rules.json`
- **Deploy Command:** `firebase deploy --only database`

#### Authentication
- **Auth Domain:** `appliance-bot.firebaseapp.com`
- **API Key:** `AIzaSyD6uLFRoTZCrrwlsin0oAmxKcd_xc2-vzA`
- **Enabled Methods:** Email/Password

#### Cloud Functions
- **Function URL:** `https://us-central1-appliance-bot.cloudfunctions.net/createUser`
- **Region:** `us-central1`
- **Deploy Command:** `firebase deploy --only functions:createUser`

#### Service Account
- **Email:** `firebase-adminsdk-fbsvc@appliance-bot.iam.gserviceaccount.com`
- **Key File:** `service-account-key.json` (in project root)

---

## Vercel Project Details

### Project Information
- **Project Name:** `appliance-cover-form` (or similar)
- **Deployment URL:** `https://appliance-cover-form.vercel.app`
- **Custom Domain:** (if configured)

### Vercel Console Access
- **Dashboard:** https://vercel.com/dashboard
- **Project Settings:** https://vercel.com/[team]/appliance-cover-form/settings

### Deployment
- **Deploy Command:** `vercel --prod`
- **Build Command:** (none - static files)
- **Output Directory:** `src`

### Configuration Files
- **vercel.json:** Project root
- **Build Settings:** Configured in Vercel dashboard

---

## Access Credentials

### Firebase CLI
```bash
# Login to Firebase
firebase login

# Set project
firebase use appliance-bot

# Deploy database rules
firebase deploy --only database

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy everything
firebase deploy
```

### Vercel CLI
```bash
# Login to Vercel
vercel login

# Link project (if not already linked)
vercel link

# Deploy to production
vercel --prod

# View deployments
vercel ls
```

### Google Cloud CLI
```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project appliance-bot

# View IAM permissions
gcloud projects get-iam-policy appliance-bot
```

---

## Required Permissions

### Firebase/Google Cloud IAM Roles
- `roles/owner` - Full project ownership
- `roles/firebase.admin` - Firebase Admin
- `roles/cloudfunctions.admin` - Cloud Functions Admin
- `roles/firebase.realtimeDatabaseAdmin` - Realtime Database Admin
- `roles/iam.serviceAccountUser` - Service Account User
- `roles/storage.admin` - Cloud Storage Admin

### Vercel Permissions
- **Role:** Admin/Owner
- **Capabilities:**
  - Deploy to production
  - Manage environment variables
  - Manage domains
  - View deployment logs
  - Manage team members
  - Access project settings

---

## Development Workflow

### Local Development Setup
```bash
# Clone repository
git clone [repository-url]
cd appliance_insurance_form

# Install dependencies
npm install

# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to services
firebase login
vercel login
gcloud auth login
```

### Deployment Workflow

#### 1. Deploy Database Rules
```bash
firebase deploy --only database
```

#### 2. Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

#### 3. Deploy Frontend to Vercel
```bash
# Option A: Git push (if connected)
git add .
git commit -m "Deploy changes"
git push

# Option B: Vercel CLI
vercel --prod
```

---

## Environment Variables

### Firebase Configuration
- **API Key:** `AIzaSyD6uLFRoTZCrrwlsin0oAmxKcd_xc2-vzA`
- **Project ID:** `appliance-bot`
- **Auth Domain:** `appliance-bot.firebaseapp.com`
- **Database URL:** `https://appliance-bot-default-rtdb.firebaseio.com`

### Vercel Environment Variables
- Configure in Vercel Dashboard: Settings > Environment Variables
- Available for all environments (Production, Preview, Development)

---

## Troubleshooting

### Firebase Access Issues
- **Error:** "Permission denied"
  - **Solution:** Verify IAM roles are granted correctly
  - **Check:** `gcloud projects get-iam-policy appliance-bot`

### Vercel Access Issues
- **Error:** "Not authorized"
  - **Solution:** Verify team membership and role
  - **Check:** Vercel Dashboard > Settings > Team

### Deployment Issues
- **Error:** "Service account not found"
  - **Solution:** Ensure service account key file exists
  - **File:** `service-account-key.json`

---

## Security Notes

⚠️ **Important:**
- Never commit `service-account-key.json` to git
- Keep API keys secure
- Rotate credentials periodically
- Use environment variables for sensitive data
- Follow principle of least privilege

---

## Support Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Google Cloud Docs:** https://cloud.google.com/docs
- **Project Repository:** [repository-url]

---

**Last Updated:** 2026-01-14  
**Maintained By:** Project Admin
