/**
 * Firebase Authentication Module
 * Handles user authentication, session management, and role-based access control
 * 
 * NOTE: This file (auth.js) is legacy and should not be loaded. Use auth-db.js instead.
 * This is kept for backward compatibility only.
 */

// Firebase configuration
// Load from environment variables via config loader
// Note: config/firebase-config.js must be loaded before this file
if (typeof window.firebaseConfig === 'undefined') {
  // Try to use config loader if available
  if (typeof getFirebaseConfig === 'function') {
    window.firebaseConfig = getFirebaseConfig();
  } else {
    // Fallback: Try to read from window.env (injected by server)
    if (window.env && window.env.FIREBASE_API_KEY) {
      window.firebaseConfig = {
        apiKey: window.env.FIREBASE_API_KEY,
        authDomain: window.env.FIREBASE_AUTH_DOMAIN || "appliance-bot.firebaseapp.com",
        databaseURL: window.env.FIREBASE_DATABASE_URL || "https://appliance-bot-default-rtdb.firebaseio.com",
        projectId: window.env.FIREBASE_PROJECT_ID || "appliance-bot",
        storageBucket: window.env.FIREBASE_STORAGE_BUCKET || "appliance-bot.firebasestorage.app",
        messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID || "190852477335",
        appId: window.env.FIREBASE_APP_ID || "1:190852477335:web:b720a9a9217ae5fffe94d2"
      };
    } else {
      // Last resort: Development fallback (will show warning)
      console.error('⚠️ CRITICAL: Firebase API key not found in environment variables!');
      console.error('⚠️ Please ensure environment variables are set in Vercel dashboard or .env.local file.');
      console.error('⚠️ Using placeholder - Firebase will not work until configured.');
      window.firebaseConfig = {
        apiKey: "ENV_VAR_NOT_SET",
        authDomain: "appliance-bot.firebaseapp.com",
        databaseURL: "https://appliance-bot-default-rtdb.firebaseio.com",
        projectId: "appliance-bot",
        storageBucket: "appliance-bot.firebasestorage.app",
        messagingSenderId: "190852477335",
        appId: "1:190852477335:web:b720a9a9217ae5fffe94d2"
      };
    }
  }
}
// Use window.firebaseConfig directly to avoid duplicate declaration conflicts

// Initialize Firebase
let app;
let auth;
let database;

try {
  app = firebase.initializeApp(window.firebaseConfig);
  auth = firebase.auth();
  database = firebase.database();
  
  // Set persistence based on environment
  // LOCAL: Use LOCAL persistence for development
  // PRODUCTION: Use SESSION persistence for hosted environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const persistenceMode = isLocalhost 
    ? firebase.auth.Auth.Persistence.LOCAL 
    : firebase.auth.Auth.Persistence.SESSION;
  
  auth.setPersistence(persistenceMode)
    .then(() => {
      console.log(`Auth persistence set to ${isLocalhost ? 'LOCAL' : 'SESSION'} (${window.location.hostname})`);
    })
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
} catch (error) {
  console.error('Firebase initialization error:', error);
}

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Promise that resolves with user credential
 */
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log('User logged in:', user.email);
    
    // Sync user data with database (create/update user record)
    await syncUserToDatabase(user);
    
    // Log successful login
    if (typeof securityLogger !== 'undefined' && securityLogger.logLoginSuccess) {
      await securityLogger.logLoginSuccess(user.uid, user.email, null);
    }
    
    // Check user role and redirect accordingly
    const role = await getUserRole(user.uid);
    if (role === 'admin') {
      window.location.href = '/admin';
    } else if (role === 'processor') {
      window.location.href = '/processor';
    } else {
      window.location.href = '/form';
    }
    
    return userCredential;
  } catch (error) {
    console.error('Login error:', error);
    
    // Log failed login attempt
    if (typeof securityLogger !== 'undefined' && securityLogger.logLoginFailed) {
      await securityLogger.logLoginFailed(email, error.message || 'Invalid credentials', 0);
    }
    
    throw error;
  }
}

/**
 * Sync user authentication state with database
 * Creates or updates user record in database
 * @param {Object} user - Firebase user object
 */
async function syncUserToDatabase(user) {
  try {
    const userRef = database.ref(`users/${user.uid}`);
    const snapshot = await userRef.once('value');
    
    if (!snapshot.exists()) {
      // User doesn't exist in database, create record with default role
      await userRef.set({
        email: user.email,
        role: 'agent', // Default role
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      });
    } else {
      // Update last login time
      await userRef.update({
        lastLoginAt: new Date().toISOString(),
        email: user.email // Update email in case it changed
      });
    }
  } catch (error) {
    console.error('Error syncing user to database:', error);
    // Don't throw - this is not critical for login
  }
}

/**
 * Logout current user
 * @returns {Promise} - Promise that resolves when logout is complete
 */
async function logoutUser() {
  try {
    const user = getCurrentUserSync();
    await auth.signOut();
    console.log('User logged out');
    
    // Log logout
    if (user && typeof securityLogger !== 'undefined' && securityLogger.logLogout) {
      await securityLogger.logLogout(user.uid, user.email);
    }
    
    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise} - Promise that resolves when email is sent
 */
async function sendPasswordReset(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    console.log('Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

/**
 * Get current authenticated user with role info
 * @returns {Object|null} - Current user with role or null if not authenticated
 */
async function getCurrentUser() {
  if (!auth || !auth.currentUser) {
    return null;
  }
  
  const firebaseUser = auth.currentUser;
  const role = await getUserRole(firebaseUser.uid);
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    role: role,
    ...firebaseUser
  };
}

/**
 * Get current authenticated user (synchronous, without role)
 * @returns {Object|null} - Current Firebase user or null
 */
function getCurrentUserSync() {
  return auth ? auth.currentUser : null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
function isAuthenticated() {
  return auth && auth.currentUser !== null;
}

/**
 * Get user role from database
 * @param {string} userId - User ID
 * @returns {Promise<string>} - User role ('admin' or 'agent')
 */
async function getUserRole(userId) {
  try {
    const roleSnapshot = await database.ref(`users/${userId}/role`).once('value');
    return roleSnapshot.val() || 'agent'; // Default to 'agent' if no role set
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'agent'; // Default to 'agent' on error
  }
}

/**
 * Check if current user is admin
 * @returns {Promise<boolean>} - True if user is admin
 */
async function isAdmin() {
  if (!isAuthenticated()) {
    return false;
  }
  
  const user = getCurrentUserSync();
  if (!user) return false;
  const role = await getUserRole(user.uid);
  return role === 'admin';
}

/**
 * Check if current user is agent
 * @returns {Promise<boolean>} - True if user is agent
 */
async function isAgent() {
  if (!isAuthenticated()) {
    return false;
  }
  
  const user = getCurrentUserSync();
  if (!user) return false;
  const role = await getUserRole(user.uid);
  return role === 'agent';
}

/**
 * Check if current user is processor
 * @returns {Promise<boolean>} - True if user is processor
 */
async function isProcessor() {
  if (!isAuthenticated()) {
    return false;
  }
  
  const user = getCurrentUserSync();
  if (!user) return false;
  const role = await getUserRole(user.uid);
  return role === 'processor';
}

/**
 * Check authentication and redirect if not authenticated
 * @param {string} redirectTo - Page to redirect to if not authenticated (default: login.html)
 * @returns {Promise<boolean>} - True if authenticated
 */
/**
 * Check authentication and redirect if not authenticated
 * @param {string} redirectTo - Page to redirect to if not authenticated (default: login.html)
 * @returns {Promise<boolean>} - True if authenticated
 */
async function checkAuth(redirectTo = 'login.html') {
  // Wait a bit for auth to initialize
  if (!auth) {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (!auth) {
      window.location.href = redirectTo;
      return false;
    }
  }
  
  // Check current user synchronously first
  if (auth.currentUser) {
    return true;
  }
  
  // If no current user, wait for auth state to settle
  return new Promise((resolve) => {
    let resolved = false;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (resolved) return; // Prevent multiple calls
      resolved = true;
      unsubscribe();
      
      if (!user) {
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('login.html')) {
          window.location.href = redirectTo;
        }
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    // Timeout after 2 seconds to prevent hanging
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        if (!auth.currentUser && !window.location.pathname.includes('login.html')) {
          window.location.href = redirectTo;
        }
        resolve(false);
      }
    }, 2000);
  });
}

/**
 * Check if user has admin role and redirect if not
 * @param {string} redirectTo - Page to redirect to if not admin (default: appliance_form.html)
 * @returns {Promise<boolean>} - True if user is admin
 */
async function checkRole(redirectTo = 'appliance_form.html') {
  const authenticated = await checkAuth();
  if (!authenticated) {
    return false;
  }
  
  const admin = await isAdmin();
  if (!admin) {
    // Log unauthorized access attempt
    const user = getCurrentUserSync();
    if (typeof securityLogger !== 'undefined' && securityLogger.logUnauthorizedAccess) {
      await securityLogger.logUnauthorizedAccess(redirectTo, user?.uid);
    }
    window.location.href = redirectTo;
    return false;
  }
  
  return true;
}

/**
 * Get user-friendly error message from Firebase auth error
 * @param {Error} error - Firebase auth error
 * @returns {string} - User-friendly error message
 */
function getAuthErrorMessage(error) {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Monitor auth state changes
 * @param {Function} callback - Callback function called when auth state changes
 * @returns {Function} - Unsubscribe function
 */
function onAuthStateChanged(callback) {
  if (!auth) {
    console.error('Auth not initialized');
    return () => {};
  }
  
  return auth.onAuthStateChanged(callback);
}

// Make database and auth globally available for other scripts
if (typeof window !== 'undefined') {
  window.database = database;
  window.auth = auth;
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loginUser,
    logoutUser,
    sendPasswordReset,
    getCurrentUser,
    isAuthenticated,
    getUserRole,
    isAdmin,
    isAgent,
    isProcessor,
    checkAuth,
    checkRole,
    getAuthErrorMessage,
    onAuthStateChanged,
    auth,
    database
  };
}
