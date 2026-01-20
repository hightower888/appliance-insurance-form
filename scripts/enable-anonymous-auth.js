#!/usr/bin/env node
/**
 * Enable Anonymous Authentication in Firebase
 * This script enables the Anonymous authentication provider using Firebase Management API
 * 
 * Usage: node scripts/enable-anonymous-auth.js
 */

const admin = require('firebase-admin');
const path = require('path');
const https = require('https');

// Load service account key
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Error loading service account key:', error.message);
  console.error('   Make sure service-account-key.json exists in the project root');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://appliance-bot-default-rtdb.firebaseio.com"
  });
}

const PROJECT_ID = 'appliance-bot';

/**
 * Get access token for Firebase Management API
 */
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const jwt = require('jsonwebtoken');
    
    // Create JWT for service account
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
        scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase'
      },
      serviceAccount.private_key,
      { algorithm: 'RS256' }
    );

    // Exchange JWT for access token
    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`;
    
    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            resolve(json.access_token);
          } else {
            reject(new Error('No access token in response: ' + JSON.stringify(json)));
          }
        } catch (e) {
          reject(new Error('Failed to parse token response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Enable Anonymous authentication provider
 */
async function enableAnonymousAuth() {
  try {
    console.log('🔐 Enabling Anonymous Authentication...\n');
    
    // Get access token
    console.log('📡 Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');
    
    // Get project number (required for API)
    console.log('📡 Getting project number...');
    const projectNumber = await getProjectNumber(accessToken);
    console.log(`✅ Project number: ${projectNumber}\n`);
    
    // Check current auth config
    console.log('📡 Checking current authentication configuration...');
    const currentConfig = await getAuthConfig(accessToken, projectNumber);
    
    // Check if anonymous is already enabled
    if (currentConfig && currentConfig.anonymous && currentConfig.anonymous.enabled) {
      console.log('✅ Anonymous authentication is already enabled!\n');
      return;
    }
    
    // Enable anonymous auth
    console.log('📡 Enabling Anonymous authentication provider...');
    await updateAuthConfig(accessToken, PROJECT_ID);
    
    console.log('✅ Anonymous authentication enabled successfully!\n');
    console.log('🎉 You can now use anonymous sign-in in your application.');
    
  } catch (error) {
    console.error('❌ Error enabling anonymous authentication:', error.message);
    
    if (error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
      console.error('\n💡 This requires Firebase Admin permissions.');
      console.error('   Make sure your service account has "Firebase Admin" role.');
      console.error('   Or enable it manually in Firebase Console:');
      console.error(`   https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers`);
    } else if (error.message.includes('404')) {
      console.error('\n💡 Project not found. Check your PROJECT_ID.');
    } else {
      console.error('\n💡 Alternative: Enable it manually in Firebase Console:');
      console.error(`   https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers`);
      console.error('   1. Go to Authentication > Sign-in method');
      console.error('   2. Click on "Anonymous"');
      console.error('   3. Enable it and click "Save"');
    }
    
    process.exit(1);
  }
}

/**
 * Get project number from project ID
 */
async function getProjectNumber(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'firebase.googleapis.com',
      port: 443,
      path: `/v1beta1/projects/${PROJECT_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            // Project number is in the name: projects/PROJECT_NUMBER
            const projectNumber = json.name.split('/')[1];
            resolve(projectNumber);
          } else {
            reject(new Error(`Failed to get project: ${res.statusCode} - ${data}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse project response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Get current authentication configuration
 */
async function getAuthConfig(accessToken, projectNumber) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: `/v2/projects/${projectNumber}/defaultSupportedIdpConfigs`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            resolve(json);
          } else if (res.statusCode === 404) {
            // No config yet, return null
            resolve(null);
          } else {
            reject(new Error(`Failed to get auth config: ${res.statusCode} - ${data}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse auth config response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Update authentication configuration to enable anonymous
 * Uses Firebase Identity Platform Admin API v2
 */
async function updateAuthConfig(accessToken, projectId) {
  return new Promise((resolve, reject) => {
    // Use the correct Identity Platform Admin API endpoint
    // Endpoint: /admin/v2/projects/{PROJECT_ID}/config
    const postData = JSON.stringify({
      signIn: {
        anonymous: {
          enabled: true
        }
      }
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: `/admin/v2/projects/${projectId}/config`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to update auth config: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Run the script
if (require.main === module) {
  enableAnonymousAuth()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { enableAnonymousAuth };
