/**
 * Create Test Accounts using Firebase Web API (signUp endpoint)
 * This uses the public signup API which doesn't require admin credentials
 * 
 * Usage: node scripts/create-test-accounts-webapi.js
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const WEB_API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || 'https://appliance-bot-default-rtdb.firebaseio.com';

// Validate API key is set
if (!WEB_API_KEY || WEB_API_KEY === 'undefined') {
  console.error('❌ ERROR: FIREBASE_API_KEY not found in environment variables!');
  console.error('   Please create .env.local file with your Firebase API key.');
  console.error('   See .env.example for template.');
  process.exit(1);
}

const testAccounts = [
  { email: 'admin@test.com', password: 'TestAdmin123!', role: 'admin', name: 'Admin' },
  { email: 'agent1@test.com', password: 'TestAgent123!', role: 'agent', name: 'Agent 1' },
  { email: 'agent2@test.com', password: 'TestAgent123!', role: 'agent', name: 'Agent 2' },
  { email: 'agent3@test.com', password: 'TestAgent123!', role: 'agent', name: 'Agent 3' },
  { email: 'agent4@test.com', password: 'TestAgent123!', role: 'agent', name: 'Agent 4' }
];

function createUser(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true
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
          const error = JSON.parse(data || '{}');
          reject(new Error(error.error?.message || `HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function updateDatabase(userId, account, idToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(DATABASE_URL);
    const path = `/users/${userId}.json?auth=${idToken}`;
    
    const postData = JSON.stringify({
      email: account.email,
      role: account.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      isTestAccount: true
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

async function main() {
  console.log('\n🚀 Creating test accounts via Firebase Web API...\n');

  const results = [];

  for (const account of testAccounts) {
    console.log(`📝 Creating: ${account.name} (${account.email})`);
    
    try {
      const userData = await createUser(account.email, account.password);
      const userId = userData.localId;
      const idToken = userData.idToken;
      
      console.log(`   ✅ User created: ${userId}`);

      // Update database with role
      try {
        await updateDatabase(userId, account, idToken);
        console.log(`   ✅ Database record created with role: ${account.role}`);
        results.push({ success: true, email: account.email, userId });
      } catch (dbError) {
        console.log(`   ⚠️  User created but database update failed: ${dbError.message}`);
        results.push({ success: false, email: account.email, error: dbError.message });
      }
    } catch (error) {
      if (error.message.includes('EMAIL_EXISTS')) {
        console.log(`   ⚠️  User already exists: ${account.email}`);
        results.push({ success: false, email: account.email, error: 'Already exists' });
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({ success: false, email: account.email, error: error.message });
      }
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  const success = results.filter(r => r.success).length;
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.email}${r.success ? '' : ' - ' + r.error}`);
  });
  console.log('='.repeat(50));
  console.log(`\n✅ Created: ${success}/${testAccounts.length} accounts\n`);

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
