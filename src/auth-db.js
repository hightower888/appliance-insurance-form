/**
 * Database-Based Authentication Module (For Testing)
 * Handles user authentication using Realtime Database instead of Firebase Auth
 */

// Firebase configuration
// Load from environment variables via config loader
// This ensures firebaseConfig is available globally and can be shared safely
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
let database;
let auth;

try {
  app = firebase.initializeApp(window.firebaseConfig);
  database = firebase.database();
  auth = firebase.auth();
  console.log('Firebase initialized for database auth');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Password hash using Web Crypto API - matches Node.js SHA-256
// This MUST match the hashPassword function in scripts/create-test-users-db.js
async function hashPasswordAsync(password) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Convert to hex string (matches Node.js crypto.createHash('sha256').digest('hex'))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: should not happen in modern browsers
  throw new Error('Web Crypto API not available');
}

// Current user session
let currentUser = null;

// Brute force protection
const loginAttempts = {
  // Store attempts in sessionStorage (clears on browser close)
  getAttempts: function(email) {
    try {
      const attempts = sessionStorage.getItem(`login_attempts_${email}`);
      return attempts ? JSON.parse(attempts) : { count: 0, lastAttempt: 0, lockedUntil: 0 };
    } catch (e) {
      return { count: 0, lastAttempt: 0, lockedUntil: 0 };
    }
  },
  
  recordAttempt: function(email, success) {
    try {
      const now = Date.now();
      let attempts = this.getAttempts(email);
      
      if (success) {
        // Reset on successful login
        attempts = { count: 0, lastAttempt: now, lockedUntil: 0 };
      } else {
        // Increment failed attempts
        attempts.count += 1;
        attempts.lastAttempt = now;
        
        // Lock after 5 failed attempts
        if (attempts.count >= 5) {
          // Lock for 15 minutes (900000 ms)
          attempts.lockedUntil = now + (15 * 60 * 1000);
        }
      }
      
      sessionStorage.setItem(`login_attempts_${email}`, JSON.stringify(attempts));
      return attempts;
    } catch (e) {
      console.error('Error recording login attempt:', e);
      return { count: 0, lastAttempt: 0, lockedUntil: 0 };
    }
  },
  
  isLocked: function(email) {
    const attempts = this.getAttempts(email);
    if (attempts.lockedUntil > 0) {
      const now = Date.now();
      if (now < attempts.lockedUntil) {
        return {
          locked: true,
          remainingTime: Math.ceil((attempts.lockedUntil - now) / 1000 / 60) // minutes
        };
      } else {
        // Lock expired, reset
        this.recordAttempt(email, true);
        return { locked: false };
      }
    }
    return { locked: false };
  },
  
  getRemainingAttempts: function(email) {
    const attempts = this.getAttempts(email);
    return Math.max(0, 5 - attempts.count);
  }
};

/**
 * Login user with username/email and password (database-based)
 */
async function loginUser(usernameOrEmail, password) {
  try {
    // Normalize identifier for brute force protection (use lowercase)
    const normalizedId = usernameOrEmail.toLowerCase().trim();
    
    // Check brute force protection
    const lockStatus = loginAttempts.isLocked(normalizedId);
    if (lockStatus.locked) {
      // Log account lockout
      if (typeof securityLogger !== 'undefined' && securityLogger.logAccountLocked) {
        await securityLogger.logAccountLocked(normalizedId, lockStatus.remainingTime);
      }
      throw new Error(`Account temporarily locked due to too many failed login attempts. Please try again in ${lockStatus.remainingTime} minute(s).`);
    }
    
    console.log('Attempting login for:', usernameOrEmail);
    
    // Hash the password
    const passwordHash = await hashPasswordAsync(password);
    console.log('Password hash generated');
    
    // Search for user in database
    const usersRef = database.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      console.error('No users found in database');
      loginAttempts.recordAttempt(normalizedId, false);
      throw new Error('Invalid username/email or password');
    }
    
    console.log('Users found in database, searching...');
    
    // Find user by username or email and password
    let foundUser = null;
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      
      // Check both passwordHash (new format) and password (old format for compatibility)
      const passwordMatch = userData.passwordHash === passwordHash || userData.password === passwordHash;
      
      // Check if login matches email (case-insensitive) or username (case-insensitive)
      const emailMatch = userData.email && userData.email.toLowerCase() === normalizedId;
      const usernameMatch = userData.username && userData.username.toLowerCase() === normalizedId;
      
      if ((emailMatch || usernameMatch) && passwordMatch) {
        foundUser = {
          uid: childSnapshot.key,
          email: userData.email,
          username: userData.username,
          role: userData.role || 'agent',
          ...userData
        };
        return true; // Stop iteration
      }
    });
    
    if (!foundUser) {
      console.error('User not found or password mismatch');
      const attempts = loginAttempts.recordAttempt(normalizedId, false);
      const remaining = loginAttempts.getRemainingAttempts(normalizedId);
      
      // Log failed login attempt
      if (typeof securityLogger !== 'undefined' && securityLogger.logLoginFailed) {
        await securityLogger.logLoginFailed(normalizedId, 'Invalid credentials', attempts.count);
        
        // Log brute force if account is about to be locked
        if (attempts.count >= 4) {
          await securityLogger.logBruteForceDetected(normalizedId, attempts.count);
        }
      }
      
      throw new Error(`Invalid username/email or password. ${remaining > 0 ? remaining + ' attempt(s) remaining.' : 'Account will be locked after 5 failed attempts.'}`);
    }
    
    if (foundUser.status === 'inactive') {
      loginAttempts.recordAttempt(normalizedId, false);
      throw new Error('Account is inactive');
    }
    
    // Successful login - reset attempts
    loginAttempts.recordAttempt(normalizedId, true);
    
    // Set current user
    currentUser = foundUser;
    
    // Store in sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Sign in anonymously to Firebase Auth for database access
    // This is required because database rules check auth != null (Firebase Auth)
    try {
      if (auth) {
        await auth.signInAnonymously();
        console.log('Firebase Auth anonymous sign-in successful for database access');
      }
    } catch (authError) {
      // If already signed in, ignore the error
      if (authError.code !== 'auth/operation-not-allowed' && !authError.message.includes('already')) {
        console.warn('Firebase Auth anonymous sign-in failed (non-critical):', authError);
      }
    }
    
    console.log('User logged in successfully:', foundUser.email || foundUser.username);
    
    // Log successful login
    if (typeof securityLogger !== 'undefined' && securityLogger.logLoginSuccess) {
      await securityLogger.logLoginSuccess(foundUser.uid, foundUser.email, foundUser.username);
    }
    
    // Redirect based on role
    // Use location.replace to prevent back button issues
    if (foundUser.role === 'admin') {
      window.location.replace('/admin');
    } else if (foundUser.role === 'processor') {
      window.location.replace('/processor');
    } else {
      window.location.replace('/form');
    }
    
    return foundUser;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout current user
 */
async function logoutUser() {
  try {
    const user = getCurrentUser();
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    console.log('User logged out');
    
    // Log logout
    if (user && typeof securityLogger !== 'undefined' && securityLogger.logLogout) {
      await securityLogger.logLogout(user.uid, user.email);
    }
    
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
function getCurrentUser() {
  if (currentUser) {
    return currentUser;
  }
  
  // Try to get from sessionStorage
  try {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  } catch (error) {
    console.error('Error reading session storage:', error);
  }
  
  return null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Get user role
 */
async function getUserRole(userId) {
  try {
    const userRef = database.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val().role || 'agent';
    }
    return 'agent';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'agent';
  }
}

/**
 * Check if current user is admin
 */
async function isAdmin() {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  return user.role === 'admin';
}

/**
 * Check if current user is agent
 */
async function isAgent() {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  return user.role === 'agent';
}

/**
 * Check if current user is processor
 */
async function isProcessor() {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  return user.role === 'processor';
}

/**
 * Check authentication and redirect if not authenticated
 */
async function checkAuth(redirectTo = 'login.html') {
  try {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      window.location.href = redirectTo;
      return false;
    }
    
    // Ensure Firebase Auth is signed in for database access
    // This is required because database rules check auth != null (Firebase Auth)
    if (auth && !auth.currentUser) {
      try {
        await auth.signInAnonymously();
        console.log('Firebase Auth anonymous sign-in successful (checkAuth)');
      } catch (authError) {
        // If already signed in or operation not allowed, ignore
        if (authError.code !== 'auth/operation-not-allowed' && 
            !authError.message.includes('already') &&
            authError.code !== 'auth/unauthorized-domain') {
          console.warn('Firebase Auth anonymous sign-in failed (non-critical):', authError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = redirectTo;
    return false;
  }
}

/**
 * Check if user has admin role and redirect if not
 */
async function checkRole(redirectTo = 'appliance_form.html') {
  const authenticated = await checkAuth();
  if (!authenticated) {
    return false;
  }
  
  const admin = await isAdmin();
  if (!admin) {
    // Log unauthorized access attempt
    const user = getCurrentUser();
    if (typeof securityLogger !== 'undefined' && securityLogger.logUnauthorizedAccess) {
      await securityLogger.logUnauthorizedAccess(redirectTo, user?.uid);
    }
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

/**
 * Get auth error message
 */
function getAuthErrorMessage(error) {
  // Handle both Error objects and strings
  const errorMessage = error.message || error.toString();
  
  const errorMessages = {
    'Invalid username/email or password': 'Invalid username/email or password. Please check your credentials and try again.',
    'Invalid email or password': 'Invalid username/email or password. Please check your credentials and try again.',
    'Account is inactive': 'Your account has been deactivated. Please contact administrator.',
    'No users found in database': 'No users configured. Please contact administrator.'
  };
  
  // Check for exact match first
  if (errorMessages[errorMessage]) {
    return errorMessages[errorMessage];
  }
  
  // Return the error message or a generic one
  return errorMessage || 'An error occurred during login. Please try again.';
}

/**
 * Auth state change listener (simplified for database auth)
 */
function onAuthStateChanged(callback) {
  // Check session storage on load
  const user = getCurrentUser();
  callback(user);
  
  // Listen for storage changes (for multi-tab support)
  window.addEventListener('storage', (e) => {
    if (e.key === 'currentUser') {
      currentUser = e.newValue ? JSON.parse(e.newValue) : null;
      callback(currentUser);
    }
  });
}

// Make database globally available for other scripts
if (typeof window !== 'undefined') {
  window.database = database;
}

// Initialize: Load user from sessionStorage on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (user) {
      console.log('User session restored:', user.email);
    }
  });
}
