#!/usr/bin/env node

/**
 * Invite Team Member to Vercel via API
 * 
 * Usage: node scripts/invite-vercel-team-member.js <email> [role]
 * Example: node scripts/invite-vercel-team-member.js kennen_02@icloud.com OWNER
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const DEVELOPER_EMAIL = process.argv[2] || 'kennen_02@icloud.com';
const ROLE = process.argv[3] || 'OWNER'; // OWNER, ADMIN, MEMBER, VIEWER
const TEAM_ID = 'team_IDm0q4I2CeJIFoi1TdMPQQ90';

/**
 * Get Vercel API Token
 */
function getVercelToken() {
  // Try multiple locations for token
  const possiblePaths = [
    path.join(os.homedir(), '.vercel', 'auth.json'),
    path.join(os.homedir(), '.vercel', 'token'),
    path.join(process.cwd(), '.vercel', 'auth.json'),
  ];

  // Try reading from files
  for (const configPath of possiblePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(content);
        if (config.token) {
          return config.token;
        }
      }
    } catch (error) {
      // Continue to next path
    }
  }

  // Try environment variable
  if (process.env.VERCEL_TOKEN) {
    return process.env.VERCEL_TOKEN;
  }

  // Try to get from Vercel CLI config (newer format)
  try {
    const configPath = path.join(os.homedir(), '.vercel', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.token) {
        return config.token;
      }
    }
  } catch (error) {
    // Continue
  }

  // Last resort: try to extract from vercel whoami or other CLI commands
  try {
    // Vercel CLI stores token in a different location sometimes
    const vercelDir = path.join(os.homedir(), '.vercel');
    if (fs.existsSync(vercelDir)) {
      const files = fs.readdirSync(vercelDir);
      for (const file of files) {
        if (file.includes('token') || file.includes('auth')) {
          const filePath = path.join(vercelDir, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(content);
            if (parsed.token) {
              return parsed.token;
            }
          } catch (e) {
            // Try as plain text
            const content = fs.readFileSync(filePath, 'utf8').trim();
            if (content && content.length > 20) {
              return content;
            }
          }
        }
      }
    }
  } catch (error) {
    // Continue
  }

  throw new Error('Vercel token not found. Please run: vercel login');
}

/**
 * Make API request to Vercel
 */
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            reject({ statusCode: res.statusCode, data: parsed, message: parsed.error?.message || parsed.message });
          }
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Invite team member
 */
async function inviteTeamMember() {
  try {
    console.log('🔐 Getting Vercel API token...');
    const token = getVercelToken();
    console.log('✅ Token found\n');

    console.log('📧 Inviting team member...');
    console.log(`   Email: ${DEVELOPER_EMAIL}`);
    console.log(`   Role: ${ROLE}`);
    console.log(`   Team ID: ${TEAM_ID}\n`);

    const options = {
      hostname: 'api.vercel.com',
      path: `/v1/teams/${TEAM_ID}/members`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await makeRequest(options, {
      email: DEVELOPER_EMAIL,
      role: ROLE,
    });

    console.log('✅ Success! Team member invited');
    console.log(`   Status: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    console.log('\n📧 Developer will receive an email invitation');
    console.log('   They need to accept the invitation to gain access.\n');

  } catch (error) {
    if (error.message && error.message.includes('token not found')) {
      console.error('❌ ERROR: Vercel token not found');
      console.error('\n💡 To fix this:');
      console.error('   1. Run: vercel login');
      console.error('   2. Then run this script again\n');
    } else if (error.statusCode) {
      console.error(`❌ ERROR: API request failed (${error.statusCode})`);
      console.error(`   Message: ${error.message || JSON.stringify(error.data)}`);
      if (error.statusCode === 401) {
        console.error('\n💡 Your token may be expired. Try: vercel login');
      } else if (error.statusCode === 403) {
        console.error('\n💡 You may not have permission to invite team members.');
        console.error('   Make sure you have OWNER or ADMIN role in the team.');
      }
    } else {
      console.error('❌ ERROR:', error.message);
    }
    process.exit(1);
  }
}

// Run
inviteTeamMember();
