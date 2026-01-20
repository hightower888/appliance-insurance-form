# CSP Vercel Live Fix

**Generated:** 2025-01-09T00:00:00Z
**Issue:** CSP violation for `https://vercel.live/_next-live/feedback/feedback.js`

---

## Problem

Vercel preview deployments include a live feedback script from `vercel.live` that was being blocked by CSP.

**Error:**
```
Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' violates 
the following Content Security Policy directive: "script-src-elem 'self' 'unsafe-inline' ..."
```

---

## Solution

Added `https://vercel.live` to CSP directives in `vercel.json`:

**Updated Directives:**
- `default-src` - Added `https://vercel.live`
- `script-src` - Added `https://vercel.live`
- `script-src-elem` - Added `https://vercel.live`
- `connect-src` - Added `https://vercel.live`

---

## Deployment

**New Preview URL:**
https://customer-web-from-flash-cbhnzcj0s-dan-ai-mate.vercel.app

**Status:** ✅ Deployed with updated CSP

---

## Testing

### If Still Seeing Error:

1. **Use New Preview URL:**
   - Old URL may have cached CSP
   - New deployment has different hash in URL

2. **Clear Browser Cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or: DevTools → Network tab → "Disable cache" checkbox

3. **Verify CSP Header:**
   - Open DevTools → Network tab
   - Reload page
   - Click request → Headers tab
   - Check `Content-Security-Policy` header
   - Should include `https://vercel.live`

---

## Notes

- `vercel.live` is only needed for preview deployments
- Production deployments may not need this
- This is a legitimate Vercel service, safe to allow
- Security remains intact (still no `unsafe-eval`)

---

**Status:** ✅ Fixed and deployed
