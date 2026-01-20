# Domain Change Guide

## Current Domain
- **Vercel Subdomain**: `appliance-cover-form.vercel.app`
- **Project Name**: `appliance-cover-form`

---

## Option 1: Add Custom Domain (Recommended)

If you have your own domain (e.g., `yourdomain.com`), you can add it to Vercel:

### Steps:

1. **Via Vercel Dashboard**:
   - Go to: https://vercel.com/dan-ai-mate/customer-web-from-flash/settings/domains
   - Click **"Add Domain"**
   - Enter your domain (e.g., `appliance.yourdomain.com` or `yourdomain.com`)
   - Follow DNS configuration instructions
   - Wait for SSL certificate (usually 1-5 minutes)

2. **DNS Configuration**:
   - Add a CNAME record pointing to: `cname.vercel-dns.com`
   - Or add an A record (for root domain) pointing to Vercel's IPs
   - Vercel will provide exact instructions

3. **Update Documentation**:
   - Update `USER_GUIDE.md` with new domain
   - Update any hardcoded URLs in code (if any)

---

## Option 2: Change Vercel Project Name

If you want a different Vercel subdomain (e.g., `my-app.vercel.app`):

### Steps:

1. **Via Vercel Dashboard**:
   - Go to: https://vercel.com/dan-ai-mate/customer-web-from-flash/settings/general
   - Change **"Project Name"** to your desired name
   - Click **"Save"**
   - New URL will be: `your-new-name.vercel.app`

2. **Via CLI**:
   ```bash
   Project already renamed to: customer-web-from-flash
   ```

3. **Update Local Config**:
   - Update `.vercel/project.json` if needed
   - Update documentation

---

## Option 3: Deploy to New Project

Create a completely new Vercel project:

```bash
# Remove old project link
rm -rf .vercel

# Deploy as new project
vercel

# Follow prompts to create new project
```

---

## What Needs Updating

After changing the domain, update these files:

1. **USER_GUIDE.md** - Login URL
2. **DEPLOYMENT.md** - Domain references
3. **SECURITY_REPORT.md** - Domain references
4. **Any email templates or communications** - Domain references

---

## Quick Command Reference

```bash
# List current domains
vercel domains ls

# Add domain via CLI
vercel domains add <your-domain.com>

# Remove domain
vercel domains rm <your-domain.com>

# Rename project
vercel project rename <old-name> <new-name>
```

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs/concepts/projects/domains
- **Vercel Support**: https://vercel.com/support
