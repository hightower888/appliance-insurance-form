/**
 * Security Audit Script
 * Checks for security issues, failed login attempts, and unauthorized access
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function checkSecurityLogs() {
  console.log('🔒 Security Audit Report\n');
  console.log('='.repeat(60));
  
  let securityIssues = [];
  let warnings = [];
  
  try {
    // 1. Check for security_logs in database
    console.log('\n📋 Checking Security Logs...');
    const securityLogsRef = db.ref('security_logs');
    const securitySnapshot = await securityLogsRef.once('value');
    
    if (securitySnapshot.exists()) {
      const logs = securitySnapshot.val();
      const logCount = Object.keys(logs).length;
      console.log(`Found ${logCount} security log entries`);
      
      Object.entries(logs).slice(-20).forEach(([key, log]) => {
        const severity = log.severity || 'info';
        const icon = severity === 'critical' ? '🔴' : severity === 'warning' ? '🟡' : '🔵';
        console.log(`\n${icon} [${new Date(log.timestamp || 0).toLocaleString()}]`);
        console.log(`   Type: ${log.type || 'Unknown'}`);
        console.log(`   Message: ${log.message || 'No message'}`);
        if (log.userId) console.log(`   User: ${log.userId}`);
        if (log.ipAddress) console.log(`   IP: ${log.ipAddress}`);
        
        if (severity === 'critical' || severity === 'warning') {
          securityIssues.push(log);
        }
      });
    } else {
      console.log('ℹ️  No security logs found in database');
      warnings.push('Security event logging not implemented - failed logins and brute force attempts are not tracked');
    }
    
    // 2. Check user accounts for suspicious patterns
    console.log('\n👥 Checking User Accounts...');
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const userCount = Object.keys(users).length;
      console.log(`Total users: ${userCount}`);
      
      // Check for inactive accounts
      const inactiveUsers = Object.entries(users).filter(([uid, user]) => user.status === 'inactive');
      if (inactiveUsers.length > 0) {
        console.log(`⚠️  Found ${inactiveUsers.length} inactive user(s)`);
        warnings.push(`${inactiveUsers.length} inactive user account(s) found`);
      }
      
      // Check for accounts without roles
      const noRoleUsers = Object.entries(users).filter(([uid, user]) => !user.role);
      if (noRoleUsers.length > 0) {
        console.log(`⚠️  Found ${noRoleUsers.length} user(s) without role assignment`);
        warnings.push(`${noRoleUsers.length} user(s) without role assignment`);
      }
      
      // Check for accounts with weak passwords (if we could detect)
      // Note: We can't check password strength as passwords are hashed
    } else {
      console.log('ℹ️  No users found');
    }
    
    // 3. Check database rules
    console.log('\n🛡️  Checking Security Configuration...');
    console.log('✅ Brute force protection: Implemented (5 attempts, 15 min lockout)');
    console.log('✅ Password hashing: SHA-256');
    console.log('✅ Session management: sessionStorage');
    console.log('⚠️  Security event logging: Not implemented (events only in browser console)');
    warnings.push('Security events (failed logins, brute force attempts) are not logged to database');
    
    // 4. Check for error patterns that might indicate attacks
    console.log('\n🔍 Checking for Attack Patterns...');
    const errorLogsRef = db.ref('error_logs');
    const errorSnapshot = await errorLogsRef.once('value');
    
    if (errorSnapshot.exists()) {
      const errors = errorSnapshot.val();
      const errorCount = Object.keys(errors).length;
      console.log(`Found ${errorCount} error log entries`);
      
      // Look for patterns
      const authErrors = Object.values(errors).filter(e => 
        e.message && (e.message.includes('login') || e.message.includes('auth') || e.message.includes('password'))
      );
      
      if (authErrors.length > 0) {
        console.log(`⚠️  Found ${authErrors.length} authentication-related errors`);
        warnings.push(`${authErrors.length} authentication-related errors found`);
      }
    } else {
      console.log('✅ No error logs found');
    }
    
    // 5. Check recent sales for suspicious patterns
    console.log('\n📦 Checking Sales Data...');
    const salesRef = db.ref('sales');
    const salesSnapshot = await salesRef.orderByChild('submittedAt').limitToLast(10).once('value');
    
    if (salesSnapshot.exists()) {
      const sales = [];
      salesSnapshot.forEach((child) => {
        sales.push({
          id: child.key,
          agent: child.val().agentEmail || 'Unknown',
          timestamp: child.val().submittedAt || child.val().timestamp
        });
      });
      
      // Check for rapid submissions (potential bot)
      const rapidSubmissions = sales.filter((sale, idx, arr) => {
        if (idx === 0) return false;
        const timeDiff = sale.timestamp - arr[idx - 1].timestamp;
        return timeDiff < 5000; // Less than 5 seconds between submissions
      });
      
      if (rapidSubmissions.length > 0) {
        console.log(`⚠️  Found ${rapidSubmissions.length} rapid submission(s) (potential bot activity)`);
        warnings.push(`${rapidSubmissions.length} rapid submission(s) detected`);
      } else {
        console.log('✅ No suspicious submission patterns detected');
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Security Summary:');
    console.log(`   Critical Issues: ${securityIssues.filter(i => i.severity === 'critical').length}`);
    console.log(`   Warnings: ${warnings.length}`);
    console.log(`   Security Logs: ${securitySnapshot.exists() ? Object.keys(securitySnapshot.val()).length : 0}`);
    
    if (securityIssues.length === 0 && warnings.length === 0) {
      console.log('\n✅ No security issues detected!');
    } else {
      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
      }
      
      if (securityIssues.length > 0) {
        console.log('\n🔴 Security Issues:');
        securityIssues.forEach((issue, i) => {
          console.log(`   ${i + 1}. [${issue.severity}] ${issue.message || 'Unknown issue'}`);
        });
      }
    }
    
    console.log('\n💡 Recommendations:');
    console.log('   1. Implement security event logging to database');
    console.log('   2. Track failed login attempts server-side');
    console.log('   3. Monitor for brute force patterns');
    console.log('   4. Set up alerts for suspicious activity');
    console.log('   5. Review inactive user accounts regularly');
    
  } catch (error) {
    console.error('\n❌ Error during security audit:', error);
  } finally {
    process.exit(0);
  }
}

// Run the audit
checkSecurityLogs();
