#!/usr/bin/env node

/**
 * Grant Firebase Admin Access to Developer
 * 
 * Grants IAM permissions to a developer email for Firebase/Google Cloud project
 * 
 * Usage: node scripts/grant-firebase-admin-access.js <email>
 * Example: node scripts/grant-firebase-admin-access.js kennen_02@icloud.com
 * 
 * Requirements:
 * - Must be run with a user account that has "Project Owner" or "IAM Admin" role
 * - Run: gcloud auth login (with your admin account)
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const PROJECT_ID = 'appliance-bot';
const DEVELOPER_EMAIL = process.argv[2] || 'kennen_02@icloud.com';

// IAM Roles to grant (comprehensive admin access)
const ROLES = [
  'roles/owner',                          // Full project ownership
  'roles/firebase.admin',                 // Firebase Admin
  'roles/cloudfunctions.admin',           // Cloud Functions Admin
  'roles/datastore.owner',                // Firestore/Datastore Owner
  'roles/firebase.realtimeDatabaseAdmin', // Realtime Database Admin
  'roles/iam.serviceAccountUser',         // Service Account User
  'roles/storage.admin',                  // Cloud Storage Admin
  'roles/compute.admin',                  // Compute Engine Admin (for Cloud Functions)
];

console.log('🔐 Granting Firebase Admin Access to Developer\n');
console.log(`Project: ${PROJECT_ID}`);
console.log(`Developer Email: ${DEVELOPER_EMAIL}\n`);

// Check if gcloud is installed
try {
  execSync('gcloud --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ ERROR: gcloud CLI is not installed');
  console.error('   Install: https://cloud.google.com/sdk/docs/install');
  process.exit(1);
}

// Check if user is logged in
let currentAccount;
try {
  currentAccount = execSync('gcloud config get-value account', { encoding: 'utf8' }).trim();
  if (!currentAccount || currentAccount.includes('gserviceaccount.com')) {
    throw new Error('Not logged in with user account');
  }
  console.log(`✅ Using account: ${currentAccount}\n`);
} catch (error) {
  console.error('❌ ERROR: Not logged in with a user account');
  console.error('   Please login first:');
  console.error('   gcloud auth login');
  process.exit(1);
}

// Set project
try {
  execSync(`gcloud config set project ${PROJECT_ID}`, { stdio: 'ignore' });
  console.log(`✅ Project set to: ${PROJECT_ID}\n`);
} catch (error) {
  console.error(`❌ ERROR: Failed to set project`);
  process.exit(1);
}

// Grant each role
console.log('📝 Granting IAM roles...\n');
let successCount = 0;
let errorCount = 0;

for (const role of ROLES) {
  try {
    console.log(`   Granting ${role}...`);
    execSync(
      `gcloud projects add-iam-policy-binding ${PROJECT_ID} ` +
      `--member="user:${DEVELOPER_EMAIL}" ` +
      `--role="${role}" ` +
      `--condition=None`,
      { stdio: 'inherit' }
    );
    console.log(`   ✅ ${role} granted\n`);
    successCount++;
  } catch (error) {
    console.error(`   ⚠️  Failed to grant ${role}: ${error.message}\n`);
    errorCount++;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Summary');
console.log('='.repeat(60));
console.log(`✅ Successfully granted: ${successCount} roles`);
if (errorCount > 0) {
  console.log(`⚠️  Failed: ${errorCount} roles`);
}
console.log('\n');

// Additional instructions
console.log('📋 Next Steps:');
console.log('1. Developer should check email for invitation');
console.log('2. Developer should accept Google Cloud invitation');
console.log('3. Developer can now access:');
console.log(`   - Firebase Console: https://console.firebase.google.com/project/${PROJECT_ID}`);
console.log(`   - Google Cloud Console: https://console.cloud.google.com/home/dashboard?project=${PROJECT_ID}`);
console.log('4. Developer can deploy using:');
console.log('   firebase login');
console.log('   firebase deploy --project ' + PROJECT_ID);
console.log('\n');

if (errorCount > 0) {
  console.log('⚠️  Some roles failed to grant. You may need to:');
  console.log('   - Verify you have "Project Owner" or "IAM Admin" role');
  console.log('   - Grant roles manually via Google Cloud Console');
  console.log(`   - URL: https://console.cloud.google.com/iam-admin/iam?project=${PROJECT_ID}`);
  process.exit(1);
} else {
  console.log('✅ All permissions granted successfully!');
}
