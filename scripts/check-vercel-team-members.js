#!/usr/bin/env node

/**
 * Check Vercel Team Members
 * Lists all team members and pending invitations
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const TEAM_ID = 'team_IDm0q4I2CeJIFoi1TdMPQQ90';

function getVercelToken() {
  // Try to get from Vercel CLI
  try {
    // Check if vercel CLI is available and get token
    const result = execSync('vercel whoami', { encoding: 'utf8', stdio: 'pipe' });
    if (result) {
      // Try to find token in common locations
      const possiblePaths = [
        path.join(os.homedir(), '.vercel', 'auth.json'),
        path.join(os.homedir(), '.vercel', 'token'),
        path.join(process.cwd(), '.vercel', 'auth.json'),
      ];

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
          // Continue
        }
      }
    }
  } catch (error) {
    // Continue
  }

  // Try environment variable
  if (process.env.VERCEL_TOKEN) {
    return process.env.VERCEL_TOKEN;
  }

  throw new Error('Vercel token not found');
}

function makeRequest(options) {
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
            reject({ statusCode: res.statusCode, data: parsed });
          }
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkTeamMembers() {
  try {
    console.log('🔐 Getting Vercel API token...');
    const token = getVercelToken();
    console.log('✅ Token found\n');

    console.log('📋 Fetching team members...');
    console.log(`   Team ID: ${TEAM_ID}\n`);

    const options = {
      hostname: 'api.vercel.com',
      path: `/v2/teams/${TEAM_ID}/members`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };

    const response = await makeRequest(options);

    console.log('✅ Team Members:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check for pending invitations
    if (response.data.members) {
      const pending = response.data.members.filter(m => m.invited && !m.confirmed);
      if (pending.length > 0) {
        console.log('\n⏳ Pending Invitations:');
        pending.forEach(m => {
          console.log(`   - ${m.email} (invited: ${m.invitedAt})`);
        });
      }
    }

  } catch (error) {
    if (error.statusCode) {
      console.error(`❌ ERROR: API request failed (${error.statusCode})`);
      console.error(`   Response:`, JSON.stringify(error.data, null, 2));
    } else {
      console.error('❌ ERROR:', error.message);
    }
    process.exit(1);
  }
}

checkTeamMembers();
