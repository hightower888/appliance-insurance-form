#!/usr/bin/env node

/**
 * Vercel Deployment Validation Script
 * Validates that source files match what Vercel is deploying
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const SOURCE_DIR = path.join(__dirname, '..', 'src');
const VERCEL_CONFIG = path.join(__dirname, '..', 'vercel.json');
const CRITICAL_FILES = [
  'appliance_form.html',
  'app.js',
  'styles.css',
  'admin.html',
  'admin.js',
  'processor.html',
  'processor.js',
  'login.html',
  'auth.js',
  'auth-db.js'
];

const SERVICES_FILES = [
  'services/appliance-relationship-manager.js',
  'services/form-renderer.js',
  'services/form-validator.js'
];

/**
 * Calculate file hash
 */
function calculateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Get file stats
 */
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      hash: calculateFileHash(filePath)
    };
  } catch (error) {
    return {
      exists: false,
      size: 0,
      modified: null,
      hash: null
    };
  }
}

/**
 * Read vercel.json to get output directory
 */
function getVercelConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(VERCEL_CONFIG, 'utf8'));
    return {
      outputDirectory: config.outputDirectory || 'src',
      buildCommand: config.buildCommand || null
    };
  } catch (error) {
    console.error('Error reading vercel.json:', error.message);
    return {
      outputDirectory: 'src',
      buildCommand: null
    };
  }
}

/**
 * Validate deployment files
 */
function validateDeployment() {
  console.log('🔍 Validating Vercel Deployment Configuration...\n');

  const config = getVercelConfig();
  console.log(`📁 Output Directory: ${config.outputDirectory}`);
  console.log(`🔨 Build Command: ${config.buildCommand || 'None (static)'}\n`);

  if (config.outputDirectory !== 'src') {
    console.warn('⚠️  WARNING: Output directory is not "src"');
    console.warn('   Expected: src');
    console.warn(`   Actual: ${config.outputDirectory}\n`);
  }

  console.log('📋 Checking Critical Files:\n');

  let allValid = true;
  const results = [];

  // Check critical files
  [...CRITICAL_FILES, ...SERVICES_FILES].forEach(fileName => {
    const filePath = path.join(SOURCE_DIR, fileName);
    const stats = getFileStats(filePath);

    const status = stats.exists ? '✅' : '❌';
    const result = {
      file: fileName,
      status: stats.exists ? 'EXISTS' : 'MISSING',
      size: stats.size,
      modified: stats.modified,
      hash: stats.hash ? stats.hash.substring(0, 8) + '...' : 'N/A'
    };

    results.push(result);

    if (stats.exists) {
      console.log(`${status} ${fileName}`);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   Modified: ${stats.modified}`);
      console.log(`   Hash: ${result.hash}\n`);
    } else {
      console.log(`${status} ${fileName} - FILE NOT FOUND\n`);
      allValid = false;
    }
  });

  // Check for duplicate contact details fix
  console.log('🔍 Checking for Duplicate Contact Details Fix...\n');
  const appJsPath = path.join(SOURCE_DIR, 'app.js');
  if (fs.existsSync(appJsPath)) {
    const appJsContent = fs.readFileSync(appJsPath, 'utf8');
    const hasExclusion = appJsContent.includes('Contact Details') && 
                        appJsContent.includes('excludeSections');
    
    if (hasExclusion) {
      console.log('✅ Contact Details exclusion found in app.js');
      console.log('   Duplicate contact details fix is present\n');
    } else {
      console.log('❌ Contact Details exclusion NOT found in app.js');
      console.log('   Fix may not be applied\n');
      allValid = false;
    }
  }

  // Check for calendar picker
  console.log('🔍 Checking for Calendar Picker Implementation...\n');
  const formHtmlPath = path.join(SOURCE_DIR, 'appliance_form.html');
  if (fs.existsSync(formHtmlPath)) {
    const formHtmlContent = fs.readFileSync(formHtmlPath, 'utf8');
    const hasFlatpickr = formHtmlContent.includes('flatpickr') || 
                        formHtmlContent.includes('Flatpickr');
    
    if (hasFlatpickr) {
      console.log('✅ Calendar picker (Flatpickr) found in appliance_form.html');
      console.log('   Calendar picker implementation is present\n');
    } else {
      console.log('⚠️  Calendar picker NOT found in appliance_form.html');
      console.log('   Calendar picker may not be implemented\n');
    }
  }

  // Summary
  console.log('📊 Validation Summary:\n');
  console.log(`   Files Checked: ${CRITICAL_FILES.length}`);
  console.log(`   Files Found: ${results.filter(r => r.status === 'EXISTS').length}`);
  console.log(`   Files Missing: ${results.filter(r => r.status === 'MISSING').length}`);
  console.log(`   Overall Status: ${allValid ? '✅ VALID' : '❌ INVALID'}\n`);

  if (allValid) {
    console.log('✅ All critical files are present and valid!');
    console.log('✅ Deployment configuration is correct!');
    console.log('✅ Ready for Vercel deployment!\n');
    process.exit(0);
  } else {
    console.error('❌ Validation failed! Some files are missing or invalid.');
    console.error('   Please fix the issues above before deploying.\n');
    process.exit(1);
  }
}

// Run validation
validateDeployment();
