/**
 * Firebase Configuration Loader
 * Loads Firebase config from environment variables or window injection
 * 
 * Priority:
 * 1. window.firebaseConfig (injected by Vercel/build system)
 * 2. window.env (injected via script tag)
 * 3. Development fallback (should not be used in production)
 */

/**
 * Get Firebase configuration
 * @returns {Object} Firebase configuration object
 */
export function getFirebaseConfig() {
  // Priority 1: Check if config already exists (injected by build system/Vercel)
  if (typeof window !== 'undefined' && window.firebaseConfig) {
    return window.firebaseConfig;
  }

  // Priority 2: Check for window.env (injected via script tag from server)
  if (typeof window !== 'undefined' && window.env && window.env.FIREBASE_API_KEY) {
    return {
      apiKey: window.env.FIREBASE_API_KEY,
      authDomain: window.env.FIREBASE_AUTH_DOMAIN || "appliance-bot.firebaseapp.com",
      databaseURL: window.env.FIREBASE_DATABASE_URL || "https://appliance-bot-default-rtdb.firebaseio.com",
      projectId: window.env.FIREBASE_PROJECT_ID || "appliance-bot",
      storageBucket: window.env.FIREBASE_STORAGE_BUCKET || "appliance-bot.firebasestorage.app",
      messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID || "190852477335",
      appId: window.env.FIREBASE_APP_ID || "1:190852477335:web:b720a9a9217ae5fffe94d2"
    };
  }

  // Priority 3: Development fallback (warns in console)
  if (typeof window !== 'undefined') {
    console.warn('⚠️ Firebase config not found in environment. Using development fallback.');
    console.warn('⚠️ For production, ensure environment variables are set in Vercel dashboard.');
  }

  // Development fallback - should be replaced by environment variables
  return {
    apiKey: "DEVELOPMENT_KEY_REPLACE_WITH_ENV_VAR",
    authDomain: "appliance-bot.firebaseapp.com",
    databaseURL: "https://appliance-bot-default-rtdb.firebaseio.com",
    projectId: "appliance-bot",
    storageBucket: "appliance-bot.firebasestorage.app",
    messagingSenderId: "190852477335",
    appId: "1:190852477335:web:b720a9a9217ae5fffe94d2"
  };
}

/**
 * Initialize Firebase config in window (for backward compatibility)
 * This maintains the existing pattern used by auth.js and auth-db.js
 */
export function initializeFirebaseConfig() {
  if (typeof window !== 'undefined' && typeof window.firebaseConfig === 'undefined') {
    window.firebaseConfig = getFirebaseConfig();
  }
  return window.firebaseConfig;
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  initializeFirebaseConfig();
}
