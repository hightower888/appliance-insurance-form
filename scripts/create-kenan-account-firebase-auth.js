#!/usr/bin/env node
/**
 * Create Kenan's Account in Firebase Auth
 * This script creates Kenan's account using Firebase Admin SDK
 * which allows creating users without signing in as them
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Error loading service account key:', error.message);
  console.error('   Make sure service-account-key.json exists in the project root');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://appliance-bot-default-rtdb.firebaseio.com"
  });
}

const auth = admin.auth();
const db = admin.database();

/**
 * Create or update Kenan's account
 */
async function createKenanAccount() {
  try {
    console.log('🚀 Creating Kenan\'s account...\n');
    
    const email = 'kenan@theflashteam.co.uk';
    const password = 'KenDog1!';
    const role = 'admin';
    const name = 'Kenan';
    
    let firebaseUser;
    let userId;
    
    // Check if user already exists in Firebase Auth
    try {
      firebaseUser = await auth.getUserByEmail(email);
      userId = firebaseUser.uid;
      console.log(`   ✅ User already exists in Firebase Auth: ${userId}`);
      
      // Update password
      await auth.updateUser(userId, {
        password: password,
        emailVerified: false
      });
      console.log(`   ✅ Password updated`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create new user
        firebaseUser = await auth.createUser({
          email: email,
          password: password,
          emailVerified: false,
          displayName: name
        });
        userId = firebaseUser.uid;
        console.log(`   ✅ Created new user in Firebase Auth: ${userId}`);
      } else {
        throw error;
      }
    }
    
    // Create or update user record in database
    const userRef = db.ref(`users/${userId}`);
    const existing = await userRef.once('value');
    
    const userData = {
      email: email,
      role: role,
      name: name,
      status: 'active',
      createdAt: existing.exists() ? existing.val().createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (existing.exists()) {
      await userRef.update(userData);
      console.log(`   ✅ Updated user record in database`);
    } else {
      await userRef.set(userData);
      console.log(`   ✅ Created user record in database`);
    }
    
    console.log(`\n📋 Account Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Status: active`);
    
    console.log(`\n✅ Kenan's account is ready!`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n💡 Kenan can now login at: https://appliance-cover-form.vercel.app/`);
    
    return { userId, email };
  } catch (error) {
    console.error('❌ Error creating Kenan account:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await createKenanAccount();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createKenanAccount };
