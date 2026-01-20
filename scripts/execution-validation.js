#!/usr/bin/env node

/**
 * Execution Validation Script
 * 
 * Runs at the end of execution to validate:
 * 1. All changes are in source files
 * 2. Files are ready for deployment
 * 3. No critical issues exist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SOURCE_DIR = path.join(__dirname, '..', 'src');
const VERCEL_CONFIG = path.join(__dirname, '..', 'vercel.json');

/**
 * Run pre-deployment validation
 */
function runPreDeploymentValidation() {
  console.log('🔍 Running Pre-Deployment Validation...\n');
  
  try {
    const output = execSync('node scripts/validate-vercel-deployment.js', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log(output);
    
    // Check if validation passed
    if (output.includes('✅ VALID') && output.includes('Ready for Vercel deployment')) {
      return { success: true, message: 'Pre-deployment validation passed' };
    } else {
      return { success: false, message: 'Pre-deployment validation failed' };
    }
  } catch (error) {
    console.error('Validation error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Check for critical issues
 */
function checkCriticalIssues() {
  console.log('\n🔍 Checking for Critical Issues...\n');
  
  const issues = [];
  
  // Check if app.js has contact details exclusion
  const appJsPath = path.join(SOURCE_DIR, 'app.js');
  if (fs.existsSync(appJsPath)) {
    const content = fs.readFileSync(appJsPath, 'utf8');
    if (!content.includes('Contact Details') || !content.includes('excludeSections')) {
      issues.push('Contact Details exclusion may be missing in app.js');
    }
  }
  
  // Check if appliance relationship manager exists
  const relationshipManagerPath = path.join(SOURCE_DIR, 'services', 'appliance-relationship-manager.js');
  if (!fs.existsSync(relationshipManagerPath)) {
    issues.push('Appliance Relationship Manager not found');
  }
  
  // Check if form HTML includes relationship manager script
  const formHtmlPath = path.join(SOURCE_DIR, 'appliance_form.html');
  if (fs.existsSync(formHtmlPath)) {
    const content = fs.readFileSync(formHtmlPath, 'utf8');
    if (!content.includes('appliance-relationship-manager.js')) {
      issues.push('Form HTML may not include relationship manager script');
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No critical issues found\n');
    return { success: true, issues: [] };
  } else {
    console.log('⚠️  Critical issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
    return { success: false, issues };
  }
}

/**
 * Verify file structure
 */
function verifyFileStructure() {
  console.log('🔍 Verifying File Structure...\n');
  
  const requiredFiles = [
    'appliance_form.html',
    'app.js',
    'styles.css',
    'services/appliance-relationship-manager.js',
    'services/form-renderer.js'
  ];
  
  const missing = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(SOURCE_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      missing.push(file);
    }
  });
  
  if (missing.length === 0) {
    console.log('\n✅ All required files present\n');
    return { success: true, missing: [] };
  } else {
    console.log(`\n❌ Missing files: ${missing.length}\n`);
    return { success: false, missing };
  }
}

/**
 * Main validation function
 */
function runExecutionValidation() {
  console.log('🚀 Execution Validation');
  console.log('======================\n');
  
  const results = {
    preDeployment: null,
    criticalIssues: null,
    fileStructure: null,
    overall: false
  };
  
  // Run all validations
  results.preDeployment = runPreDeploymentValidation();
  results.criticalIssues = checkCriticalIssues();
  results.fileStructure = verifyFileStructure();
  
  // Overall status
  results.overall = 
    results.preDeployment.success &&
    results.criticalIssues.success &&
    results.fileStructure.success;
  
  // Summary
  console.log('📊 Validation Summary:');
  console.log('=====================\n');
  console.log(`Pre-Deployment: ${results.preDeployment.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Critical Issues: ${results.criticalIssues.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`File Structure: ${results.fileStructure.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`\nOverall Status: ${results.overall ? '✅ VALID' : '❌ INVALID'}\n`);
  
  if (results.overall) {
    console.log('✅ All validations passed! Ready for deployment.\n');
    process.exit(0);
  } else {
    console.log('❌ Validation failed! Please fix issues before deployment.\n');
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  runExecutionValidation();
}

module.exports = { runExecutionValidation, runPreDeploymentValidation, checkCriticalIssues, verifyFileStructure };
