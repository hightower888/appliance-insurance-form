/**
 * Export Form Entries CSV with Customer-Appliance Relationship
 * Exports all form submissions with one-to-many customer-appliance relationships
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

async function exportFormEntries() {
  console.log('🚀 Exporting form entries with customer-appliance relationships...\n');

  try {
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, get } = await import('firebase/database');

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    console.log('📖 Reading form submissions from Firebase...');

    // Try different possible database paths for form submissions
    const possiblePaths = [
      'form_submissions',
      'submissions',
      'appliance_submissions',
      'forms',
      'form_data'
    ];

    let submissions = null;
    let submissionsPath = '';

    for (const path of possiblePaths) {
      try {
        console.log(`🔍 Checking path: ${path}`);
        const submissionsRef = ref(database, path);
        const snapshot = await get(submissionsRef);

        if (snapshot.exists()) {
          submissions = snapshot.val();
          submissionsPath = path;
          console.log(`✅ Found form submissions in: ${path}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Path ${path} not found or inaccessible`);
      }
    }

    if (!submissions) {
      console.log('❌ No form submissions found in database');
      console.log('\n💡 Possible database paths checked:');
      possiblePaths.forEach(path => console.log(`   - ${path}`));
      return;
    }

    // Get users for customer information
    console.log('👤 Reading customer data...');
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};

    const submissionCount = Object.keys(submissions).length;
    console.log(`✅ Found ${submissionCount} form submissions`);
    console.log(`👥 Found ${Object.keys(users).length} customers\n`);

    // Process submissions and build customer-appliance relationships
    const csvLines = [];
    csvLines.push('customer_id,customer_email,customer_name,submission_id,submission_date,appliance_type,make,model,age,years_old,purchase_price,serial_number,under_warranty,insurance_required,insurance_type,insurance_provider,policy_number,premium_amount,coverage_amount,expiry_date,additional_notes');

    let totalAppliances = 0;

    for (const [submissionId, submissionData] of Object.entries(submissions)) {
      const customerId = submissionData.userId || submissionData.customerId || 'unknown';
      const customer = users[customerId] || {};

      // Handle multiple appliances per submission (one-to-many relationship)
      const appliances = submissionData.appliances || [submissionData]; // Fallback for single appliance

      for (const [index, appliance] of Object.entries(appliances)) {
        if (typeof appliance === 'object' && appliance !== null) {
          const row = [
            customerId,
            customer.email || '',
            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || '',
            submissionId,
            submissionData.timestamp || submissionData.createdAt || submissionData.date || '',
            appliance.applianceType || appliance.type || 'Unknown',
            appliance.make || '',
            appliance.model || '',
            appliance.age || '',
            appliance.yearsOld || appliance.age || '',
            appliance.purchasePrice || appliance.price || '',
            appliance.serialNumber || '',
            appliance.underWarranty ? 'Yes' : 'No',
            appliance.insuranceRequired ? 'Yes' : 'No',
            appliance.insuranceType || '',
            appliance.insuranceProvider || '',
            appliance.policyNumber || '',
            appliance.premiumAmount || '',
            appliance.coverageAmount || '',
            appliance.expiryDate || '',
            appliance.notes || appliance.additionalNotes || ''
          ];

          // Escape CSV fields
          const escapedRow = row.map(field => {
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          });

          csvLines.push(escapedRow.join(','));
          totalAppliances++;
        }
      }
    }

    const csvContent = csvLines.join('\n');

    // Write to file
    const fs = await import('fs');
    const path = await import('path');

    const outputPath = path.default.join(process.cwd(), 'form_entries.csv');
    fs.default.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`📄 CSV file created: ${outputPath}`);
    console.log(`📊 Total form submissions: ${submissionCount}`);
    console.log(`🏠 Total appliances exported: ${totalAppliances}`);

    // Show summary
    console.log('\n--- EXPORT SUMMARY ---');
    console.log(`Form submissions: ${submissionCount}`);
    console.log(`Appliances: ${totalAppliances}`);
    console.log(`CSV lines: ${csvLines.length - 1} (including header)`);

    console.log('\n--- CSV PREVIEW ---');
    const previewLines = csvLines.slice(0, Math.min(6, csvLines.length));
    console.log(previewLines.join('\n'));

    if (csvLines.length > 6) {
      console.log(`... and ${csvLines.length - 6} more lines`);
    }

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check database rules allow read access');
    console.log('   - Verify form submissions are stored in database');
    console.log('   - Check Firebase connectivity');
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

  await exportFormEntries();
}

main();