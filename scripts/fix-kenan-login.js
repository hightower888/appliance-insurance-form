/**
 * Fix Kenan's Login Account
 * Checks if Kenan exists and has correct passwordHash, fixes if needed
 * 
 * Usage: node scripts/fix-kenan-login.js
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Error loading service account key:', error.message);
  console.error('   Make sure service-account-key.json exists in the project root');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://appliance-bot-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();

/**
 * Hash password using SHA-256 (matches auth-db.js)
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Find user by email or username (case-insensitive)
 */
async function findUser(identifier) {
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const normalizedId = identifier.toLowerCase().trim();
  let foundUser = null;
  let userId = null;
  
  snapshot.forEach((childSnapshot) => {
    const userData = childSnapshot.val();
    const emailMatch = userData.email && userData.email.toLowerCase() === normalizedId;
    const usernameMatch = userData.username && userData.username.toLowerCase() === normalizedId;
    
    if (emailMatch || usernameMatch) {
      foundUser = userData;
      userId = childSnapshot.key;
      return true; // Stop iteration
    }
  });
  
  return foundUser ? { userData: foundUser, userId } : null;
}

/**
 * Create or fix Kenan's account
 */
async function fixKenanAccount() {
  try {
    console.log('🔍 Checking for Kenan account...\n');
    
    // Try different possible identifiers
    const possibleIdentifiers = [
      'kenan@theflashteam.co.uk',
      'kenan',
      'Kenan'
    ];
    
    let kenanUser = null;
    let userId = null;
    let identifier = null;
    
    for (const id of possibleIdentifiers) {
      const result = await findUser(id);
      if (result) {
        kenanUser = result.userData;
        userId = result.userId;
        identifier = id;
        break;
      }
    }
    
    if (kenanUser) {
      console.log(`✅ Found Kenan account:`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Email: ${kenanUser.email || 'N/A'}`);
      console.log(`   Username: ${kenanUser.username || 'N/A'}`);
      console.log(`   Role: ${kenanUser.role || 'N/A'}`);
      console.log(`   Status: ${kenanUser.status || 'N/A'}`);
      console.log(`   Has passwordHash: ${!!kenanUser.passwordHash}`);
      console.log(`   Has password (old): ${!!kenanUser.password}`);
      
      // Check if passwordHash exists
      if (!kenanUser.passwordHash) {
        console.log('\n⚠️  Account missing passwordHash - adding it...');
        
        // Use password from setup-kenan-account.js
        const password = 'Dan-Ai-Mate';
        const passwordHash = hashPassword(password);
        
        await db.ref(`users/${userId}`).update({
          passwordHash: passwordHash,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`✅ Password hash added!`);
        console.log(`\n📋 Login Credentials:`);
        console.log(`   Email/Username: ${kenanUser.email || kenanUser.username || identifier}`);
        console.log(`   Password: ${password}`);
      } else {
        console.log('\n✅ Account has passwordHash - checking if it works...');
        
        // Test password hash with known password
        const testPassword = 'Dan-Ai-Mate';
        const testHash = hashPassword(testPassword);
        
        if (kenanUser.passwordHash === testHash) {
          console.log('✅ Password hash matches expected password (Dan-Ai-Mate)');
        } else {
          console.log('⚠️  Password hash does NOT match expected password');
          console.log('   The account may have a different password set.');
          console.log('   You may need to reset the password.');
        }
      }
      
      // Check account status
      if (kenanUser.status === 'inactive') {
        console.log('\n⚠️  Account status is INACTIVE - activating...');
        await db.ref(`users/${userId}`).update({
          status: 'active',
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Account activated!');
      }
      
    } else {
      console.log('❌ Kenan account not found in database');
      console.log('\n🔧 Creating new account...');
      
      // Create new account (using setup from setup-kenan-account.js)
      const email = 'kenan@theflashteam.co.uk';
      const password = 'Dan-Ai-Mate';
      const passwordHash = hashPassword(password);
      
      // Generate user ID (same as setup-kenan-account.js)
      const newUserId = email.replace(/[^a-zA-Z0-9]/g, '_');
      
      const userData = {
        email: email,
        passwordHash: passwordHash,
        role: 'admin',
        name: 'Kenan',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.ref(`users/${newUserId}`).set(userData);
      
      console.log(`✅ Created new account:`);
      console.log(`   User ID: ${newUserId}`);
      console.log(`   Email: ${email}`);
      console.log(`   Role: admin`);
      console.log(`   Status: active`);
      console.log(`\n📋 Login Credentials:`);
      console.log(`   Email/Username: ${email}`);
      console.log(`   Password: ${password}`);
    }
    
    console.log('\n✅ Kenan account is ready for login!');
    console.log('\n💡 Test login at: https://appliance-cover-form.vercel.app/login.html');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error fixing Kenan account:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await fixKenanAccount();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { fixKenanAccount };
