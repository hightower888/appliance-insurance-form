/**
 * Update Database Rules using Firebase Admin SDK
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let app;
try {
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

async function updateRules() {
  try {
    // Read rules file
    const rulesPath = path.join(__dirname, '..', 'database.rules.json');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const rulesJson = JSON.parse(rulesContent);
    
    console.log('📋 Rules file loaded');
    console.log('📤 Updating database rules...\n');
    
    // Firebase Admin SDK doesn't have direct rules update method
    // We need to use the REST API
    const https = require('https');
    const accessToken = await app.options.credential.getAccessToken();
    
    const rulesString = JSON.stringify(rulesJson.rules);
    const postData = JSON.stringify({
      rules: rulesJson.rules
    });
    
    // Use the correct endpoint for Realtime Database rules
    const databaseUrl = 'appliance-bot-default-rtdb.firebaseio.com';
    const options = {
      hostname: databaseUrl,
      path: `/.settings/rules.json?access_token=${accessToken.access_token}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Rules updated successfully!\n');
            resolve(JSON.parse(data));
          } else {
            console.error(`❌ Error ${res.statusCode}: ${data}`);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

updateRules()
  .then(() => {
    console.log('✅ Database rules deployed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to deploy rules:', error.message);
    console.log('\n💡 Alternative: Update rules manually in Firebase Console');
    process.exit(1);
  });
