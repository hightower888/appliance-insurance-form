# Change Vercel Domain - Quick Resolution

**Current Problem:** `customer-web-from-flash.vercel.app` flagged by Google Safe Browsing
**Solution:** Change to a different Vercel subdomain
**Time Required:** 5 minutes

---

## 🚀 Steps to Change Vercel Domain

### 1. Go to Vercel Dashboard
Navigate to: **https://vercel.com/dashboard**

### 2. Select Your Project
- Find the project (currently named `customer-web-from-flash`)
- Click on it to open project settings

### 3. Change Project Name
- Click **"Settings"** tab
- Click **"General"** in the left sidebar
- Find **"Project Name"** field
- **Change from:** `customer-web-from-flash`
- **Change to:** Choose a new name (suggestions below)

### 4. Save Changes
- Click **"Save"** button
- Vercel will update the domain immediately

### 5. Update Firebase Authorized Domains
- Go to: **Firebase Console** → **Authentication** → **Authorized domains**
- **Remove:** `customer-web-from-flash.vercel.app`
- **Add:** `your-new-name.vercel.app`

---

## 🎯 Suggested New Domain Names

Choose one of these (or create your own):

### Professional Options:
- `appliance-insurance-portal`
- `appliance-cover-form`
- `home-appliance-insurance`
- `appliance-protection-form`

### Simple Options:
- `appliance-form`
- `insurance-portal`
- `appliance-cover`

**New URL will be:** `your-choice.vercel.app`

---

## 🧪 Testing After Change

### 1. Test New Domain
```bash
# Test the new domain
curl -I https://your-new-name.vercel.app

# Should return HTTP 200 OK
```

### 2. Test in Browser
- Open Chrome/Firefox
- Navigate to: `https://your-new-name.vercel.app`
- **Verify:** No "Dangerous site" warning appears
- **Verify:** Login page loads correctly

### 3. Test Functionality
- Try logging in (you may need to recreate test accounts)
- Test form submission
- Verify admin panel access

---

## 📝 Documentation Updates Needed

After successful domain change, update these files:

### 1. Update URLs in Documentation
- `USER_GUIDE.md` - Change login URL
- `PROJECT_STATUS.md` - Update deployment URL
- `SECURITY_REPORT.md` - Update domain references

### 2. Update Firebase Configuration
- Already done in Step 5 above

### 3. Update Any Hardcoded URLs
- Check `src/` files for any hardcoded Vercel URLs
- Update if found

---

## ⚠️ Important Notes

### Firebase Domain Authorization
**CRITICAL:** Must update Firebase authorized domains or you'll get CORS errors!

### Test Account Recreation
You may need to recreate test user accounts since they might be tied to the old domain.

### Google Safe Browsing
- New Vercel subdomain should not be flagged initially
- Monitor for 24-48 hours
- If flagged, report as false positive immediately

### DNS Propagation
- Vercel domains work immediately (no DNS wait time)
- Changes take effect instantly

---

## 🎯 Success Criteria

After domain change:
- [ ] New Vercel URL responds with HTTP 200
- [ ] No Google Safe Browsing warning in browsers
- [ ] Firebase CORS errors resolved
- [ ] All portal functionality works
- [ ] Documentation updated with new URL

---

## 🚨 If Issues Occur

### CORS Errors After Change
```
Access to XMLHttpRequest at 'https://your-project.firebaseio.com/'
from origin 'https://your-new-domain.vercel.app' has been blocked by CORS policy
```

**Fix:** Double-check Firebase authorized domains includes the new Vercel URL.

### Still Getting Safe Browsing Warning
**Action:** Report false positive immediately:
1. Visit: https://transparencyreport.google.com/safe-browsing/search
2. Enter new domain
3. Request review if flagged

---

## 📋 Quick Checklist

- [ ] Choose new Vercel project name
- [ ] Change name in Vercel dashboard
- [ ] Update Firebase authorized domains
- [ ] Test new domain accessibility
- [ ] Test in browser (no Safe Browsing warning)
- [ ] Update documentation URLs
- [ ] Test portal functionality

**Time Estimate:** 10-15 minutes total

---

## 🎉 Expected Result

**Before:** `customer-web-from-flash.vercel.app` ❌ (flagged)
**After:** `your-new-choice.vercel.app` ✅ (clean domain)

Portal fully accessible to all users with no security warnings!