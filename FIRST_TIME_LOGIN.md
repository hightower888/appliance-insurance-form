# First Time Login - Setup Instructions

## Quick Setup (Recommended)

Since Firebase Auth needs to be enabled first, here are two ways to create your first admin account:

### Method 1: Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select project: **appliance-bot**

2. **Enable Authentication** (if not already enabled)
   - Go to **Authentication** in the left menu
   - Click **Get Started**
   - Enable **Email/Password** sign-in method
   - Click **Save**

3. **Create Admin User**
   - In **Authentication > Users**, click **Add user**
   - Enter:
     - **Email:** `dan.young@wiseguys.co.uk`
     - **Password:** `Dan-Ai-Mate` (or your preferred password)
   - Click **Add user**
   - **Copy the User UID** (you'll see it in the user list)

4. **Set User Role in Database**
   - Go to **Realtime Database**
   - Navigate to: `users/{USER_UID}` (replace {USER_UID} with the UID you copied)
   - Click **+** to add data:
     ```json
     {
       "email": "dan.young@wiseguys.co.uk",
       "role": "admin",
       "status": "active",
       "name": "Dan Young",
       "createdAt": "2024-01-01T00:00:00.000Z"
     }
     ```
   - Click **Save**

5. **Login**
   - Go to: https://appliance-cover-form.vercel.app
   - Use:
     - **Email:** `dan.young@wiseguys.co.uk`
     - **Password:** `Dan-Ai-Mate` (or the password you set)

### Method 2: Using Script (After Auth is Enabled)

Once Firebase Authentication is enabled in the console:

```bash
node scripts/setup-first-admin.js
```

This will create:
- **Email:** `dan.young@wiseguys.co.uk`
- **Password:** `Dan-Ai-Mate`
- **Role:** `admin`

## After First Login

1. **Change Password** (recommended)
   - Click on your email in the top right
   - Use "Forgot Password" link on login page to reset

2. **Create Additional Users**
   - Log in as admin
   - Go to Admin Panel
   - Click "Create New User"
   - Fill in details and create

## Troubleshooting

### "Configuration not found" Error
- This means Firebase Auth isn't enabled
- **Solution:** Use Method 1 (Firebase Console) to enable Auth first

### Can't Access Admin Panel
- Make sure the `role: "admin"` is set in the database at `users/{USER_UID}/role`
- Check that you're using the correct User UID from Firebase Auth

### Forgot Password
- Use the "Forgot password?" link on the login page
- Or reset in Firebase Console: Authentication > Users > [User] > Reset Password

## Need Help?

If you encounter issues:
1. Check Firebase Console > Authentication > Users - user should be listed
2. Check Firebase Console > Realtime Database > users/{UID} - role should be "admin"
3. Check browser console for errors (F12)
