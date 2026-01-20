# Domain Change Options for Vercel

**Goal:** Replace flagged domain `customer-web-from-flash.vercel.app` to resolve Google Safe Browsing false positive

## 🎯 Option 1: Complete Custom Domain Setup (Recommended)

**Domain:** `customer.web.from.flash`
**Status:** Added to Vercel, DNS configuration pending
**Why Recommended:** Custom domains have better reputation and are less likely to trigger false positives

### Steps to Complete:

#### 1. Configure DNS at Your Domain Registrar
**Domain:** `customer.web.from.flash` (or just `flash` if that's your domain registrar)

**DNS Records to Add:**
```
Type: CNAME
Name: customer.web
Value: cname.vercel-dns.com
TTL: 300 (5 minutes)
```

#### 2. Verify DNS Propagation
```bash
# Check if DNS is configured correctly
dig customer.web.from.flash

# Should show CNAME pointing to cname.vercel-dns.com
```

#### 3. Wait for Vercel SSL Certificate
- Vercel will automatically provision SSL certificate
- Usually takes 1-5 minutes after DNS is correct
- Check Vercel dashboard for domain status

#### 4. Test the Custom Domain
```bash
curl -I https://customer.web.from.flash
# Should return HTTP 200 OK
```

#### 5. Update Firebase Authorized Domains
- Go to Firebase Console → Authentication → Authorized domains
- Add: `customer.web.from.flash`
- Remove old domain if needed

## 🚀 Option 2: Change Vercel Subdomain (Immediate)

**Current:** `customer-web-from-flash.vercel.app`
**New:** Choose a different subdomain (e.g., `appliance-portal.vercel.app`)

### Steps:

#### 1. Via Vercel Dashboard
1. Go to: https://vercel.com/dashboard → Your Project → Settings → General
2. Change "Project Name" field
3. Click "Save"
4. New URL will be: `your-new-name.vercel.app`

#### 2. Update Documentation
- Update `USER_GUIDE.md` with new URL
- Update any hardcoded references
- Update Firebase authorized domains

#### 3. Test New Domain
```bash
curl -I https://your-new-name.vercel.app
```

## 📊 Comparison: Custom Domain vs New Subdomain

| Factor | Custom Domain | New Vercel Subdomain |
|--------|---------------|---------------------|
| **Setup Time** | 1-24 hours (DNS propagation) | 5 minutes |
| **False Positive Risk** | Lower (established domain) | Medium (still Vercel subdomain) |
| **Professional Appearance** | ✅ Better | ⚠️ Still .vercel.app |
| **SEO/Branding** | ✅ Excellent | ❌ Poor |
| **Cost** | Domain registration | Free |
| **Google Trust** | ✅ Higher | ⚠️ Lower |

## 🎯 Recommendation: Complete Custom Domain Setup

**Why:** Custom domains have significantly better reputation and are much less likely to trigger Google Safe Browsing false positives. The setup is already 90% complete - you just need to configure DNS.

### If DNS Configuration is Complex:
1. **Check your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Find DNS management section**
3. **Add the CNAME record as specified**
4. **Wait 1-2 hours for propagation**
5. **Test the domain**

### Alternative Quick Fix:
If you want immediate resolution, change to a different Vercel subdomain temporarily while setting up the custom domain.

## 📋 Implementation Checklist

### For Custom Domain (Recommended):
- [ ] Configure DNS CNAME record at domain registrar
- [ ] Wait for DNS propagation (1-2 hours)
- [ ] Verify SSL certificate in Vercel dashboard
- [ ] Test domain accessibility
- [ ] Update Firebase authorized domains
- [ ] Update documentation and user guides
- [ ] Test all functionality on new domain

### For New Vercel Subdomain (Quick):
- [ ] Change project name in Vercel dashboard
- [ ] Update Firebase authorized domains
- [ ] Update documentation
- [ ] Test all functionality

## 🚨 Important Notes

### Firebase Domain Updates Required
Regardless of which option you choose, you MUST update Firebase:
- **Authentication → Authorized domains**
- Add the new domain, remove the old one
- This prevents CORS errors

### Testing After Change
1. **Clear browser cache/cookies** for the old domain
2. **Test in incognito mode** to avoid cached data
3. **Check all user roles:** Admin, Agent, Processor
4. **Verify form submissions** work correctly
5. **Test admin panel** functionality

### Google Safe Browsing
- **New domains may still show warnings** initially
- **Report any false positives** immediately using the guide
- **Monitor for 24-48 hours** after domain change

## 🎯 Next Steps

**Recommended:** Complete the custom domain setup for `customer.web.from.flash`
**Quick Fix:** Change to a different Vercel subdomain immediately

Which approach would you prefer? The custom domain will provide the best long-term solution, but the Vercel subdomain change can be done in 5 minutes.