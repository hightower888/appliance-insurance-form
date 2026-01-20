#!/usr/bin/env node

/**
 * Inject Environment Variables into HTML
 * Creates a script tag that injects Firebase config from environment variables
 * 
 * This script should be run at build/deploy time to inject env vars into HTML
 * 
 * Usage: node scripts/inject-env-config.js > src/config/env-config.js
 */

require('dotenv').config({ path: '.env.local' });

const config = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "appliance-bot.firebaseapp.com",
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || "https://appliance-bot-default-rtdb.firebaseio.com",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "appliance-bot",
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "appliance-bot.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "190852477335",
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || "1:190852477335:web:b720a9a9217ae5fffe94d2"
};

// Generate JavaScript that sets window.env
const jsCode = `/**
 * Environment Configuration (Auto-generated)
 * DO NOT EDIT - This file is generated from environment variables
 * Generated: ${new Date().toISOString()}
 */

(function() {
  'use strict';
  
  if (typeof window !== 'undefined') {
    window.env = ${JSON.stringify(config, null, 2)};
    
    // Also set firebaseConfig directly for backward compatibility
    if (typeof window.firebaseConfig === 'undefined' && window.env.FIREBASE_API_KEY) {
      window.firebaseConfig = {
        apiKey: window.env.FIREBASE_API_KEY,
        authDomain: window.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: window.env.FIREBASE_DATABASE_URL,
        projectId: window.env.FIREBASE_PROJECT_ID,
        storageBucket: window.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: window.env.FIREBASE_APP_ID
      };
    }
  }
})();
`;

console.log(jsCode);
