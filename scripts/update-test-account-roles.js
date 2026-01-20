/**
 * Update Test Account Roles in Database
 * Use this after creating accounts manually in Firebase Console
 * 
 * Usage: node scripts/update-test-account-roles.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test accounts
const testAccounts = [
  { email: 'admin@test.com', role: 'admin' },
  { email: 'agent1@test.com', role: 'agent' },
  { email: 'agent2@test.com', role: 'agent' },
  { email: 'agent3@test.com', role: 'agent' },
  { email: 'agent4@test.com', role: 'agent' }
];

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
  process.exit(1);
}

const auth = admin.auth();
const db = admin.database();

async function updateRoles() {
  console.log('📋 Updating roles for test accounts...\n');
  
  for (const account of testAccounts) {
    try {
      // Get user by email
      const user = await auth.getUserByEmail(account.email);
      const userId = user.uid;
      
      // Update database
      await db.ref(`users/${userId}`).set({
        email: account.email,
        role: account.role,
        status: 'active',
        createdAt: new Date().toISOString(),
        isTestAccount: true
      });
      
      console.log(`✅ ${account.email} - Role set to ${account.role}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`⚠️  ${account.email} - User not found. Create in Firebase Console first.`);
      } else {
        console.error(`❌ ${account.email} - Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n✅ Done!');
  process.exit(0);
}

updateRoles();
