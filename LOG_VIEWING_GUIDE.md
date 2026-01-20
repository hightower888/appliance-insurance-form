# Log Viewing Guide

## Overview
This guide explains how to check logs for the appliance form application from various sources.

---

## 1. Vercel Deployment Logs

### View Build Logs
```bash
vercel inspect https://appliance-cover-form.vercel.app --logs
```

### View Recent Deployments
```bash
vercel ls
```

### View via Vercel Dashboard
1. Go to: https://vercel.com/dan-ai-mate/customer-web-from-flash
2. Click on any deployment
3. View "Build Logs" and "Runtime Logs" tabs

---

## 2. Application Database Logs

### Run Log Checker Script
```bash
node scripts/check-logs.js
```

This script checks:
- ✅ Error logs in database
- ✅ Processor activity logs
- ✅ Recent sales submissions
- ✅ User account statistics

### What the Script Shows:
- **Error Logs**: Any errors logged to the database
- **Activity Logs**: Processor actions (CSV exports, profile changes, etc.)
- **Sales Submissions**: Last 5 form submissions with timestamps
- **User Accounts**: Total users and role distribution

---

## 3. Browser Console Logs

### How to Access:
1. **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
2. **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
3. **Safari**: Enable Developer menu first, then `Cmd+Option+C`

### What to Look For:
- **Errors** (red): JavaScript errors, failed API calls
- **Warnings** (yellow): Deprecated features, performance issues
- **Info** (blue): Debug messages, Firebase initialization

### Common Log Messages:
- `Firebase initialized for database auth` - ✅ Normal
- `User logged in: [email]` - ✅ Normal
- `Error loading sales:` - ⚠️ Check database connection
- `Error saving field mappings:` - ⚠️ Check permissions

---

## 4. Firebase Realtime Database Logs

### Access Firebase Console:
1. Go to: https://console.firebase.google.com/project/appliance-bot
2. Navigate to **Realtime Database**
3. View data structure and check for:
   - `/error_logs` - Application errors
   - `/processor_profiles/{userId}/activity` - Processor activities
   - `/sales` - Form submissions
   - `/users` - User accounts

### Database Structure:
```
appliance-bot-default-rtdb/
├── error_logs/          # Application errors
├── processor_profiles/  # Processor settings & activity
│   └── {userId}/
│       └── activity/   # Activity log entries
├── sales/              # Form submissions
└── users/              # User accounts
```

---

## 5. Runtime Error Tracking

### Current Error Logging:
The application logs errors to the console using:
- `console.error()` - For errors
- `console.warn()` - For warnings
- `console.log()` - For debug info

### Error Sources:
- **Authentication**: `src/auth-db.js`
- **Admin Panel**: `src/admin.js`
- **Processor**: `src/processor.js`
- **Form Submission**: `src/app.js`

---

## 6. Monitoring Checklist

### Daily Checks:
- [ ] Run `node scripts/check-logs.js` to check database
- [ ] Review Vercel deployment status
- [ ] Check for browser console errors

### Weekly Checks:
- [ ] Review processor activity logs
- [ ] Check sales submission trends
- [ ] Review user account activity

### When Issues Occur:
1. **Check Browser Console** - Immediate errors
2. **Run Log Checker** - Database errors
3. **Check Vercel Logs** - Deployment issues
4. **Review Firebase Console** - Data issues

---

## 7. Common Issues & Solutions

### Issue: "No error logs found"
**Solution**: This is good! No errors are being logged.

### Issue: Firebase warnings about indexes
**Solution**: Add index rules to `database.rules.json`:
```json
{
  "rules": {
    "sales": {
      ".indexOn": ["submittedAt", "agentEmail"]
    }
  }
}
```

### Issue: "Error loading sales"
**Solution**: 
- Check Firebase database connection
- Verify database rules allow read access
- Check browser console for specific error

### Issue: "No sales submissions found"
**Solution**: 
- Check if form is being submitted
- Verify Firebase write permissions
- Check browser console for submission errors

---

## 8. Log Retention

### Current Setup:
- **Browser Console**: Cleared on page refresh
- **Database Logs**: Stored indefinitely (manual cleanup needed)
- **Vercel Logs**: Retained for 30 days
- **Activity Logs**: Last 50 entries shown in UI

### Cleanup:
To clean old logs, manually delete from Firebase Console or create a cleanup script.

---

## 9. Quick Commands Reference

```bash
# Check application logs
node scripts/check-logs.js

# View Vercel deployment logs
vercel inspect https://appliance-cover-form.vercel.app --logs

# List recent deployments
vercel ls

# View specific deployment
vercel inspect [deployment-url]
```

---

## 10. Next Steps

For enhanced logging, consider:
- ✅ Adding error logging to database (currently console only)
- ✅ Setting up error tracking service (Sentry, LogRocket)
- ✅ Adding performance monitoring
- ✅ Creating log retention policies

---

**Last Updated**: 2026-01-09
