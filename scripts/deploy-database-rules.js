/**
 * Deploy Database Rules using Firebase Admin SDK
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
});

// Read database rules
const rulesPath = path.join(__dirname, '..', 'database.rules.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
const rules = JSON.parse(rulesContent);

// Get database instance
const db = admin.database();

async function deployRules() {
  try {
    console.log('📋 Reading database rules from:', rulesPath);
    console.log('🚀 Deploying database rules...');
    
    // Note: Firebase Admin SDK doesn't have a direct method to deploy rules
    // We need to use the REST API or Firebase CLI
    // However, we can validate the rules first
    
    console.log('✅ Rules file is valid JSON');
    console.log('📝 Rules structure:');
    console.log(JSON.stringify(rules, null, 2));
    
    // For actual deployment, we need to use Firebase CLI or REST API
    // Since we can't use CLI interactively, let's provide instructions
    console.log('\n⚠️  Firebase Admin SDK cannot deploy rules directly.');
    console.log('📋 Please use one of these methods:');
    console.log('\n1. Firebase Console:');
    console.log('   - Go to: https://console.firebase.google.com/project/appliance-bot/database');
    console.log('   - Click "Rules" tab');
    console.log('   - Copy the contents of database.rules.json');
    console.log('   - Paste and click "Publish"');
    console.log('\n2. Firebase CLI (if authenticated):');
    console.log('   firebase deploy --only database');
    console.log('\n3. REST API (using service account):');
    console.log('   Use the Firebase Management API to update rules');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployRules();
