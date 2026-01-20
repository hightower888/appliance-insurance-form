/**
 * Create Test Accounts Script using Firebase REST API
 * Uses Firebase CLI token to authenticate
 * 
 * Usage: node scripts/create-test-accounts-cli.js
 */

const { execSync } = require('child_process');
const https = require('https');

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

const PROJECT_ID = 'appliance-bot';
const DATABASE_URL = 'https://appliance-bot-default-rtdb.firebaseio.com';

/**
 * Get Firebase access token
 */
function getAccessToken() {
  try {
    const token = execSync('firebase login:ci --no-localhost', { encoding: 'utf-8' }).trim();
    if (token && token.length > 0) {
      return token;
    }
  } catch (error) {
    // Try to get token from existing session
  }
  
  // Try to get token from firebase-tools
  try {
    const result = execSync('firebase projects:list', { encoding: 'utf-8' });
    // If this works, we're authenticated, but we need the actual token
    // Let's use a different approach
  } catch (error) {
    throw new Error('Not authenticated with Firebase. Please run: firebase login');
  }
  
  // For now, we'll use the Identity Toolkit API directly
  // This requires the API to be enabled
  return null;
}

/**
 * Create user using Firebase Identity Toolkit API
 */
async function createUserViaAPI(email, password, accessToken) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password,
      emailVerified: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/accounts`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
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
async function updateDatabaseRecord(userId, account, accessToken) {
  return new Promise((resolve, reject) => {
    const path = `/users/${userId}.json?access_token=${accessToken}`;
    const url = DATABASE_URL.replace('https://', '');
    const [hostname, ...pathParts] = url.split('/');
    const fullPath = '/' + pathParts.join('/') + path;

    const postData = JSON.stringify({
      email: account.email,
      role: account.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      isTestAccount: true,
      createdBy: 'setup-script'
    });

    const options = {
      hostname: hostname,
      path: fullPath,
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
          reject(new Error(`Database Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Main function - Use Firebase CLI to create users via web API
 */
async function main() {
  console.log('\n🚀 Starting test account creation using Firebase Web API...\n');
  
  // Use a simpler approach: create users via the web API using firebase-tools
  // We'll use the Firebase Web SDK approach but from Node.js
  
  console.log('📋 Creating accounts via Firebase Web API...\n');

  // For now, let's use a web-based approach
  // Create an HTML file that can be run in browser with admin privileges
  console.log('💡 Since direct Admin SDK access requires service account,');
  console.log('   we\'ll use the Firebase Web API approach.\n');
  console.log('📝 Please use one of these methods:\n');
  console.log('   1. Use the setup page: src/setup-test-accounts.html');
  console.log('   2. Or create accounts manually in Firebase Console\n');
  console.log('   OR run this command to create via Firebase CLI:\n');
  
  // Generate Firebase CLI commands
  console.log('   firebase auth:import users.json --hash-algo=SCRYPT \\');
  console.log('     --hash-key=base64key --salt-separator=base64separator \\');
  console.log('     --rounds=8 --mem-cost=14\n');
  
  console.log('📋 Test Account Credentials:');
  console.log('='.repeat(50));
  testAccounts.forEach(account => {
    console.log(`\n${account.role === 'admin' ? '👑' : '👤'} ${account.name}`);
    console.log(`   Email: ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log(`   Role: ${account.role}`);
  });
  console.log('\n' + '='.repeat(50));
  
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
