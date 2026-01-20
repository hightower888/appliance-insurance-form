# Custom Domain Setup: customer.web.from.flash

## Current Status

✅ **Project**: `appliance-cover-form`  
✅ **Vercel URL**: https://appliance-cover-form.vercel.app

---

## Step-by-Step: Add Custom Domain

### 1. Access Vercel Dashboard

Go to: **https://vercel.com/dan-ai-mate/customer-web-from-flash/settings/domains**

### 2. Add Domain

1. Click **"Add Domain"** button
2. Enter: `customer.web.from.flash`
3. Click **"Add"**

### 3. Configure DNS

Vercel will provide DNS configuration instructions. You'll need to add one of these:

**Option A: CNAME Record (Recommended for subdomain)**
```
Type: CNAME
Name: customer.web.from
Value: cname.vercel-dns.com
TTL: 3600 (or auto)
```

**Option B: A Record (If using root domain)**
```
Type: A
Name: @ (or customer.web.from)
Value: 76.76.21.21 (Vercel will provide exact IPs)
TTL: 3600
```

**Note**: Since your domain is `customer.web.from.flash`, you'll need to configure DNS at your domain registrar for the `flash` domain.

### 4. Wait for SSL

- Vercel automatically provisions SSL certificates
- Usually takes 1-5 minutes
- You'll see a green checkmark when ready

### 5. Verify Domain

Once DNS is configured and SSL is ready:
- Visit: **https://customer.web.from.flash**
- Should redirect to: **https://customer.web.from.flash/login.html**

---

## DNS Configuration Details

### If `flash` is your root domain:

You need to add DNS records at your domain registrar (where you manage `flash` domain):

1. **For subdomain `customer.web.from.flash`**:
   - Add CNAME: `customer.web.from` → `cname.vercel-dns.com`
   - Or add A record if CNAME not supported

2. **DNS Propagation**:
   - Can take 24-48 hours (usually much faster)
   - Check with: `dig customer.web.from.flash` or `nslookup customer.web.from.flash`

---

## Troubleshooting

### Domain Not Resolving
- Check DNS records are correct
- Wait for DNS propagation (can take up to 48 hours)
- Verify at your domain registrar

### SSL Certificate Issues
- Vercel auto-provisions SSL
- If issues, check DNS is correctly configured
- Contact Vercel support if problems persist

### Domain Already in Use
- If domain is already on another Vercel project, remove it first
- Or use a different subdomain

---

## After Setup

Once `customer.web.from.flash` is working:

1. ✅ Update `USER_GUIDE.md` (already done)
2. ✅ Update any email templates
3. ✅ Update any external links
4. ✅ Test login at new domain
5. ✅ Verify all features work

---

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dan-ai-mate/customer-web-from-flash
- **Domain Settings**: https://vercel.com/dan-ai-mate/customer-web-from-flash/settings/domains
- **Project Settings**: https://vercel.com/dan-ai-mate/customer-web-from-flash/settings/general

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs/concepts/projects/domains
- **Vercel Support**: https://vercel.com/support
