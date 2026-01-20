# Domain Rename Instructions - Remove "insurance"

## 🚨 Current Issue

**Current Project:** `appliance_insurance_form`
**Current Domain:** `applianceinsuranceform.vercel.app`
**Problem:** Contains "insurance" - NOT ALLOWED

## 🎯 Recommended New Domain

**Suggested Project Name:** `appliance-cover-form`
**New Domain:** `appliance-cover-form.vercel.app`
**Reason:** Clear, professional, no "insurance" word

## 📋 Steps to Rename Project

### Step 1: Rename in Vercel Dashboard (REQUIRED - Manual Step)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dan-ai-mate/appliance_insurance_form/settings/general

2. **Rename Project:**
   - Find **"Project Name"** field
   - Change from: `appliance_insurance_form`
   - Change to: `appliance-cover-form` (or your preferred name)
   - Click **"Save"**

3. **New Domain:**
   - Will automatically become: `appliance-cover-form.vercel.app`
   - Takes effect immediately

### Step 2: Update Local Configuration

After renaming in dashboard, I will:
- Update `.vercel/project.json` with new project name
- Link to renamed project
- Deploy all fixes to new domain

### Step 3: Update Firebase Authorized Domains

**CRITICAL - Must be done manually:**
1. Go to: https://console.firebase.google.com
2. Select your project
3. Go to: **Authentication** → **Authorized domains**
4. **Remove:** `applianceinsuranceform.vercel.app`
5. **Add:** `appliance-cover-form.vercel.app`
6. Click **"Save"**

## ⚠️ Alternative Domain Options

If you prefer a different name:
- `appliance-cover-portal.vercel.app`
- `appliance-form-app.vercel.app`
- `appliance-cover.vercel.app`

**Let me know which one you want, or if you've already renamed it!**
