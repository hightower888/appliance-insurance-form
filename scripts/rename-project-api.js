/**
 * Rename Vercel Project via API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ID = 'prj_05wTXi5G4yyLT22RpRTPJ981RdJO';
const NEW_NAME = 'customer-web-from-flash';

function getVercelToken() {
  try {
    const configPath = path.join(os.homedir(), '.vercel', 'auth.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.token) {
        return config.token;
      }
    }
  } catch (error) {
    // Try alternative location
  }
  
  // Try to get from environment or vercel CLI
  if (process.env.VERCEL_TOKEN) {
    return process.env.VERCEL_TOKEN;
  }
  
  throw new Error('Vercel token not found');
}

function renameProject(token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: NEW_NAME
    });

    const options = {
      hostname: 'api.vercel.com',
      path: `/v9/projects/${PROJECT_ID}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔧 Renaming Vercel project via API...\n');
    
    const token = getVercelToken();
    console.log('✅ Vercel token obtained\n');
    
    console.log(`📝 Renaming project ${PROJECT_ID} to: ${NEW_NAME}...`);
    const result = await renameProject(token);
    
    console.log('\n✅ Project renamed successfully!');
    if (typeof result === 'object' && result.name) {
      console.log(`   New name: ${result.name}`);
      console.log(`   New URL: https://${result.name}.vercel.app\n`);
    } else {
      console.log(`   Project renamed to: ${NEW_NAME}\n`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('token')) {
      console.log('\n💡 Trying alternative method...\n');
    }
    process.exit(1);
  }
}

main();
