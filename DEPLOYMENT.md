# Deployment Guide - Vercel

This guide explains how to deploy the Appliance Insurance Form application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): Install with `npm i -g vercel`
3. **Git Repository**: The project should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: Leave as default (or set to project root)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `src`
   - **Install Command**: `npm install` (if needed)

3. **Environment Variables** (if needed):
   - Currently, Firebase config is hardcoded in the frontend
   - If you want to use environment variables, you can add them here

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (Select your account)
   - Link to existing project? **No** (first time) or **Yes** (subsequent deployments)
   - Project name? (Enter a name or press Enter for default)
   - Directory? **src** (or leave as default if deploying from root)

4. **Production Deployment**:
   ```bash
   vercel --prod
   ```

## Project Structure

The project is configured with:
- **Source Directory**: `src/`
- **Static Files**: All HTML, CSS, JS files in `src/`
- **Routing**: Configured in `vercel.json` to handle:
  - `/` → `login.html`
  - `/appliance_form.html`
  - `/admin.html`
  - `/processor.html`
  - All other routes fallback to `login.html`

## Firebase Configuration

The Firebase configuration is currently hardcoded in the frontend files:
- `src/auth-db.js`
- `src/appliance_form.html`
- `src/admin.html`
- `src/processor.html`

**Note**: For production, consider:
1. Using environment variables for sensitive config
2. Setting up Firebase App Check for additional security
3. Configuring CORS properly in Firebase

## Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Test form submission
- [ ] Test admin panel access
- [ ] Test processor dashboard
- [ ] Verify Firebase database connection
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)

## Custom Domain Setup

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning

## Environment Variables (Optional)

If you want to use environment variables for Firebase config:

1. In Vercel Dashboard → Project Settings → Environment Variables
2. Add variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - etc.

3. Update your HTML files to read from `process.env` or use a build step

## Troubleshooting

### 404 Errors
- Check `vercel.json` routing configuration
- Ensure files exist in `src/` directory
- Check file paths are correct

### Firebase Connection Issues
- Verify Firebase config is correct
- Check Firebase Realtime Database rules
- Ensure database is accessible from Vercel domain

### CORS Errors
- Configure Firebase to allow your Vercel domain
- Check Firebase security rules

## Continuous Deployment

Vercel automatically deploys on:
- Push to main/master branch (production)
- Push to other branches (preview deployments)
- Pull requests (preview deployments)

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Firebase configuration
4. Check `vercel.json` configuration
