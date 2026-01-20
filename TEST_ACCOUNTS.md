# Test Accounts

This document contains the test account credentials for the Appliance Insurance Form application.

## Test Accounts

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `TestAdmin123!`
- **Role:** Admin
- **Access:** Full access to admin panel, user management, and sales data

### Agent Accounts

#### Agent 1
- **Email:** `agent1@test.com`
- **Password:** `TestAgent123!`
- **Role:** Agent
- **Access:** Can submit forms, view own submissions

#### Agent 2
- **Email:** `agent2@test.com`
- **Password:** `TestAgent123!`
- **Role:** Agent
- **Access:** Can submit forms, view own submissions

#### Agent 3
- **Email:** `agent3@test.com`
- **Password:** `TestAgent123!`
- **Role:** Agent
- **Access:** Can submit forms, view own submissions

#### Agent 4
- **Email:** `agent4@test.com`
- **Password:** `TestAgent123!`
- **Role:** Agent
- **Access:** Can submit forms, view own submissions

## Setup Instructions

### Option 1: Automated Setup (Recommended)

1. **Log in as an existing admin user** (or create one first via Firebase Console)
2. **Navigate to:** `src/setup-test-accounts.html`
3. **Click:** "Create All Accounts" button
4. **Wait:** The script will create all accounts automatically
5. **Log back in:** You'll be redirected to login page after setup

### Option 2: Manual Setup via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **appliance-bot**
3. Navigate to **Authentication > Users**
4. For each account:
   - Click "Add user"
   - Enter email and password
   - Copy the User UID
   - Go to **Realtime Database**
   - Navigate to `users/{USER_UID}`
   - Add:
     ```json
     {
       "email": "user@test.com",
       "role": "admin" or "agent",
       "status": "active",
       "createdAt": "2024-01-01T00:00:00.000Z",
       "isTestAccount": true
     }
     ```

## Using Test Accounts

### Admin Testing
1. Log in with `admin@test.com` / `TestAdmin123!`
2. Should redirect to `admin.html`
3. Test features:
   - View users list
   - Create new users
   - View sales data
   - Edit/delete users

### Agent Testing
1. Log in with any agent account (e.g., `agent1@test.com` / `TestAgent123!`)
2. Should redirect to `appliance_form.html`
3. Test features:
   - Submit forms
   - Verify agent info is included in submissions
   - Check that sales data is NOT accessible

## Security Notes

⚠️ **Important:**
- These are **TEST ACCOUNTS ONLY**
- Do **NOT** use these passwords in production
- Change passwords before production deployment
- Consider deleting test accounts after testing

## Account Management

### Check Existing Accounts
- Use the "Check Existing Accounts" button in `setup-test-accounts.html`
- This will verify which accounts exist and their roles

### Clear Test Accounts
- Use the "Clear All Test Accounts" button in `setup-test-accounts.html`
- This marks test accounts as inactive (doesn't delete from Auth)
- Useful for cleaning up after testing

## Troubleshooting

### "Email already in use"
- Account already exists
- The setup script will update the role if account exists
- Or manually update role in Firebase Console

### "Cannot create account"
- Make sure you're logged in as admin
- Check Firebase Console for any restrictions
- Verify database rules allow user creation

### "Wrong password"
- Password may have been changed
- Reset password via Firebase Console if needed
