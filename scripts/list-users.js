/**
 * List All Users in Database
 * Shows all users that can be used to log in
 * 
 * Usage: node scripts/list-users.js
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
let app;
try {
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
  const serviceAccount = require(serviceAccountPath);
  
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'appliance-bot',
    databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error initializing:', error.message);
  console.log('\n💡 Make sure service-account-key.json exists');
  process.exit(1);
}

const db = admin.database();

async function listUsers() {
  console.log('🔍 Fetching all users from database...\n');
  
  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('❌ No users found in database');
      console.log('\n💡 You can create a user with: node scripts/create-test-users-db.js');
      process.exit(0);
    }
    
    const users = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      users.push({
        uid: childSnapshot.key,
        email: userData.email || '',
        username: userData.username || '',
        role: userData.role || 'agent',
        status: userData.status || 'active',
        hasPasswordHash: !!userData.passwordHash,
        createdAt: userData.createdAt || 'unknown'
      });
    });
    
    console.log(`✅ Found ${users.length} user(s) in database\n`);
    console.log('='.repeat(80));
    console.log('📋 Available Login Accounts:');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.role === 'admin' ? '👑' : user.role === 'processor' ? '⚙️' : '👤'} ${user.role.toUpperCase()}`);
      console.log(`   UID: ${user.uid}`);
      if (user.email) {
        console.log(`   Email: ${user.email}`);
      }
      if (user.username) {
        console.log(`   Username: ${user.username}`);
      }
      console.log(`   Status: ${user.status}`);
      console.log(`   Password Hash: ${user.hasPasswordHash ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Created: ${user.createdAt}`);
      
      if (!user.hasPasswordHash) {
        console.log(`   ⚠️  WARNING: This account cannot log in (no passwordHash)`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 To log in:');
    console.log('   - Use email OR username');
    console.log('   - Password is required');
    console.log('   - Only accounts with passwordHash can log in');
    console.log('\n💡 To create a new account:');
    console.log('   node scripts/create-test-users-db.js');
    console.log('\n💡 To add passwordHash to existing account:');
    console.log('   node scripts/add-password-hash.js <email> <password>');
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }
}

listUsers().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
