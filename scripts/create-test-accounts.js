/**
 * Create Test Accounts Script
 * Uses Firebase Admin SDK to create test accounts directly
 * 
 * Usage: node scripts/create-test-accounts.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Try to use application default credentials or service account
let app;

try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    // Try service account key file first
    const path = require('path');
    const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
    
    try {
      const serviceAccount = require(serviceAccountPath);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'appliance-bot',
        databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
      });
      console.log('✅ Firebase Admin initialized with Service Account');
    } catch (serviceAccountError) {
      // Fallback: Try Application Default Credentials
      try {
        app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: 'appliance-bot',
          databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
        });
        console.log('✅ Firebase Admin initialized with Application Default Credentials');
      } catch (adcError) {
        // Last fallback: project ID only
        console.log('⚠️  Trying project-only initialization...');
        app = admin.initializeApp({
          projectId: 'appliance-bot',
          databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
        });
        console.log('✅ Firebase Admin initialized');
      }
    }
  } else {
    app = admin.app();
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\n💡 Make sure service-account-key.json exists in project root');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.database();

// Test accounts to create
const testAccounts = [
  {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    role: 'admin',
    name: 'Admin Account'
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

/**
 * Create a single user account
 */
async function createAccount(account) {
  try {
    // Check if user already exists
    let user;
    try {
      user = await auth.getUserByEmail(account.email);
      console.log(`   ⚠️  User ${account.email} already exists, updating...`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create it
        user = await auth.createUser({
          email: account.email,
          password: account.password,
          emailVerified: true
        });
        console.log(`   ✅ Created user: ${account.email}`);
      } else {
        throw error;
      }
    }

    // Set up database record
    const userRef = db.ref(`users/${user.uid}`);
    await userRef.set({
      email: account.email,
      role: account.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      isTestAccount: true,
      createdBy: 'setup-script'
    });

    console.log(`   ✅ Database record created with role: ${account.role}`);
    
    return { success: true, userId: user.uid, email: account.email };
  } catch (error) {
    console.error(`   ❌ Error creating ${account.email}:`, error.message);
    return { success: false, error: error.message, email: account.email };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Starting test account creation...\n');
  console.log(`📋 Creating ${testAccounts.length} accounts:\n`);

  const results = [];
  
  for (const account of testAccounts) {
    console.log(`📝 Processing: ${account.name} (${account.email})`);
    const result = await createAccount(account);
    results.push(result);
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.email} - Created/Updated`);
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
  console.log('\n✅ Setup complete! You can now log in with any of these accounts.\n');

  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
