#!/usr/bin/env node

/**
 * Security Check Script
 * Verifies no hardcoded API keys or secrets are in the codebase
 * 
 * Usage: node scripts/check-secrets.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to check for
const SECRET_PATTERNS = [
  /AIzaSy[A-Za-z0-9_-]{35}/g,  // Firebase API keys
  /sk_live_[A-Za-z0-9]{32,}/g,  // Stripe keys
  /AKIA[0-9A-Z]{16}/g,          // AWS keys
  /password\s*[:=]\s*["']([^"']+)["']/gi,  // Hardcoded passwords
  /api[_-]?key\s*[:=]\s*["']([^"']+)["']/gi,  // API keys
];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.env\.local$/,
  /\.env\.example$/,
  /SECURITY_SETUP\.md$/,
  /SECURITY_ASSESSMENT\.md$/,
  /_DEV\/STREAMS/,
  /OUTPUTS\/DISCOVERY/,
  /scripts\/check-secrets\.js$/,  // Exclude this file itself
];

// Files to check
const FILES_TO_CHECK = [
  'src/**/*.js',
  'scripts/**/*.js',
  'functions/**/*.js',
];

let foundSecrets = [];
let filesChecked = 0;

/**
 * Check if file should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Check file for secrets
 */
function checkFile(filePath) {
  if (shouldExclude(filePath)) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    filesChecked++;

    SECRET_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Check if it's a placeholder or example
          if (match.includes('ENV_VAR_NOT_SET') || 
              match.includes('DEVELOPMENT_KEY') ||
              match.includes('your_') ||
              match.includes('example')) {
            return; // Skip placeholders
          }

          foundSecrets.push({
            file: filePath,
            pattern: index,
            match: match.substring(0, 20) + '...', // Only show first 20 chars
            line: content.substring(0, content.indexOf(match)).split('\n').length
          });
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

/**
 * Find all files to check
 */
function findFiles(dir, pattern) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!shouldExclude(fullPath)) {
          files.push(...findFiles(fullPath, pattern));
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        if (!shouldExclude(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return files;
}

/**
 * Main check function
 */
function checkSecrets() {
  console.log('🔍 Scanning for hardcoded secrets...\n');

  // Check src directory
  const srcFiles = findFiles('src', '*.js');
  srcFiles.forEach(checkFile);

  // Check scripts directory
  const scriptFiles = findFiles('scripts', '*.js');
  scriptFiles.forEach(checkFile);

  // Report results
  console.log(`📊 Files checked: ${filesChecked}`);
  console.log(`🔐 Secrets found: ${foundSecrets.length}\n`);

  if (foundSecrets.length > 0) {
    console.log('❌ SECURITY ISSUE: Hardcoded secrets found!\n');
    foundSecrets.forEach((secret, index) => {
      console.log(`${index + 1}. ${secret.file}`);
      console.log(`   Line ${secret.line}: ${secret.match}`);
      console.log('');
    });
    console.log('⚠️  Please move all secrets to environment variables before committing!');
    process.exit(1);
  } else {
    console.log('✅ No hardcoded secrets found!');
    console.log('✅ Code is safe to commit to GitHub.');
    process.exit(0);
  }
}

// Run check
checkSecrets();
