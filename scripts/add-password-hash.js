/**
 * Add passwordHash to existing user in database
 * 
 * Usage: node scripts/add-password-hash.js <email> <password>
 * Example: node scripts/add-password-hash.js dan.young@wiseguys.co.uk MyPassword123
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

// Simple password hash (SHA-256 hex) - matches auth-db.js
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function addPasswordHash(email, password) {
  try {
    console.log(`🔍 Searching for user: ${email}`);
    
    // Search for user by email
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      console.error('❌ No users found in database');
      process.exit(1);
    }
    
    let foundUser = null;
    let userId = null;
    
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
        foundUser = userData;
        userId = childSnapshot.key;
        return true; // Stop iteration
      }
    });
    
    if (!foundUser) {
      console.error(`❌ User not found: ${email}`);
      console.log('\n💡 Available users:');
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        console.log(`   - ${userData.email || 'No email'} (ID: ${childSnapshot.key})`);
      });
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${foundUser.email || foundUser.username}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Role: ${foundUser.role || 'not set'}`);
    console.log(`   Status: ${foundUser.status || 'not set'}`);
    
    // Hash the password
    const passwordHash = hashPassword(password);
    console.log(`\n🔐 Password hash generated`);
    
    // Update user record with passwordHash
    const userRef = db.ref(`users/${userId}`);
    await userRef.update({
      passwordHash: passwordHash
    });
    
    console.log(`\n✅ Password hash added successfully!`);
    console.log(`   User can now login via auth-db.js`);
    console.log(`\n📝 User record updated:`);
    console.log(`   Email: ${foundUser.email || 'N/A'}`);
    console.log(`   Username: ${foundUser.username || 'N/A'}`);
    console.log(`   Role: ${foundUser.role || 'N/A'}`);
    console.log(`   PasswordHash: ${passwordHash.substring(0, 20)}...`);
    
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage: node scripts/add-password-hash.js <email> <password>');
  console.error('   Example: node scripts/add-password-hash.js dan.young@wiseguys.co.uk MyPassword123');
  process.exit(1);
}

const email = args[0];
const password = args[1];

if (!email || !password) {
  console.error('❌ Email and password are required');
  process.exit(1);
}

addPasswordHash(email, password).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
