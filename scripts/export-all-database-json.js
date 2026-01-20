/**
 * Export All Firebase Realtime Database Data to JSON
 * Exports complete database snapshot in JSON format
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Admin SDK
if (!admin.apps.length) {
  const serviceAccount = require('../service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

async function exportAllData() {
  console.log('🚀 Exporting all Firebase Realtime Database data...\n');

  try {
    // Get root reference
    const rootRef = db.ref('/');
    const snapshot = await rootRef.once('value');

    if (!snapshot.exists()) {
      console.log('❌ Database is empty');
      return;
    }

    // Get all data
    const allData = snapshot.val();

    // Create export object with metadata
    const exportData = {
      exportDate: new Date().toISOString(),
      projectId: 'appliance-bot',
      databaseUrl: 'https://appliance-bot-default-rtdb.firebaseio.com',
      data: allData
    };

    // Count records in each top-level node
    const counts = {};
    if (allData) {
      Object.keys(allData).forEach(key => {
        if (allData[key] && typeof allData[key] === 'object') {
          counts[key] = Object.keys(allData[key]).length;
        } else {
          counts[key] = 1;
        }
      });
    }

    exportData.recordCounts = counts;

    // Write to file
    const outputPath = path.join(process.cwd(), 'firebase-database-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');

    console.log('✅ Export complete!\n');
    console.log('📄 File saved to:', outputPath);
    console.log('\n📊 Record counts:');
    Object.entries(counts).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} records`);
    });

    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`\n📈 Total records: ${totalRecords}`);

    // Show file size
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`💾 File size: ${fileSizeMB} MB`);

    console.log('\n--- EXPORT PREVIEW (first 500 chars) ---');
    const preview = JSON.stringify(exportData, null, 2).substring(0, 500);
    console.log(preview + '...\n');

  } catch (error) {
    console.error('❌ Export failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run export
exportAllData()
  .then(() => {
    console.log('\n✅ Export completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  });
