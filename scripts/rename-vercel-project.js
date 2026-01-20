/**
 * Rename Vercel Project via API
 */

const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'prj_05wTXi5G4yyLT22RpRTPJ981RdJO';
const NEW_NAME = 'customer-web-from-flash';
const ORG_ID = 'team_IDm0q4I2CeJIFoi1TdMPQQ90';

function getVercelToken() {
  try {
    // Try to get token from Vercel CLI config
    const os = require('os');
    const path = require('path');
    const fs = require('fs');
    const configPath = path.join(os.homedir(), '.vercel', 'auth.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.token) {
        return config.token;
      }
    }
  } catch (error) {
    console.error('Error reading Vercel token:', error.message);
  }
  
  throw new Error('Vercel token not found. Please run: vercel login');
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
          resolve(JSON.parse(data));
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
    console.log('🔧 Renaming Vercel project...\n');
    
    const token = getVercelToken();
    console.log('✅ Vercel token obtained\n');
    
    console.log(`📝 Renaming project to: ${NEW_NAME}...`);
    const result = await renameProject(token);
    
    console.log('✅ Project renamed successfully!');
    console.log(`\nNew project name: ${result.name}`);
    console.log(`New URL: https://${result.name}.vercel.app\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Alternative: Rename via Vercel Dashboard:');
    console.log('   https://vercel.com/dan-ai-mate/appliance-form-app/settings/general\n');
    process.exit(1);
  }
}

main();
