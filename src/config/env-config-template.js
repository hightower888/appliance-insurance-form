/**
 * Environment Configuration Template
 * 
 * This file is a template. For production, use Vercel's environment variables
 * and inject them via a build script or server-side rendering.
 * 
 * For local development, create this file by running:
 * node scripts/inject-env-config.js > src/config/env-config.js
 * 
 * Then add this script tag to your HTML files BEFORE auth.js/auth-db.js:
 * <script src="config/env-config.js"></script>
 */

(function() {
  'use strict';
  
  if (typeof window !== 'undefined') {
    // This will be populated by inject-env-config.js script
    // or by Vercel's server-side environment variable injection
    window.env = window.env || {};
    
    // If env vars are injected by server, use them
    // Otherwise, this will be empty and code will use fallback
    if (window.env.FIREBASE_API_KEY) {
      window.firebaseConfig = {
        apiKey: window.env.FIREBASE_API_KEY,
        authDomain: window.env.FIREBASE_AUTH_DOMAIN || "appliance-bot.firebaseapp.com",
        databaseURL: window.env.FIREBASE_DATABASE_URL || "https://appliance-bot-default-rtdb.firebaseio.com",
        projectId: window.env.FIREBASE_PROJECT_ID || "appliance-bot",
        storageBucket: window.env.FIREBASE_STORAGE_BUCKET || "appliance-bot.firebasestorage.app",
        messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID || "190852477335",
        appId: window.env.FIREBASE_APP_ID || "1:190852477335:web:b720a9a9217ae5fffe94d2"
      };
    }
  }
})();
