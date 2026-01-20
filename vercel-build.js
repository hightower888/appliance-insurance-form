/**
 * Vercel Build Script
 * Injects environment variables into HTML files for client-side access
 * 
 * This script runs during Vercel build to inject Firebase config
 */

const fs = require('fs');
const path = require('path');

// Get environment variables from Vercel
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || "appliance-bot.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL || "https://appliance-bot-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "appliance-bot",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || "appliance-bot.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "190852477335",
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || "1:190852477335:web:b720a9a9217ae5fffe94d2"
};

// Generate config injection script
const configScript = `
<script>
// Firebase Configuration (Injected at build time)
window.env = ${JSON.stringify({
  FIREBASE_API_KEY: firebaseConfig.apiKey,
  FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  FIREBASE_DATABASE_URL: firebaseConfig.databaseURL,
  FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  FIREBASE_APP_ID: firebaseConfig.appId
}, null, 2)};

// Set firebaseConfig for backward compatibility
if (typeof window.firebaseConfig === 'undefined') {
  window.firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};
}
</script>
`;

// HTML files that need config injection
const htmlFiles = [
  'src/login.html',
  'src/appliance_form.html',
  'src/crm.html',
  'src/admin.html',
  'src/processor.html'
];

// Inject config into HTML files
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the head tag and inject config before Firebase SDKs
    const headMatch = content.match(/<head[^>]*>([\s\S]*?)(<script[^>]*firebase)/i);
    if (headMatch) {
      // Inject before Firebase scripts
      content = content.replace(
        /(<head[^>]*>)/i,
        `$1\n${configScript}\n`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Injected config into ${file}`);
    } else {
      // Fallback: inject at end of head
      content = content.replace(
        /(<\/head>)/i,
        `${configScript}\n$1`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Injected config into ${file} (fallback)`);
    }
  }
});

console.log('✅ Build script complete - Environment variables injected');
