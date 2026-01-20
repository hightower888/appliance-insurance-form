/**
 * Simple Customer CSV Export
 * Exports customer data from Firebase Realtime Database
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "appliance-bot.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || "https://appliance-bot-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "appliance-bot",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "appliance-bot.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "190852477335",
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || "1:190852477335:web:b720a9a9217ae5fffe94d2"
};

// Validate API key is set
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  console.error('❌ ERROR: FIREBASE_API_KEY not found in environment variables!');
  console.error('   Please create .env.local file with your Firebase API key.');
  console.error('   See .env.example for template.');
  process.exit(1);
}

async function exportCustomers() {
  console.log('🚀 Exporting customers to CSV...\n');

  try {
    // Initialize Firebase (using dynamic import to avoid module issues)
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, get } = await import('firebase/database');

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    console.log('📖 Reading customers from Firebase...');

    // Read all users from database
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      console.log('❌ No customers found in database');
      return;
    }

    const users = snapshot.val();
    const userCount = Object.keys(users).length;
    console.log(`✅ Found ${userCount} customers\n`);

    // Create CSV header
    const headers = [
      'uid',
      'email',
      'username',
      'role',
      'status',
      'password_hash',
      'first_name',
      'last_name',
      'phone',
      'company',
      'notes'
    ];

    const csvLines = [];
    csvLines.push(headers.join(','));

    // Add each customer as a row
    for (const [uid, userData] of Object.entries(users)) {
      const row = [
        uid,
        userData.email || '',
        userData.username || '',
        userData.role || 'agent',
        userData.status || 'active',
        userData.passwordHash ? 'YES' : 'NO',
        userData.firstName || userData.first_name || '',
        userData.lastName || userData.last_name || '',
        userData.phone || '',
        userData.company || '',
        userData.notes || ''
      ];

      // Escape fields containing commas or quotes
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });

      csvLines.push(escapedRow.join(','));
    }

    const csvContent = csvLines.join('\n');

    // Write to file
    const fs = await import('fs');
    const path = await import('path');

    const outputPath = path.default.join(process.cwd(), 'customers.csv');
    fs.default.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`📄 CSV file created: ${outputPath}`);
    console.log(`📊 Total customers exported: ${userCount}`);
    console.log('\n--- CSV PREVIEW ---');

    // Show first few lines
    const previewLines = csvLines.slice(0, Math.min(6, csvLines.length));
    console.log(previewLines.join('\n'));

    if (csvLines.length > 6) {
      console.log(`... and ${csvLines.length - 6} more lines`);
    }

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('   - Firebase package not installed');
    console.log('   - Database rules blocking access');
    console.log('   - Network connectivity issues');
  }
}

// Check if Firebase is available
async function checkFirebase() {
  try {
    await import('firebase/app');
    return true;
  } catch {
    return false;
  }
}

// Run export
async function main() {
  const hasFirebase = await checkFirebase();

  if (!hasFirebase) {
    console.log('❌ Firebase package not available');
    console.log('📦 Install with: npm install firebase');
    return;
  }

  await exportCustomers();
}

main();