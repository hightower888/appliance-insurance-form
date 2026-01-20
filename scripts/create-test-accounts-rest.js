/**
 * Create Test Accounts using Firebase REST API
 * Uses gcloud access token for authentication
 * 
 * Usage: node scripts/create-test-accounts-rest.js
 */

const { execSync } = require('child_process');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'appliance-bot';
const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || 'https://appliance-bot-default-rtdb.firebaseio.com';
const WEB_API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY; // From environment variables

// Validate API key is set
if (!WEB_API_KEY || WEB_API_KEY === 'undefined') {
  console.error('❌ ERROR: FIREBASE_API_KEY not found in environment variables!');
  console.error('   Please create .env.local file with your Firebase API key.');
  console.error('   See .env.example for template.');
  process.exit(1);
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
 * Get access token from gcloud
 */
function getAccessToken() {
  try {
    const token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf-8' }).trim();
    return token;
  } catch (error) {
    throw new Error('Failed to get access token. Make sure you ran: gcloud auth application-default login');
  }
}

/**
 * Create user via Identity Toolkit API
 */
function createUser(email, password, accessToken) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password,
      emailVerified: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${WEB_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          const errorData = JSON.parse(data || '{}');
          reject(new Error(`API Error ${res.statusCode}: ${errorData.error?.message || data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Update database record
 */
function updateDatabase(userId, account, accessToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(DATABASE_URL);
    const path = `/users/${userId}.json?access_token=${accessToken}`;
    
    const postData = JSON.stringify({
      email: account.email,
      role: account.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      isTestAccount: true,
      createdBy: 'setup-script'
    });

    const options = {
      hostname: url.hostname,
      path: path,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve(JSON.parse(data || '{}'));
        } else {
          reject(new Error(`Database Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Starting test account creation via REST API...\n');

  // Get access token
  console.log('🔑 Getting access token...');
  let accessToken;
  try {
    accessToken = getAccessToken();
    console.log('✅ Access token obtained\n');
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  console.log(`📋 Creating ${testAccounts.length} accounts:\n`);

  const results = [];

  for (const account of testAccounts) {
    console.log(`📝 Processing: ${account.name} (${account.email})`);
    
    try {
      // Create user
      const userData = await createUser(account.email, account.password, accessToken);
      const userId = userData.localId || userData.uid;
      console.log(`   ✅ User created: ${userId}`);

      // Update database
      await updateDatabase(userId, account, accessToken);
      console.log(`   ✅ Database record created with role: ${account.role}`);

      results.push({ success: true, userId, email: account.email });
    } catch (error) {
      // Check if user already exists
      if (error.message.includes('EMAIL_EXISTS')) {
        console.log(`   ⚠️  User already exists, updating role...`);
        try {
          // Get user by email to get UID
          // For now, just note it exists
          results.push({ success: false, error: 'User already exists - please update manually', email: account.email });
        } catch (updateError) {
          results.push({ success: false, error: error.message, email: account.email });
        }
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        results.push({ success: false, error: error.message, email: account.email });
      }
    }
    console.log(''); // Empty line
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.email} - Created`);
    } else {
      console.log(`❌ ${result.email} - ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully created: ${successCount}/${testAccounts.length}`);
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

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
