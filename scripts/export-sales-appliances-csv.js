/**
 * Export Sales & Appliances CSV with Customer Relationships
 * Exports sales data with one-to-many customer-appliance relationships
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

async function exportSalesAndAppliances() {
  console.log('🚀 Exporting sales and appliances with customer relationships...\n');

  try {
    const { initializeApp } = await import('firebase/app');
    const { getDatabase, ref, get } = await import('firebase/database');

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    // Get users for customer information
    console.log('👤 Reading customer data...');
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    const users = usersSnapshot.exists() ? usersSnapshot.val() : {};

    console.log(`✅ Found ${Object.keys(users).length} customers`);

    // Get sales data
    console.log('💰 Reading sales data...');
    const salesRef = ref(database, 'sales');
    const salesSnapshot = await get(salesRef);
    const sales = salesSnapshot.exists() ? salesSnapshot.val() : {};

    console.log(`✅ Found ${Object.keys(sales).length} sales`);

    // Get appliances data
    console.log('🏠 Reading appliances data...');
    const appliancesRef = ref(database, 'appliances');
    const appliancesSnapshot = await get(appliancesRef);
    const appliances = appliancesSnapshot.exists() ? appliancesSnapshot.val() : {};

    console.log(`✅ Found ${Object.keys(appliances).length} appliances\n`);

    // Create CSV with customer-appliance relationships
    const csvLines = [];
    csvLines.push('customer_id,customer_email,customer_name,sale_id,sale_date,appliance_id,appliance_type,make,model,age,years_old,purchase_price,serial_number,under_warranty,insurance_required,insurance_type,insurance_provider,policy_number,premium_amount,coverage_amount,expiry_date,additional_notes');

    let totalAppliances = 0;

    // Process each sale
    for (const [saleId, saleData] of Object.entries(sales)) {
      const customerId = saleData.userId || saleData.customerId || 'unknown';
      const customer = users[customerId] || {};

      // Get appliances for this sale
      const saleAppliances = saleData.applianceIds || [];
      let appliancesFound = 0;

      // Process each appliance in the sale
      for (const applianceId of saleAppliances) {
        const appliance = appliances[applianceId];
        if (appliance) {
          const row = [
            customerId,
            customer.email || '',
            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || '',
            saleId,
            saleData.createdAt || saleData.timestamp || saleData.date || '',
            applianceId,
            appliance.type || appliance.applianceType || 'Unknown',
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
          appliancesFound++;
        }
      }

      // If no appliances found for this sale, create a row with sale info only
      if (appliancesFound === 0) {
        const row = [
          customerId,
          customer.email || '',
          `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.username || '',
          saleId,
          saleData.createdAt || saleData.timestamp || saleData.date || '',
          '', // no appliance_id
          'No appliances recorded',
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];

        const escapedRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`);
        csvLines.push(escapedRow.join(','));
      }
    }

    const csvContent = csvLines.join('\n');

    // Write to file
    const fs = await import('fs');
    const path = await import('path');

    const outputPath = path.default.join(process.cwd(), 'sales_appliances.csv');
    fs.default.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`📄 CSV file created: ${outputPath}`);
    console.log(`💰 Total sales: ${Object.keys(sales).length}`);
    console.log(`🏠 Total appliances: ${totalAppliances}`);

    // Show summary
    console.log('\n--- EXPORT SUMMARY ---');
    console.log(`Customers: ${Object.keys(users).length}`);
    console.log(`Sales: ${Object.keys(sales).length}`);
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
    console.log('   - Verify sales/appliances data exists in database');
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

  await exportSalesAndAppliances();
}

main();