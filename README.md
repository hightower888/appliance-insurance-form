# Appliance Insurance Form - Lead Management System

A comprehensive lead management and CRM system for appliance insurance sales, built with Firebase and deployed on Vercel.

## 🚀 Features

- **Lead Management**: Track and manage leads through the sales funnel
- **CRM System**: Complete customer relationship management
- **Processor Dashboard**: Process and manage sales data
- **Admin Panel**: User management and system configuration
- **Performance Optimized**: Pagination, caching, and query optimization
- **Secure**: Role-based access control and data isolation

## 📋 Prerequisites

- Node.js 18+ 
- Firebase CLI
- Vercel CLI (optional, for manual deployment)

## 🔧 Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd appliance_insurance_form
```

### 2. Install Dependencies

```bash
# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 3. Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your Firebase credentials
# Get your API key from: https://console.firebase.google.com/project/appliance-bot/settings/general
```

**Required Environment Variables:**
- `VITE_FIREBASE_API_KEY` - Firebase Web API Key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain
- `VITE_FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
- `VITE_FIREBASE_PROJECT_ID` - Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID` - Firebase App ID

### 4. Firebase Setup

```bash
# Login to Firebase
firebase login

# Set project
firebase use appliance-bot

# Deploy database rules
firebase deploy --only database
```

### 5. Local Development

```bash
# Serve locally (if using a local server)
# Or use Vercel CLI for local development
vercel dev
```

## 🚀 Deployment

### Vercel Deployment

The project is configured for automatic deployment via Vercel when pushing to the main branch.

**Manual Deployment:**
```bash
vercel --prod
```

### Firebase Deployment

```bash
# Deploy database rules
firebase deploy --only database

# Deploy Cloud Functions (if any)
firebase deploy --only functions
```

## 📁 Project Structure

```
├── src/                    # Source files
│   ├── components/         # UI components
│   ├── services/           # Business logic services
│   ├── modules/            # Core modules
│   └── *.html              # Page templates
├── functions/              # Firebase Cloud Functions
├── scripts/                # Utility scripts
├── database.rules.json     # Firebase security rules
├── vercel.json             # Vercel configuration
└── .env.example            # Environment variables template
```

## 🔐 Security

**⚠️ IMPORTANT:** Never commit API keys or secrets to the repository.

- All secrets should be in `.env.local` (gitignored)
- Use environment variables in production (Vercel dashboard)
- Database rules enforce data isolation by role

See `SECURITY_SETUP.md` for detailed security configuration.

## 🧪 Testing

```bash
# Run tests (if configured)
npm test
```

## 📝 Documentation

- `DEPLOYMENT_CHECKLIST.md` - Deployment procedures
- `SECURITY_SETUP.md` - Security configuration guide
- `SETUP_GUIDE.md` - Detailed setup instructions

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all secrets are in environment variables
4. Test locally
5. Submit a pull request

## 📄 License

[Your License Here]

## 🔗 Links

- **Production:** https://lead-management-system-gray.vercel.app
- **Firebase Console:** https://console.firebase.google.com/project/appliance-bot

---

**Status:** ✅ Production Ready
