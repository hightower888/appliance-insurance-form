/**
 * Cloud Function to create users without signing in as them
 * Uses Firebase Admin SDK to create users while keeping admin logged in
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();
const db = admin.database();

/**
 * Hash password using SHA-256 (matches auth-db.js)
 * @param {string} password - Plain text password
 * @returns {string} - Hex-encoded SHA-256 hash
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * HTTP Cloud Function to create a user
 * POST /createUser
 * Body: { username, email, password, role, adminUid }
 */
exports.createUser = functions.https.onRequest(async (req, res) => {
  // Set CORS headers FIRST - before any response
  const origin = req.headers.origin || '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '3600');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { username, email, password, role, adminUid } = req.body;

    // Validate input
    if (!username || !password || !role) {
      res.status(400).json({ error: 'Missing required fields: username, password, role' });
      return;
    }

    // CRITICAL: Require adminUid and verify admin role
    if (!adminUid) {
      res.status(400).json({ error: 'Missing required field: adminUid' });
      return;
    }

    // Verify admin is making the request (check if adminUid has admin role)
    const adminRef = db.ref(`users/${adminUid}`);
    const adminSnapshot = await adminRef.once('value');
    const adminData = adminSnapshot.val();
    
    if (!adminData) {
      res.status(403).json({ error: 'Unauthorized: Admin user not found in database' });
      return;
    }
    
    if (adminData.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized: Admin role required. Current role: ' + (adminData.role || 'none') });
      return;
    }

    // Generate unique system email if not provided
    let systemEmail = email;
    if (!systemEmail) {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      systemEmail = `${username}-${timestamp}-${randomSuffix}@appliance-bot.local`;
    }

    // Check if email already exists
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(systemEmail);
      res.status(400).json({ error: 'Email already exists in Firebase Auth' });
      return;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create user in Firebase Auth (doesn't sign in)
    firebaseUser = await auth.createUser({
      email: systemEmail,
      password: password,
      emailVerified: false,
      displayName: username
    });

    const userId = firebaseUser.uid;

    // Hash password for auth-db.js compatibility
    const passwordHash = hashPassword(password);

    // Create user record in database
    const userData = {
      username: username,
      role: role,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: adminUid || 'system',
      name: username,
      passwordHash: passwordHash // Required for auth-db.js login
    };

    if (email) {
      userData.email = email;
    } else {
      userData.email = systemEmail;
      userData.systemEmail = true;
    }

    await db.ref(`users/${userId}`).set(userData);

    // Log account creation if security logger is available
    try {
      await db.ref('security_logs').push({
        eventType: 'account_created',
        severity: 'info',
        timestamp: new Date().toISOString(),
        userId: userId,
        email: systemEmail,
        role: role,
        createdBy: adminUid || 'system'
      });
    } catch (logError) {
      console.error('Error logging account creation:', logError);
    }

    res.status(200).json({
      success: true,
      userId: userId,
      email: systemEmail,
      username: username,
      role: role
    });

  } catch (error) {
    console.error('Error creating user:', error);
    // Ensure CORS headers are set on error responses too
    const origin = req.headers.origin || '*';
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(500).json({ 
      error: 'Failed to create user',
      message: error.message 
    });
  }
});
