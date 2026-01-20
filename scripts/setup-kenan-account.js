/**
 * Setup Kenan's Admin Account
 * Removes test accounts and creates kenan@theflashteam.co.uk account
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');

// Load service account key
const serviceAccount = require(path.join(__dirname, '..', 'service-account-key.json'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://appliance-bot-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

/**
 * Hash password using SHA-256 (matches frontend)
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Remove all test accounts
 */
async function removeTestAccounts() {
  try {
    console.log('Removing test accounts...');
    
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (snapshot.exists()) {
      const updates = {};
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        const email = userData.email || '';
        
        // Remove test accounts
        if (email.includes('@test.com') || 
            email === 'admin@test.com' ||
            email === 'agent1@test.com' ||
            email === 'agent2@test.com' ||
            email === 'agent3@test.com' ||
            email === 'agent4@test.com' ||
            email === 'processor@test.com') {
          updates[childSnapshot.key] = null;
          console.log(`  Removing: ${email}`);
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await usersRef.update(updates);
        console.log(`✅ Removed ${Object.keys(updates).length} test accounts`);
      } else {
        console.log('✅ No test accounts found to remove');
      }
    } else {
      console.log('✅ No users found in database');
    }
  } catch (error) {
    console.error('Error removing test accounts:', error);
    throw error;
  }
}

/**
 * Create or update Kenan's account
 */
async function setupKenanAccount() {
  try {
    console.log('\nSetting up Kenan account...');
    
    const email = 'kenan@theflashteam.co.uk';
    const password = 'Dan-Ai-Mate';
    const hashedPassword = hashPassword(password);
    
    // Generate user ID (use email-based ID for consistency)
    const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
    
    const userData = {
      email: email,
      passwordHash: hashedPassword, // Use passwordHash to match login function
      role: 'admin',
      name: 'Kenan',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Check if user already exists
    const userRef = db.ref(`users/${userId}`);
    const existing = await userRef.once('value');
    
    if (existing.exists()) {
      // Update existing account
      await userRef.update({
        ...userData,
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ Updated existing account: ${email}`);
    } else {
      // Create new account
      await userRef.set(userData);
      console.log(`✅ Created new account: ${email}`);
    }
    
    console.log(`\n📋 Account Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: admin`);
    console.log(`   User ID: ${userId}`);
    
    return { userId, email };
  } catch (error) {
    console.error('Error setting up Kenan account:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Setting up Kenan account and removing test accounts...\n');
    
    // Remove test accounts
    await removeTestAccounts();
    
    // Setup Kenan account
    await setupKenanAccount();
    
    console.log('\n✅ Setup complete!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: kenan@theflashteam.co.uk');
    console.log('   Password: Dan-Ai-Mate');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { removeTestAccounts, setupKenanAccount };
