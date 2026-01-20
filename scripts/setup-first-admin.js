/**
 * Setup First Admin User in Firebase Auth
 * Creates the first admin user account for Firebase Authentication
 * 
 * Usage: node scripts/setup-first-admin.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account key
const serviceAccount = require(path.join(__dirname, '..', 'service-account-key.json'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://appliance-bot-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();
const auth = admin.auth();

/**
 * Create or update admin user in Firebase Auth
 */
async function setupAdminUser() {
  try {
    console.log('🚀 Setting up first admin user...\n');
    
    const email = 'dan.young@wiseguys.co.uk';
    const password = 'Dan-Ai-Mate'; // Default password - user should change this
    const role = 'admin';
    
    let firebaseUser;
    
    // Check if user already exists
    try {
      firebaseUser = await auth.getUserByEmail(email);
      console.log(`⚠️  User ${email} already exists in Firebase Auth`);
      console.log(`   User UID: ${firebaseUser.uid}`);
      
      // Update password if needed
      try {
        await auth.updateUser(firebaseUser.uid, {
          password: password
        });
        console.log(`   ✅ Password updated`);
      } catch (error) {
        console.log(`   ⚠️  Could not update password: ${error.message}`);
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        firebaseUser = await auth.createUser({
          email: email,
          password: password,
          emailVerified: false,
          disabled: false
        });
        console.log(`✅ Created new user in Firebase Auth: ${email}`);
        console.log(`   User UID: ${firebaseUser.uid}`);
      } else {
        throw error;
      }
    }
    
    // Set up database record with role
    const userId = firebaseUser.uid;
    const userData = {
      email: email,
      role: role,
      status: 'active',
      name: 'Dan Young',
      createdAt: new Date().toISOString(),
      createdBy: 'setup-script',
      updatedAt: new Date().toISOString()
    };
    
    const userRef = db.ref(`users/${userId}`);
    await userRef.set(userData);
    
    console.log(`✅ Database record created with role: ${role}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Setup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`   User UID: ${userId}`);
    console.log('\n🌐 Login URL:');
    console.log('   https://appliance-cover-form.vercel.app');
    console.log('\n⚠️  Security Note:');
    console.log('   Please change the password after first login!');
    console.log('='.repeat(60) + '\n');
    
    return { userId, email, role };
  } catch (error) {
    console.error('\n❌ Error setting up admin user:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await setupAdminUser();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { setupAdminUser };
