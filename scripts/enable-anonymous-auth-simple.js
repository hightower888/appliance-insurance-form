#!/usr/bin/env node
/**
 * Enable Anonymous Authentication in Firebase - Simple Version
 * 
 * This script provides instructions and opens the Firebase Console
 * since enabling auth providers programmatically requires complex API calls.
 * 
 * Usage: node scripts/enable-anonymous-auth-simple.js
 */

const { exec } = require('child_process');
const https = require('https');

const PROJECT_ID = 'appliance-bot';
const CONSOLE_URL = `https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers`;

console.log('🔐 Enabling Anonymous Authentication\n');
console.log('📋 Instructions:');
console.log('   1. Open the Firebase Console:');
console.log(`      ${CONSOLE_URL}\n`);
console.log('   2. Click on "Anonymous" in the Sign-in providers list');
console.log('   3. Toggle "Enable" to ON');
console.log('   4. Click "Save"\n');

// Try to open the browser automatically
const platform = process.platform;
let openCommand;

if (platform === 'darwin') {
  openCommand = 'open';
} else if (platform === 'win32') {
  openCommand = 'start';
} else {
  openCommand = 'xdg-open';
}

console.log('🌐 Opening Firebase Console in your browser...\n');

exec(`${openCommand} "${CONSOLE_URL}"`, (error) => {
  if (error) {
    console.log('⚠️  Could not open browser automatically.');
    console.log(`   Please visit: ${CONSOLE_URL}\n`);
  } else {
    console.log('✅ Browser opened!\n');
  }
  
  console.log('✅ After enabling, your application will be able to use anonymous sign-in.');
  console.log('   The form_fields permission error should be resolved.\n');
});
