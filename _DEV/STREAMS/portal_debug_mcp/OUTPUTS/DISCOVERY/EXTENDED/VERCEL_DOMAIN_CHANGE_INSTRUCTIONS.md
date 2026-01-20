# Vercel Domain Change - Execute Now

**Goal:** Change from flagged domain to clean Vercel subdomain
**Current:** `customer-web-from-flash.vercel.app` ❌ (blocked)
**Target:** `appliance-insurance-portal.vercel.app` ✅ (clean)

---

## 🎯 Execute Domain Change

### Step 1: Change Project Name in Vercel
1. **Open Vercel Dashboard:** https://vercel.com/dashboard
2. **Find your project:** `customer-web-from-flash`
3. **Click on the project** to open it
4. **Click "Settings"** tab
5. **Click "General"** in left sidebar
6. **Find "Project Name" field**
7. **Change from:** `customer-web-from-flash`
8. **Change to:** `appliance-insurance-portal`
9. **Click "Save"**

### Step 2: Confirm Domain Change
- **New URL:** `https://appliance-insurance-portal.vercel.app`
- Vercel will show deployment progress
- Should complete in 1-2 minutes

### Step 3: Update Firebase Authorized Domains
**CRITICAL - Do not skip!**

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Select your project**
3. **Go to:** Authentication → Authorized domains
4. **Remove:** `customer-web-from-flash.vercel.app`
5. **Add:** `appliance-insurance-portal.vercel.app`
6. **Click "Save"**

### Step 4: Test New Domain
```bash
# Test HTTP response
curl -I https://appliance-insurance-portal.vercel.app

# Should return HTTP/2 200
```

### Step 5: Test in Browser
1. **Open Chrome/Firefox**
2. **Navigate to:** `https://appliance-insurance-portal.vercel.app`
3. **Verify:** No "Dangerous site" warning
4. **Verify:** Login page loads

---

## 🧪 Functional Testing

### Test Authentication
1. **Try login** (may need to recreate test accounts)
2. **Check console** for CORS errors
3. **Verify redirects** work correctly

### Test Form Submission
1. **Fill out form** as agent user
2. **Submit form**
3. **Monitor network** for Firebase calls
4. **Verify success message**

### Test Admin Panel
1. **Login as admin**
2. **Access admin panel**
3. **Verify data loading**
4. **Test user management**

---

## 📝 Update Documentation (Optional)

After confirming everything works:

### Files to Update:
- `USER_GUIDE.md` - Change login URL
- `PROJECT_STATUS.md` - Update deployment URL
- `SECURITY_REPORT.md` - Update domain references

### Example Changes:
```markdown
# Before
Go to: https://customer-web-from-flash.vercel.app

# After
Go to: https://appliance-insurance-portal.vercel.app
```

---

## 🚨 Troubleshooting

### CORS Errors After Change
**Error:** `has been blocked by CORS policy`

**Fix:**
- Double-check Firebase authorized domains
- Ensure `appliance-insurance-portal.vercel.app` is added
- Clear browser cache and try again

### Still Getting Safe Browsing Warning
**Action:**
1. Try a different Vercel subdomain name
2. Or report false positive: https://transparencyreport.google.com/safe-browsing/search

### Vercel Deployment Issues
**Check:**
- Vercel dashboard shows successful deployment
- No build errors in deployment logs
- Project settings show correct domain

---

## ✅ Success Checklist

- [ ] Vercel project name changed to `appliance-insurance-portal`
- [ ] New domain `appliance-insurance-portal.vercel.app` working
- [ ] Firebase authorized domains updated
- [ ] No Google Safe Browsing warning in browsers
- [ ] Portal login page loads correctly
- [ ] No CORS errors in browser console
- [ ] Form submission works
- [ ] Admin panel accessible

---

## 🎉 Expected Outcome

**Domain Change Result:**
- ❌ Old: `customer-web-from-flash.vercel.app` (blocked by Google)
- ✅ New: `appliance-insurance-portal.vercel.app` (accessible to all users)

**User Experience:**
- Users can now access the portal without security warnings
- All functionality restored
- Business operations fully functional

---

## 📞 Support

If you encounter any issues:
1. Check Vercel deployment status
2. Verify Firebase authorized domains
3. Clear browser cache/cookies
4. Try incognito mode for testing

**Time to complete:** 10-15 minutes

**Result:** Portal fully accessible to all users! 🚀