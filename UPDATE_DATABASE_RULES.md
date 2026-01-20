# Update Database Rules for Testing

The database rules have been updated to allow database-based authentication. 

## Quick Fix

**Option 1: Update in Firebase Console (Fastest)**

1. Go to: https://console.firebase.google.com/project/appliance-bot/database/appliance-bot-default-rtdb/rules
2. Copy the contents of `database.rules.json`
3. Paste into the rules editor
4. Click "Publish"

**Option 2: Use Firebase CLI**

```bash
firebase deploy --only database
```

## Updated Rules

The rules now allow:
- ✅ **Read access to `/users`** - Required for database-based authentication
- ✅ **Read/write access to `/sales`** - For testing (form submissions)
- ✅ **Read/write access to `/appliance_submissions`** - For testing

**Note:** These are permissive rules for testing. In production, you should add proper authentication checks.

## Current Rules

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "users": {
      ".read": true,
      ".write": false,
      "$uid": {
        ".read": true,
        ".write": false
      }
    },
    
    "sales": {
      ".read": true,
      ".write": true
    },
    
    "appliance_submissions": {
      ".read": true,
      ".write": true
    }
  }
}
```

After updating the rules, try logging in again!
