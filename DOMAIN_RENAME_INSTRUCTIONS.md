# Domain Rename Instructions - customer.web.from.flash

## ✅ Completed

1. ✅ Updated local project config (`.vercel/project.json`)
2. ✅ Updated all documentation files
3. ✅ Created custom domain setup guide

## ⏳ Action Required: Rename Project in Vercel Dashboard

Since the Vercel CLI doesn't have a rename command, you need to rename the project via the dashboard:

### Steps:

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dan-ai-mate/appliance-form-app/settings/general

2. **Rename Project**:
   - Find **"Project Name"** field
   - Change from: `appliance-form-app`
   - Change to: `customer-web-from-flash`
   - Click **"Save"**

3. **Verify**:
   - New URL will be: https://customer-web-from-flash.vercel.app
   - Old URL will redirect to new one

---

## ⏳ Action Required: Add Custom Domain

### Steps:

1. **Go to Domain Settings**:
   - Visit: https://vercel.com/dan-ai-mate/customer-web-from-flash/settings/domains
   - (Or go to project settings → Domains tab)

2. **Add Domain**:
   - Click **"Add Domain"**
   - Enter: `customer.web.from.flash`
   - Click **"Add"**

3. **Configure DNS**:
   - Vercel will show DNS configuration instructions
   - Add CNAME or A record at your domain registrar
   - For `customer.web.from.flash`, you need to configure DNS for the `flash` domain

4. **Wait for SSL**:
   - Vercel automatically provisions SSL (1-5 minutes)
   - Green checkmark appears when ready

---

## 📋 DNS Configuration

At your domain registrar (where you manage `flash` domain):

**Add CNAME Record**:
```
Type: CNAME
Name: customer.web.from
Value: cname.vercel-dns.com
TTL: 3600
```

**Or A Record** (if CNAME not supported):
```
Type: A
Name: customer.web.from
Value: [Vercel will provide IP addresses]
TTL: 3600
```

---

## 🔗 Quick Links

- **Rename Project**: https://vercel.com/dan-ai-mate/appliance-form-app/settings/general
- **Add Domain**: https://vercel.com/dan-ai-mate/customer-web-from-flash/settings/domains
- **Project Dashboard**: https://vercel.com/dan-ai-mate/customer-web-from-flash

---

## ✅ After Completion

Once both are done:

1. **Test New URLs**:
   - https://customer-web-from-flash.vercel.app
   - https://customer.web.from.flash

2. **Verify Login**:
   - Both URLs should work
   - Login should function normally

3. **Update Any External Links**:
   - Update bookmarks
   - Update any email templates
   - Update any documentation shared externally

---

## 📝 Files Updated

All documentation has been updated with new domain:
- ✅ `USER_GUIDE.md`
- ✅ `PROJECT_STATUS.md`
- ✅ `SECURITY_REPORT.md`
- ✅ `LOG_VIEWING_GUIDE.md`
- ✅ `DOMAIN_CHANGE_GUIDE.md`
- ✅ `.vercel/project.json`

---

**Need Help?** See `CUSTOM_DOMAIN_SETUP.md` for detailed instructions.
