/**
 * Create Test Users in Database (No Firebase Auth)
 * Creates users directly in Realtime Database for testing
 * 
 * Usage: node scripts/create-test-users-db.js
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

// Simple password hash (for testing only - not production secure)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Test accounts to create
const testAccounts = [
  {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    role: 'admin',
    name: 'Admin Account'
  },
  {
    email: 'processor1@test.com',
    password: 'TestProcessor123!',
    role: 'processor',
    name: 'Processor 1'
  },
  {
    email: 'agent1@test.com',
    password: 'TestAgent123!',
    role: 'agent',
    name: 'Agent 1'
  },
  {
    email: 'agent2@test.com',
    password: 'TestAgent123!',
    role: 'agent',
    name: 'Agent 2'
  },
  {
    email: 'agent3@test.com',
    password: 'TestAgent123!',
    role: 'agent',
    name: 'Agent 3'
  },
  {
    email: 'agent4@test.com',
    password: 'TestAgent123!',
    role: 'agent',
    name: 'Agent 4'
  }
];

async function createUser(account) {
  try {
    // Generate a simple user ID from email
    const userId = crypto.createHash('md5').update(account.email).digest('hex');
    
    // Check if user already exists
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    
    if (snapshot.exists()) {
      console.log(`   ⚠️  User ${account.email} already exists, updating...`);
    } else {
      console.log(`   ✅ Creating user: ${account.email}`);
    }
    
    // Create/update user record
    await userRef.set({
      email: account.email,
      passwordHash: hashPassword(account.password), // Store hashed password
      role: account.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      isTestAccount: true,
      userId: userId
    });
    
    console.log(`   ✅ Database record created with role: ${account.role}`);
    console.log(`   📝 User ID: ${userId}`);
    
    return { success: true, userId, email: account.email };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message, email: account.email };
  }
}

async function main() {
  console.log('🚀 Creating test users in database...\n');
  console.log(`📋 Creating ${testAccounts.length} users:\n`);

  const results = [];
  
  for (const account of testAccounts) {
    console.log(`📝 Processing: ${account.name} (${account.email})`);
    const result = await createUser(account);
    results.push(result);
    console.log(''); // Empty line
  }

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.email} - Created/Updated (ID: ${result.userId})`);
    } else {
      console.log(`❌ ${result.email} - Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully created/updated: ${successCount}/${testAccounts.length}`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
  console.log('='.repeat(50));

  // Test account credentials
  console.log('\n📋 Test Account Credentials:');
  console.log('='.repeat(50));
  testAccounts.forEach(account => {
    console.log(`\n${account.role === 'admin' ? '👑' : '👤'} ${account.name}`);
    console.log(`   Email: ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log(`   Role: ${account.role}`);
  });
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Users created in database! You can now log in with these accounts.\n');

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
