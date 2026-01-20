/**
 * Migration Script: Database Users → Firebase Auth
 * 
 * This script migrates users from database-based auth to Firebase Auth.
 * It creates Firebase Auth accounts for existing database users.
 * 
 * IMPORTANT: Users will need to reset their passwords after migration
 * since we can't retrieve their original passwords.
 * 
 * Usage: node scripts/migrate-users-to-firebase-auth.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
});

const db = admin.database();
const auth = admin.auth();

async function migrateUsers() {
  console.log('🔄 Starting user migration to Firebase Auth...\n');
  
  try {
    // Get all users from database
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('ℹ️  No users found in database');
      return;
    }
    
    const users = [];
    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      users.push({
        dbId: childSnapshot.key,
        ...userData
      });
    });
    
    console.log(`Found ${users.length} users in database\n`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        // Check if user already exists in Firebase Auth
        let firebaseUser;
        try {
          // Try to find by email
          firebaseUser = await auth.getUserByEmail(user.email);
          console.log(`⏭️  Skipping ${user.email} - already exists in Firebase Auth`);
          skipped++;
          continue;
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // User doesn't exist, create it
          } else {
            throw error;
          }
        }
        
        // Create user in Firebase Auth
        // Note: We can't set password without user interaction, so we'll create with a temporary password
        // User will need to reset password on first login
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
        
        firebaseUser = await auth.createUser({
          email: user.email,
          password: tempPassword,
          emailVerified: false,
          disabled: user.status === 'inactive'
        });
        
        // Update database record with Firebase Auth UID
        const userData = {
          email: user.email,
          role: user.role || 'agent',
          status: user.status || 'active',
          createdAt: user.createdAt || new Date().toISOString(),
          migratedAt: new Date().toISOString(),
          migratedFrom: user.dbId,
          needsPasswordReset: true
        };
        
        if (user.username) {
          userData.username = user.username;
        }
        
        // Move to new UID location, or keep old location and add uid field
        await db.ref(`users/${firebaseUser.uid}`).set(userData);
        
        // Optionally remove old location
        if (user.dbId !== firebaseUser.uid) {
          await db.ref(`users/${user.dbId}`).remove();
        }
        
        console.log(`✅ Migrated ${user.email} → ${firebaseUser.uid}`);
        console.log(`   Temporary password: ${tempPassword}`);
        console.log(`   ⚠️  User must reset password on first login\n`);
        
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrating ${user.email}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(60));
    
    if (migrated > 0) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('   - Users have temporary passwords');
      console.log('   - They must use "Forgot Password" on first login');
      console.log('   - Or admin can reset passwords in Firebase Console');
      console.log('\n💡 Next Steps:');
      console.log('   1. Notify users to reset their passwords');
      console.log('   2. Or reset passwords in Firebase Console');
      console.log('   3. Test login with migrated accounts');
    }
    
  } catch (error) {
    console.error('\n❌ Migration error:', error);
  } finally {
    process.exit(0);
  }
}

// Run migration
migrateUsers();
