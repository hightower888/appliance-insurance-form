#!/usr/bin/env node

/**
 * Update Firebase Authorized Domains
 * 
 * Updates the authorized domains list in Firebase Authentication
 * to include the new Vercel domain without "insurance"
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service-account-key.json');
const PROJECT_ID = 'appliance-bot';
const NEW_DOMAIN = 'appliance-cover-form.vercel.app';
const OLD_DOMAIN = 'appliance-form-app.vercel.app';

/**
 * Initialize Firebase Admin
 */
function initializeFirebase() {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID
      });
    }
    
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
    throw error;
  }
}

/**
 * Update authorized domains using Firebase Management API
 */
async function updateAuthorizedDomains() {
  console.log('🔧 Updating Firebase Authorized Domains...\n');
  
  try {
    // Note: Firebase Admin SDK doesn't directly support updating authorized domains
    // This requires using the Firebase Management REST API
    
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    console.log('⚠️  Firebase CLI/Admin SDK does not support updating authorized domains directly.');
    console.log('   Authorized domains must be updated via Firebase Console.\n');
    
    console.log('📋 Manual Steps Required:\n');
    console.log('1. Go to: https://console.firebase.google.com');
    console.log('2. Select project: appliance-bot');
    console.log('3. Go to: Authentication → Settings → Authorized domains');
    console.log(`4. Remove: ${OLD_DOMAIN} (if present)`);
    console.log(`5. Add: ${NEW_DOMAIN}`);
    console.log('6. Click "Save"\n');
    
    console.log('🔗 Direct Link:');
    console.log('https://console.firebase.google.com/project/appliance-bot/authentication/settings\n');
    
    // Alternative: Use REST API if we have the right permissions
    console.log('💡 Alternative: Using REST API...\n');
    
    // Get access token
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/firebase'
      ]
    });
    
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    if (!accessToken) {
      console.log('❌ Could not get access token. Manual update required.\n');
      return false;
    }
    
    console.log('✅ Got access token. Attempting to update via REST API...\n');
    
    // Note: The Firebase Management API for authorized domains is complex
    // and may require specific permissions. For now, we'll provide instructions.
    
    console.log('📝 Instructions provided above. Please update manually.\n');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please update authorized domains manually using the instructions above.\n');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Firebase Authorized Domains Update\n');
  console.log('=====================================\n');
  console.log(`📍 Project: ${PROJECT_ID}`);
  console.log(`➕ Add Domain: ${NEW_DOMAIN}`);
  console.log(`➖ Remove Domain: ${OLD_DOMAIN}\n`);
  
  try {
    initializeFirebase();
    await updateAuthorizedDomains();
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateAuthorizedDomains };
