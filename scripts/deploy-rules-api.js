/**
 * Deploy Database Rules using Firebase Management API
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccount = require('../service-account-key.json');
const rulesPath = path.join(__dirname, '..', 'database.rules.json');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
const rules = JSON.parse(rulesContent);

async function deployRules() {
  try {
    console.log('📋 Reading database rules from:', rulesPath);
    console.log('🚀 Deploying database rules via Management API...');
    
    // Authenticate with service account
    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/cloud-platform']
    );
    
    await auth.authorize();
    console.log('✅ Authenticated with service account');
    
    // Get access token
    const accessToken = await auth.getAccessToken();
    
    // Firebase project ID
    const projectId = 'appliance-bot';
    const databaseId = 'appliance-bot-default-rtdb';
    
    // Use Firebase Realtime Database REST API to update rules
    const url = `https://${projectId}-default-rtdb.firebaseio.com/.settings/rules.json?access_token=${accessToken}`;
    
    // For Realtime Database, we need to use the Management API
    // Let's try the Realtime Database Admin API endpoint
    const managementApi = google.firebasedatabase('v1beta');
    
    const response = await managementApi.projects.locations.instances.update({
      name: `projects/${projectId}/locations/-/instances/${databaseId}`,
      requestBody: {
        databaseUrl: `https://${databaseId}.firebaseio.com`,
        rules: rulesContent
      },
      auth: auth
    });
    
    console.log('✅ Rules deployed successfully!');
    console.log('📝 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error deploying rules:', error.message);
    
    // Fallback: Use direct REST API call
    console.log('\n🔄 Trying alternative method...');
    
    try {
      const auth = new google.auth.JWT(
        serviceAccount.client_email,
        null,
        serviceAccount.private_key,
        ['https://www.googleapis.com/auth/firebase']
      );
      
      await auth.authorize();
      const accessToken = await auth.getAccessToken();
      
      // Use Firebase Realtime Database REST API
      const projectId = 'appliance-bot';
      const url = `https://${projectId}-default-rtdb.firebaseio.com/.settings/rules.json?access_token=${accessToken}`;
      
      const fetch = require('node-fetch');
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: rulesContent
      });
      
      if (response.ok) {
        console.log('✅ Rules deployed via REST API!');
      } else {
        const errorText = await response.text();
        console.error('❌ REST API error:', errorText);
        throw new Error(`Failed to deploy: ${response.status} ${response.statusText}`);
      }
    } catch (fallbackError) {
      console.error('❌ Fallback method also failed:', fallbackError.message);
      console.log('\n📋 Manual deployment required:');
      console.log('1. Go to: https://console.firebase.google.com/project/appliance-bot/database');
      console.log('2. Click "Rules" tab');
      console.log('3. Copy contents of database.rules.json');
      console.log('4. Paste and click "Publish"');
      process.exit(1);
    }
  }
}

deployRules();
