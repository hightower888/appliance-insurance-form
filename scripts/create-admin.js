/**
 * Initial Admin User Setup Script
 * 
 * This script helps create the first admin user for the application.
 * 
 * Usage:
 * 1. Open Firebase Console: https://console.firebase.google.com
 * 2. Go to Authentication > Users
 * 3. Click "Add user"
 * 4. Enter email and password
 * 5. Copy the User UID
 * 6. Run this script in browser console on your app, or use Firebase Console to set the role
 * 
 * OR use the manual method below:
 */

// Manual method: Run this in browser console after logging in as the user
async function createAdminUser(userId, email) {
  if (!userId || !email) {
    console.error('Please provide userId and email');
    return;
  }

  try {
    // Make sure you're logged in
    if (!firebase.auth().currentUser) {
      console.error('Please log in first');
      return;
    }

    // Set user role to admin in database
    await firebase.database().ref(`users/${userId}`).set({
      email: email,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'setup-script'
    });

    console.log('Admin user created successfully!');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('Role: admin');
    
    // Reload page to apply changes
    window.location.reload();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Instructions
console.log(`
========================================
Admin User Setup Instructions
========================================

METHOD 1: Using Firebase Console (Recommended)
1. Go to https://console.firebase.google.com
2. Select your project: appliance-bot
3. Go to Authentication > Users
4. Click "Add user"
5. Enter email and password
6. Copy the User UID
7. Go to Realtime Database
8. Navigate to: users/{USER_UID}
9. Add this structure:
   {
     "email": "admin@example.com",
     "role": "admin",
     "status": "active",
     "createdAt": "2024-01-01T00:00:00.000Z"
   }

METHOD 2: Using Browser Console
1. Create user in Firebase Console (Authentication > Users)
2. Log in as that user in your app
3. Open browser console (F12)
4. Run: createAdminUser('USER_UID', 'admin@example.com')
   (Replace USER_UID and email with actual values)

METHOD 3: Using Firebase CLI
1. Install Firebase CLI: npm install -g firebase-tools
2. Login: firebase login
3. Use Firebase Admin SDK in a Cloud Function or script

========================================
`);

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.createAdminUser = createAdminUser;
}
