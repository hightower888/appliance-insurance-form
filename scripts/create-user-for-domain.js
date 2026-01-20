/**
 * Create a User Account for Specific Domain
 * Creates a new user account that can be used to log in
 * 
 * Usage: node scripts/create-user-for-domain.js <email> <password> [role]
 * Example: node scripts/create-user-for-domain.js admin@sales-form.com Admin123! admin
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
let app;
try {
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
  const serviceAccount = require(serviceAccountPath);
  
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'appliance-bot',
    databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
  });
  console.log('✅ Firebase Admin initialized\n');
} catch (error) {
  console.error('❌ Error initializing:', error.message);
  console.log('\n💡 Make sure service-account-key.json exists');
  process.exit(1);
}

const db = admin.database();

// Simple password hash (SHA-256, matches auth-db.js)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createUser(email, password, role = 'admin') {
  try {
    // Generate user ID from email (MD5 hash for consistency)
    const userId = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    
    // Check if user already exists
    const userRef = db.ref(`users/${userId}`);
    const snapshot = await userRef.once('value');
    
    const passwordHash = hashPassword(password);
    
    if (snapshot.exists()) {
      console.log(`⚠️  User ${email} already exists, updating password and role...`);
      
      // Update existing user
      await userRef.update({
        email: email,
        passwordHash: passwordHash,
        role: role,
        status: 'active',
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ User updated successfully!`);
    } else {
      console.log(`✅ Creating new user: ${email}`);
      
      // Create new user
      await userRef.set({
        email: email,
        passwordHash: passwordHash,
        role: role,
        status: 'active',
        createdAt: new Date().toISOString(),
        userId: userId
      });
      
      console.log(`✅ User created successfully!`);
    }
    
    console.log(`\n📋 Login Credentials:`);
    console.log('='.repeat(50));
    console.log(`Email/Username: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${role}`);
    console.log(`User ID: ${userId}`);
    console.log('='.repeat(50));
    console.log(`\n✅ You can now log in at: https://sales-form-chi.vercel.app/auth/login`);
    
    return { success: true, userId, email };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message, email };
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('❌ Usage: node scripts/create-user-for-domain.js <email> <password> [role]');
  console.log('\nExample:');
  console.log('  node scripts/create-user-for-domain.js admin@sales-form.com Admin123! admin');
  console.log('  node scripts/create-user-for-domain.js user@example.com Password123 agent');
  console.log('\nRoles: admin, processor, agent (default: admin)');
  process.exit(1);
}

const email = args[0];
const password = args[1];
const role = args[2] || 'admin';

// Validate role
if (!['admin', 'processor', 'agent'].includes(role)) {
  console.log('❌ Invalid role. Must be: admin, processor, or agent');
  process.exit(1);
}

// Validate email format
if (!email.includes('@')) {
  console.log('❌ Invalid email format');
  process.exit(1);
}

// Validate password length
if (password.length < 6) {
  console.log('❌ Password must be at least 6 characters');
  process.exit(1);
}

createUser(email, password, role).then(() => {
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
