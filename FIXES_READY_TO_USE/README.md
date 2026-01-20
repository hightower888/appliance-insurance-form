# Security Fixes - Ready to Use Files

This directory contains ready-to-use code files to fix the 5 security vulnerabilities found in sales-form-chi.vercel.app

---

## Files Included

1. **`middleware.ts`** - Next.js middleware with:
   - ✅ Strong CSP (no unsafe-inline/unsafe-eval)
   - ✅ CORS restrictions
   - ✅ Hidden framework headers
   - ✅ Additional security headers

2. **`rate-limit.ts`** - Rate limiting utility:
   - ✅ Prevents brute force attacks
   - ✅ 5 attempts per 15 minutes
   - ✅ Automatic cleanup

3. **`nextauth-with-ratelimit.ts`** - NextAuth.js configuration:
   - ✅ Rate limiting integrated
   - ✅ Generic error messages
   - ✅ Secure cookie settings

4. **`auth-error-page.tsx`** - Generic error page:
   - ✅ No framework details exposed
   - ✅ User-friendly error messages

---

## Installation Steps

### Step 1: Install Rate Limiting (Optional - for production)

For production, consider using Upstash Redis:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Then update `rate-limit.ts` to use Upstash (see FIXES_FOR_EXTERNAL_SITE.md for details).

### Step 2: Copy Files

1. **Copy `middleware.ts`** to your Next.js project root:
   ```bash
   cp middleware.ts /path/to/your/nextjs-project/middleware.ts
   ```

2. **Copy `rate-limit.ts`** to your lib directory:
   ```bash
   cp rate-limit.ts /path/to/your/nextjs-project/lib/rate-limit.ts
   ```

3. **Update your NextAuth configuration:**
   - Replace your existing NextAuth config with `nextauth-with-ratelimit.ts`
   - Update the `authenticateUser` function with your actual auth logic

4. **Create error page:**
   ```bash
   mkdir -p app/auth/error
   cp auth-error-page.tsx app/auth/error/page.tsx
   ```

### Step 3: Update Configuration

1. **Update allowed origins in `middleware.ts`:**
   ```typescript
   const allowedOrigins = [
     'https://sales-form-chi.vercel.app',
     'https://your-custom-domain.com', // Add your domains
   ];
   ```

2. **Update CSP nonce sources if needed:**
   - Add any required script sources to CSP in `middleware.ts`

### Step 4: Test Locally

```bash
npm run dev
```

Test:
- Login with wrong credentials 6 times (should be rate limited)
- Check headers (should not have unsafe-inline)
- Check CORS (should not be *)
- Check error messages (should be generic)

### Step 5: Deploy

```bash
vercel --prod
```

### Step 6: Verify

After deployment, run:

```bash
# Check CSP
curl -I https://sales-form-chi.vercel.app/auth/login | grep -i "content-security-policy"

# Check CORS
curl -I https://sales-form-chi.vercel.app/api/auth/login | grep -i "access-control"

# Test rate limiting
for i in {1..6}; do
  curl -X POST https://sales-form-chi.vercel.app/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nHTTP: %{http_code}\n"
done
```

---

## Customization

### Adjust Rate Limiting

In `rate-limit.ts`, change:
```typescript
interval: 15 * 60 * 1000, // Change 15 to your desired minutes
```

In `nextauth-with-ratelimit.ts`, change:
```typescript
checkRateLimit(identifier, 5); // Change 5 to your desired max attempts
```

### Add More Allowed Origins

In `middleware.ts`:
```typescript
const allowedOrigins = [
  'https://sales-form-chi.vercel.app',
  'https://your-domain.com',
  'https://another-domain.com',
];
```

### Customize CSP

In `middleware.ts`, update the `cspHeader` variable to add/remove sources as needed.

---

## Troubleshooting

### CSP Blocks Scripts

If CSP blocks legitimate scripts:
1. Check browser console for CSP violations
2. Add required sources to CSP in `middleware.ts`
3. Use nonces for inline scripts (already implemented)

### Rate Limiting Too Strict

If legitimate users are blocked:
1. Increase max attempts in `nextauth-with-ratelimit.ts`
2. Increase time window in `rate-limit.ts`
3. Consider IP-based rate limiting for production

### CORS Issues

If API calls fail:
1. Verify origin is in `allowedOrigins` array
2. Check that middleware is running (check Vercel logs)
3. Ensure API routes handle OPTIONS requests

---

## Support

For detailed explanations, see:
- **FIXES_FOR_EXTERNAL_SITE.md** - Complete fix documentation
- **VULNERABILITY_TEST_RESULTS.md** - Test results
- **SECURITY_TESTING_SUMMARY.md** - Quick summary

---

**Files Created:** 2025-01-19  
**Status:** Ready to implement
