/**
 * Log Checker Script
 * Checks various log sources for the application
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function checkLogs() {
  console.log('🔍 Checking Application Logs...\n');
  
  try {
    // Check for error logs in database
    console.log('📊 Checking Database for Error Logs...');
    const errorLogsRef = db.ref('error_logs');
    const errorSnapshot = await errorLogsRef.once('value');
    
    if (errorSnapshot.exists()) {
      const errors = errorSnapshot.val();
      console.log(`Found ${Object.keys(errors).length} error log entries`);
      Object.entries(errors).slice(-10).forEach(([key, error]) => {
        console.log(`\n[${new Date(error.timestamp || 0).toLocaleString()}]`);
        console.log(`Error: ${error.message || 'Unknown'}`);
        console.log(`Source: ${error.source || 'Unknown'}`);
        if (error.stack) {
          console.log(`Stack: ${error.stack.substring(0, 200)}...`);
        }
      });
    } else {
      console.log('✅ No error logs found in database');
    }
    
    // Check activity logs
    console.log('\n📋 Checking Processor Activity Logs...');
    const profilesRef = db.ref('processor_profiles');
    const profilesSnapshot = await profilesRef.once('value');
    
    if (profilesSnapshot.exists()) {
      const profiles = profilesSnapshot.val();
      let totalActivities = 0;
      
      Object.entries(profiles).forEach(([userId, profile]) => {
        if (profile.activity) {
          const activities = Object.keys(profile.activity).length;
          totalActivities += activities;
          console.log(`User ${userId}: ${activities} activities`);
        }
      });
      
      if (totalActivities > 0) {
        console.log(`\n✅ Total activities logged: ${totalActivities}`);
      } else {
        console.log('ℹ️  No activity logs found');
      }
    }
    
    // Check recent sales submissions
    console.log('\n📦 Checking Recent Sales Submissions...');
    const salesRef = db.ref('sales');
    const salesSnapshot = await salesRef.orderByChild('submittedAt').limitToLast(5).once('value');
    
    if (salesSnapshot.exists()) {
      const sales = [];
      salesSnapshot.forEach((child) => {
        sales.push({
          id: child.key,
          date: new Date(child.val().submittedAt || 0).toLocaleString(),
          customer: child.val().contact?.name || 'Unknown',
          agent: child.val().agentEmail || 'Unknown'
        });
      });
      
      console.log(`\nLast ${sales.length} submissions:`);
      sales.reverse().forEach((sale, idx) => {
        console.log(`${idx + 1}. [${sale.date}] ${sale.customer} (Agent: ${sale.agent})`);
      });
    } else {
      console.log('ℹ️  No sales submissions found');
    }
    
    // Check user accounts
    console.log('\n👥 Checking User Accounts...');
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const userCount = Object.keys(users).length;
      const roles = {};
      
      Object.values(users).forEach(user => {
        const role = user.role || 'unknown';
        roles[role] = (roles[role] || 0) + 1;
      });
      
      console.log(`Total users: ${userCount}`);
      Object.entries(roles).forEach(([role, count]) => {
        console.log(`  ${role}: ${count}`);
      });
    } else {
      console.log('ℹ️  No users found');
    }
    
    console.log('\n✅ Log check complete!');
    
  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkLogs();
