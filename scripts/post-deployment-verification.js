#!/usr/bin/env node

/**
 * Post-Deployment Verification Script
 * 
 * Verifies that deployed files on Vercel match source files
 * Compares file hashes and content to ensure deployment integrity
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const VERCEL_URL = process.env.VERCEL_URL || 'https://appliance-cover-form.vercel.app';
const SOURCE_DIR = path.join(__dirname, '..', 'src');
const CRITICAL_FILES = [
  'appliance_form.html',
  'app.js',
  'styles.css'
];

/**
 * Fetch file from URL
 */
function fetchFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Calculate file hash
 */
function calculateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get file content from source
 */
function getSourceFile(fileName) {
  const filePath = path.join(SOURCE_DIR, fileName);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Verify deployed file matches source
 */
async function verifyFile(fileName) {
  console.log(`\n🔍 Verifying ${fileName}...`);

  // Get source file
  const sourceContent = getSourceFile(fileName);
  if (!sourceContent) {
    console.log(`❌ Source file not found: ${fileName}`);
    return { file: fileName, status: 'MISSING_SOURCE', match: false };
  }

  const sourceHash = calculateHash(sourceContent);
  console.log(`   Source hash: ${sourceHash.substring(0, 16)}...`);

  // Fetch deployed file
  try {
    const deployedUrl = `${VERCEL_URL}/${fileName}`;
    console.log(`   Fetching from: ${deployedUrl}`);
    
    const deployedContent = await fetchFile(deployedUrl);
    const deployedHash = calculateHash(deployedContent);
    console.log(`   Deployed hash: ${deployedHash.substring(0, 16)}...`);

    // Compare hashes
    const match = sourceHash === deployedHash;
    
    if (match) {
      console.log(`   ✅ MATCH - Files are identical`);
      return { file: fileName, status: 'MATCH', match: true, sourceHash, deployedHash };
    } else {
      console.log(`   ❌ MISMATCH - Files differ`);
      console.log(`   Source size: ${sourceContent.length} bytes`);
      console.log(`   Deployed size: ${deployedContent.length} bytes`);
      return { file: fileName, status: 'MISMATCH', match: false, sourceHash, deployedHash };
    }

  } catch (error) {
    console.log(`   ⚠️  ERROR: ${error.message}`);
    return { file: fileName, status: 'ERROR', match: false, error: error.message };
  }
}

/**
 * Check for specific features in deployed files
 */
async function verifyFeatures() {
  console.log('\n🔍 Verifying Features...\n');

  const features = [];

  // Check calendar picker
  try {
    const formContent = await fetchFile(`${VERCEL_URL}/appliance_form.html`);
    if (formContent.includes('flatpickr') || formContent.includes('Flatpickr')) {
      console.log('✅ Calendar picker (Flatpickr) found in deployed form');
      features.push({ feature: 'Calendar Picker', status: 'PRESENT' });
    } else {
      console.log('❌ Calendar picker NOT found in deployed form');
      features.push({ feature: 'Calendar Picker', status: 'MISSING' });
    }
  } catch (error) {
    console.log(`⚠️  Could not verify calendar picker: ${error.message}`);
    features.push({ feature: 'Calendar Picker', status: 'ERROR', error: error.message });
  }

  // Check contact details exclusion
  try {
    const appJsContent = await fetchFile(`${VERCEL_URL}/app.js`);
    if (appJsContent.includes('Contact Details') && appJsContent.includes('excludeSections')) {
      console.log('✅ Contact Details exclusion found in deployed app.js');
      features.push({ feature: 'Contact Details Exclusion', status: 'PRESENT' });
    } else {
      console.log('❌ Contact Details exclusion NOT found in deployed app.js');
      features.push({ feature: 'Contact Details Exclusion', status: 'MISSING' });
    }
  } catch (error) {
    console.log(`⚠️  Could not verify contact details exclusion: ${error.message}`);
    features.push({ feature: 'Contact Details Exclusion', status: 'ERROR', error: error.message });
  }

  // Check appliance relationship manager
  try {
    const relationshipManagerUrl = `${VERCEL_URL}/services/appliance-relationship-manager.js`;
    await fetchFile(relationshipManagerUrl);
    console.log('✅ Appliance Relationship Manager found in deployed files');
    features.push({ feature: 'Appliance Relationship Manager', status: 'PRESENT' });
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('❌ Appliance Relationship Manager NOT found in deployed files');
      features.push({ feature: 'Appliance Relationship Manager', status: 'MISSING' });
    } else {
      console.log(`⚠️  Could not verify relationship manager: ${error.message}`);
      features.push({ feature: 'Appliance Relationship Manager', status: 'ERROR', error: error.message });
    }
  }

  return features;
}

/**
 * Main verification function
 */
async function verifyDeployment() {
  console.log('🚀 Post-Deployment Verification');
  console.log('================================\n');
  console.log(`📍 Vercel URL: ${VERCEL_URL}`);
  console.log(`📁 Source Directory: ${SOURCE_DIR}\n`);

  const results = {
    files: [],
    features: [],
    summary: {
      totalFiles: CRITICAL_FILES.length,
      matchedFiles: 0,
      mismatchedFiles: 0,
      errorFiles: 0,
      totalFeatures: 0,
      presentFeatures: 0,
      missingFeatures: 0
    }
  };

  // Verify critical files
  console.log('📋 Verifying Critical Files:');
  for (const file of CRITICAL_FILES) {
    const result = await verifyFile(file);
    results.files.push(result);
    
    if (result.match) {
      results.summary.matchedFiles++;
    } else if (result.status === 'MISMATCH') {
      results.summary.mismatchedFiles++;
    } else {
      results.summary.errorFiles++;
    }
  }

  // Verify features
  results.features = await verifyFeatures();
  results.summary.totalFeatures = results.features.length;
  results.features.forEach(f => {
    if (f.status === 'PRESENT') {
      results.summary.presentFeatures++;
    } else if (f.status === 'MISSING') {
      results.summary.missingFeatures++;
    }
  });

  // Summary
  console.log('\n📊 Verification Summary:');
  console.log('========================\n');
  console.log(`Files Checked: ${results.summary.totalFiles}`);
  console.log(`✅ Matched: ${results.summary.matchedFiles}`);
  console.log(`❌ Mismatched: ${results.summary.mismatchedFiles}`);
  console.log(`⚠️  Errors: ${results.summary.errorFiles}`);
  console.log(`\nFeatures Checked: ${results.summary.totalFeatures}`);
  console.log(`✅ Present: ${results.summary.presentFeatures}`);
  console.log(`❌ Missing: ${results.summary.missingFeatures}`);

  // Overall status
  const allFilesMatch = results.summary.mismatchedFiles === 0 && results.summary.errorFiles === 0;
  const allFeaturesPresent = results.summary.missingFeatures === 0;

  console.log('\n🎯 Overall Status:');
  if (allFilesMatch && allFeaturesPresent) {
    console.log('✅ DEPLOYMENT VERIFIED - All files match and features present!');
    process.exit(0);
  } else {
    console.log('❌ DEPLOYMENT VERIFICATION FAILED');
    if (!allFilesMatch) {
      console.log('   Some files do not match source');
    }
    if (!allFeaturesPresent) {
      console.log('   Some features are missing');
    }
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verifyDeployment().catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyDeployment, verifyFile, verifyFeatures };
