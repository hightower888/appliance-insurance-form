/**
 * Fallback Customer Export (Read-Only)
 * Uses Firebase client SDK to read customer data
 */

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

// HTML template for browser execution
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Customer Export</title>
</head>
<body>
    <h1>Customer CSV Export</h1>
    <div id="status">Initializing...</div>
    <pre id="csv-output"></pre>

    <script type="module">
        // Import Firebase
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

        const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);

        const statusEl = document.getElementById('status');
        const csvEl = document.getElementById('csv-output');

        async function exportCustomers() {
            try {
                statusEl.textContent = 'Reading customers from database...';

                // Read all users (this works because database rules allow unauthenticated reads)
                const usersRef = ref(database, 'users');
                const snapshot = await get(usersRef);

                if (!snapshot.exists()) {
                    statusEl.textContent = '❌ No users found in database';
                    return;
                }

                const users = snapshot.val();
                const userCount = Object.keys(users).length;
                statusEl.textContent = \`Found \${userCount} customers. Generating CSV...\`;

                // Generate CSV
                const csvLines = [];
                csvLines.push('uid,email,username,role,status,password_hash,first_name,last_name,phone,company,notes');

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

                    // Escape commas and quotes
                    const escapedRow = row.map(field => \`"\${String(field).replace(/"/g, '""')}"\`);
                    csvLines.push(escapedRow.join(','));
                }

                const csvContent = csvLines.join('\\n');
                csvEl.textContent = csvContent;

                statusEl.innerHTML = \`
                    ✅ Export completed!<br>
                    \${userCount} customers exported<br>
                    <button onclick="downloadCSV(csvContent)">Download CSV</button>
                \`;

                // Make CSV available for download
                window.csvContent = csvContent;

            } catch (error) {
                statusEl.textContent = \`❌ Error: \${error.message}\`;
                console.error(error);
            }
        }

        function downloadCSV(content) {
            const blob = new Blob([content], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'customers_export.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Start export
        exportCustomers();
    </script>
</body>
</html>
`;

async function createExportPage() {
  const outputPath = path.join(__dirname, '..', 'customer-export.html');
  fs.writeFileSync(outputPath, htmlTemplate, 'utf8');
  console.log(`📄 Export page created: ${outputPath}`);
  console.log('🌐 Open this file in a browser to run the export');
  console.log('   The page will read customer data and generate a downloadable CSV');
}

if (require.main === module) {
  console.log('🚀 Creating customer export page...');
  createExportPage().then(() => {
    console.log('✅ Export page ready');
  }).catch(error => {
    console.error('❌ Failed to create export page:', error);
  });
}