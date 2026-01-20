# Appliance Insurance Form - Setup & Deployment Guide

## Overview

This application is an appliance insurance form with:
- **User Authentication** (Firebase Auth)
- **Role-Based Access Control** (Admin vs Agent)
- **Admin Panel** (User management & sales viewing)
- **Sales Database** (Admin-only read, authenticated write)
- **Agent Association** (Automatic agent tracking on submissions)

## Prerequisites

1. **Firebase Project** - Already configured
   - Project ID: `appliance-bot`
   - Database URL: `https://appliance-bot-default-rtdb.firebaseio.com`

2. **Firebase CLI** (for deployment)
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

## Initial Setup

### Step 0: Quick Test Account Setup (Optional)

If you want to quickly set up test accounts (1 admin + 4 agents), use the automated setup page:

1. **Create first admin manually** (see Step 1 below)
2. **Log in as that admin**
3. **Navigate to:** `src/setup-test-accounts.html` (or `setup-test-accounts.html` if deployed)
4. **Click:** "Create All Accounts"
5. **Wait for completion** (you'll be logged out and need to log back in)

This will create:
- **Admin:** `admin@test.com` / `TestAdmin123!`
- **Agent 1:** `agent1@test.com` / `TestAgent123!`
- **Agent 2:** `agent2@test.com` / `TestAgent123!`
- **Agent 3:** `agent3@test.com` / `TestAgent123!`
- **Agent 4:** `agent4@test.com` / `TestAgent123!`

See `TEST_ACCOUNTS.md` for full details.

### Step 1: Create First Admin User

You need to create the first admin user manually. Choose one method:

#### Method 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **appliance-bot**
3. Navigate to **Authentication > Users**
4. Click **"Add user"**
5. Enter:
   - Email: `admin@yourcompany.com`
   - Password: (choose a strong password)
6. Click **"Add user"**
7. **Copy the User UID** (you'll need it)

8. Navigate to **Realtime Database**
9. Go to path: `users/{USER_UID}`
10. Add this structure:
    ```json
    {
      "email": "admin@yourcompany.com",
      "role": "admin",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
    ```

#### Method 2: Browser Console

1. Create user in Firebase Console (Authentication > Users)
2. Log in as that user in your app
3. Open browser console (F12)
4. Run:
   ```javascript
   createAdminUser('USER_UID', 'admin@example.com')
   ```
   (Replace `USER_UID` and email with actual values)

### Step 2: Verify Database Rules

The database rules are already configured in `database.rules.json`:

- **Sales**: Admin-only read, authenticated write
- **Users**: Admin can manage, users can read own data
- **Security**: All paths protected by default

Deploy rules:
```bash
firebase deploy --only database
```

### Step 3: Test Application

1. **Test Login**
   - Go to `login.html`
   - Log in with admin credentials
   - Should redirect to `admin.html`

2. **Test Admin Panel**
   - View users list
   - Create new user (will require re-login)
   - View sales data

3. **Test Form Submission**
   - Log in as agent
   - Submit form
   - Verify agent info is included
   - Check admin panel to see sale

## Deployment

### Deploy to Firebase Hosting

1. **Initialize Firebase Hosting** (if not already done):
   ```bash
   firebase init hosting
   ```
   - Select existing project: `appliance-bot`
   - Public directory: `src`
   - Single-page app: No
   - Overwrite index.html: No

2. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

3. **Deploy Database Rules**:
   ```bash
   firebase deploy --only database
   ```

4. **Access your app**:
   - URL: `https://appliance-bot.web.app` or `https://appliance-bot.firebaseapp.com`

### Alternative: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd src
   vercel
   ```

3. Configure:
   - Root directory: `src`
   - Build command: (none needed)
   - Output directory: `src`

## User Management

### Creating Users

**As Admin:**
1. Log in to admin panel (`admin.html`)
2. Click "Create New User"
3. Enter email, password, and role
4. Click "Create User"
5. **Note**: You'll be logged out after creating a user (this is expected)
6. Log back in to continue

**Manual Method:**
1. Use Firebase Console (Authentication > Users)
2. Create user
3. Set role in Realtime Database: `users/{UID}/role = "admin"` or `"agent"`

### User Roles

- **Admin**: Can view all sales, manage users, access admin panel
- **Agent**: Can submit forms, view own submissions (if implemented)

## Database Structure

### Users
```
users/
  {userId}/
    email: string
    role: "admin" | "agent"
    status: "active" | "inactive"
    createdAt: ISO timestamp
    lastLoginAt: ISO timestamp
```

### Sales
```
sales/
  {saleId}/
    contact: {
      name: string
      phone: string
      email: string
      address: string
      postcode: string
    }
    appliances: Array<{
      type: string
      make: string
      model: string
      age: string
      monthlyCost: number
    }>
    plan: {
      number: string
      type: string
      totalCost: number
    }
    payment: {
      sortCode: string
      accountNumber: string
      ddDate: string
    }
    agentId: string
    agentEmail: string
    timestamp: number
    submittedAt: ISO timestamp
    notes: string
```

## Security Rules

### Current Rules (database.rules.json)

- **Sales**: Admin-only read, authenticated write
- **Users**: Admin can manage, users can read own data
- **Default**: Deny all access

### Testing Rules

Use Firebase Console > Realtime Database > Rules to test:
1. Click "Simulator"
2. Enter path and operation
3. Test with different user roles

## Troubleshooting

### "User creation requires Firebase Admin SDK"
- This is expected for client-side user creation
- Use Firebase Console or Cloud Functions for production

### "Cannot read sales data"
- Check user role is "admin" in database
- Verify database rules are deployed
- Check browser console for errors

### "Redirect loop on login"
- Check `auth.js` redirect logic
- Verify user role exists in database
- Check browser console for errors

### "Form submission fails"
- Check user is authenticated
- Verify database rules allow writes
- Check browser console for errors

## Development

### Local Development

1. **Serve locally**:
   ```bash
   # Using Python
   cd src
   python -m http.server 8000
   
   # Or using Node.js
   npx http-server src -p 8000
   ```

2. **Access**: `http://localhost:8000`

### File Structure

```
src/
  ├── login.html          # Login page
  ├── appliance_form.html # Main form
  ├── admin.html          # Admin panel
  ├── auth.js             # Authentication logic
  ├── app.js              # Form logic
  ├── admin.js            # Admin panel logic
  └── styles.css          # Styles

database.rules.json       # Firebase security rules
firebase.json             # Firebase configuration
```

## Support

For issues or questions:
1. Check browser console for errors
2. Check Firebase Console for database/auth issues
3. Review this guide
4. Check `_DEV/STREAMS/appliance_admin_deployment/` for detailed documentation

## Next Steps

1. ✅ Create first admin user
2. ✅ Deploy database rules
3. ✅ Test application
4. ✅ Deploy to hosting
5. Create additional users
6. Start using the application!
