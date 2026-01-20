/**
 * Export Customers to CSV
 * Exports all customer data from Firebase Realtime Database to CSV format
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: firebaseConfig.projectId,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

async function exportCustomersToCSV() {
  try {
    // Initialize Firebase Admin if service account is available
    let db;
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: firebaseConfig.databaseURL
      });
      db = admin.database();
      console.log('Connected to Firebase Admin');
    } catch (error) {
      console.log('Firebase Admin not available, using client SDK');
      // Fallback to client SDK for read-only access
      return exportCustomersReadOnly();
    }

    // Read all users from database
    console.log('Reading customers from database...');
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');

    if (!snapshot.exists()) {
      console.log('No users found in database');
      return;
    }

    const users = snapshot.val();
    console.log(`Found ${Object.keys(users).length} users`);

    // Convert to CSV format
    const csvLines = [];
    csvLines.push('uid,email,username,role,status,created_at,updated_at,password_hash,first_name,last_name,phone,company,notes');

    for (const [uid, userData] of Object.entries(users)) {
      const row = [
        uid,
        userData.email || '',
        userData.username || '',
        userData.role || 'agent',
        userData.status || 'active',
        userData.createdAt || userData.created_at || '',
        userData.updatedAt || userData.updated_at || '',
        userData.passwordHash ? 'YES' : 'NO', // Don't export actual hash
        userData.firstName || userData.first_name || '',
        userData.lastName || userData.last_name || '',
        userData.phone || '',
        userData.company || '',
        userData.notes || ''
      ];

      // Escape commas and quotes in fields
      const escapedRow = row.map(field =>
        `"${String(field).replace(/"/g, '""')}"`
      );

      csvLines.push(escapedRow.join(','));
    }

    // Write to CSV file
    const csvContent = csvLines.join('\n');
    const outputPath = path.join(__dirname, '..', 'customers_export.csv');

    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`✅ CSV export completed: ${csvLines.length - 1} customers exported to ${outputPath}`);

    // Also print to console
    console.log('\n--- CSV Content ---');
    console.log(csvContent);

  } catch (error) {
    console.error('Error exporting customers:', error);
  }
}

// Fallback function for read-only access (limited data)
async function exportCustomersReadOnly() {
  console.log('🔄 Using read-only export mode (limited data)');

  // For read-only access, we'd need to use the Firebase client SDK
  // This would require browser environment or additional setup
  console.log('⚠️  Read-only export requires Firebase client SDK setup');
  console.log('💡 Consider setting up Firebase Admin SDK for full export');

  // Create a basic CSV with sample data structure
  const csvLines = [];
  csvLines.push('uid,email,username,role,status,note');
  csvLines.push('"sample-uid","sample@email.com","sampleuser","agent","active","This is sample data - setup Firebase Admin for real export"');

  const csvContent = csvLines.join('\n');
  const outputPath = path.join(__dirname, '..', 'customers_export_readonly.csv');

  fs.writeFileSync(outputPath, csvContent, 'utf8');
  console.log(`📄 Sample CSV created: ${outputPath}`);
  console.log('\n--- Sample CSV Content ---');
  console.log(csvContent);
}

// Run the export
if (require.main === module) {
  console.log('🚀 Starting customer CSV export...');
  exportCustomersToCSV().then(() => {
    console.log('✅ Export process completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Export failed:', error);
    process.exit(1);
  });
}

module.exports = { exportCustomersToCSV };