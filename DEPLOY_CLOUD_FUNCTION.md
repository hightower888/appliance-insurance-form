# Deploy Cloud Function - User Creation

**Purpose:** Deploy the `createUser` Cloud Function to enable user creation via Firebase Admin SDK.

---

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Project selected: `firebase use appliance-bot`

---

## Deployment Steps

### 1. Navigate to Functions Directory

```bash
cd functions
```

### 2. Install Dependencies (if not already installed)

```bash
npm install
```

### 3. Deploy Cloud Function

```bash
# Deploy only the createUser function
firebase deploy --only functions:createUser

# OR deploy all functions
firebase deploy --only functions
```

### 4. Verify Deployment

After deployment, the function will be available at:
```
https://us-central1-appliance-bot.cloudfunctions.net/createUser
```

Test the deployment:
```bash
curl -X POST https://us-central1-appliance-bot.cloudfunctions.net/createUser \
  -H "Content-Type: application/json" \
  -d '{"test":"check"}'
```

Expected response for invalid request: `400` or `403` (not `404`)

---

## Function Details

**Function Name:** `createUser`  
**Region:** `us-central1`  
**Runtime:** Node.js 20  
**Trigger:** HTTP Request (POST)

**Required Parameters:**
- `username` (string, required)
- `password` (string, required)
- `role` (string, required: "admin", "agent", or "processor")
- `adminUid` (string, required) - UID of admin creating the user
- `email` (string, optional) - User email (generated if not provided)

**Response:**
- Success (200): `{ success: true, userId, email, username, role }`
- Error (400/403/500): `{ error: "error message" }`

---

## Security

The Cloud Function:
- ✅ Verifies admin role before creating users
- ✅ Uses Firebase Admin SDK (bypasses database rules)
- ✅ Creates user in both Firebase Auth and database
- ✅ Logs security events
- ✅ Validates all input parameters

---

## Troubleshooting

### Function Not Found (404)
- Ensure function is deployed: `firebase functions:list`
- Check function name matches: `createUser`
- Verify region: `us-central1`

### Permission Denied (403)
- Verify adminUid is provided
- Verify admin user exists in database
- Verify admin user has role "admin"

### Deployment Fails
- Check Firebase CLI is logged in: `firebase login:list`
- Verify project is selected: `firebase use`
- Check function code for syntax errors
- Review deployment logs: `firebase functions:log`

---

## After Deployment

1. Test user creation from admin panel
2. Verify admin stays logged in
3. Verify user created in Firebase Auth
4. Verify user created in database
5. Verify security log entry created

---

**Status:** Ready for deployment  
**Last Updated:** 2026-01-14
