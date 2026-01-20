# Security Fixes for sales-form-chi.vercel.app
**Date:** 2025-01-19  
**Status:** Ready to Implement

---

## Overview

This document provides step-by-step instructions to fix the 5 security vulnerabilities found during testing.

---

## Fix 1: Strengthen Content Security Policy (CRITICAL)

### Current CSP (Vulnerable):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'
```

### Problem:
- `'unsafe-inline'` allows XSS attacks
- `'unsafe-eval'` allows code injection

### Solution: Use Nonce-Based CSP

#### Option A: Next.js Middleware (Recommended)

Create or update `middleware.ts` in your Next.js project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Generate nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set CSP header with nonce
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://*.vercel.app;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://api.postcodes.io https://*.vercel.app;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### Option B: Next.js Headers API

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'nonce-{NONCE}' https://*.vercel.app;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: blob: https:;
              font-src 'self' data: https://fonts.gstatic.com;
              connect-src 'self' https://api.postcodes.io https://*.vercel.app;
              frame-ancestors 'none';
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Note:** For dynamic nonces, use middleware (Option A).

#### Option C: Move Inline Scripts to External Files

1. Find all inline scripts in your code
2. Move them to external `.js` files
3. Update CSP to remove `'unsafe-inline'`:

```javascript
// Remove this from CSP:
script-src 'self' 'unsafe-inline' 'unsafe-eval'

// Replace with:
script-src 'self' https://*.vercel.app
```

### Testing:
```bash
# After deployment, verify CSP:
curl -I https://sales-form-chi.vercel.app/auth/login | grep -i "content-security-policy"

# Should NOT contain 'unsafe-inline' or 'unsafe-eval'
```

---

## Fix 2: Restrict CORS (HIGH)

### Current CORS (Vulnerable):
```
Access-Control-Allow-Origin: *
```

### Solution:

#### Option A: Next.js API Routes

If you have API routes, update them:

```typescript
// app/api/your-endpoint/route.ts or pages/api/your-endpoint.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://sales-form-chi.vercel.app',
  'https://your-custom-domain.com', // Add your domains
];

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { data: 'your data' },
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
  
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### Option B: Next.js Middleware

Add to your `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://sales-form-chi.vercel.app',
  // Add other allowed origins
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  }
  
  // For actual requests, add CORS headers if origin is allowed
  const response = NextResponse.next();
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return response;
}
```

#### Option C: Vercel Configuration

If using `vercel.json`, update it:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://sales-form-chi.vercel.app"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        }
      ]
    }
  ]
}
```

### Testing:
```bash
# Test CORS from different origin:
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://sales-form-chi.vercel.app/api/auth/login

# Should NOT return Access-Control-Allow-Origin: *
```

---

## Fix 3: Implement Rate Limiting (HIGH)

### Solution: Use NextAuth.js Rate Limiting

Since you're using NextAuth.js, implement rate limiting:

#### Option A: NextAuth.js with Rate Limiting Middleware

Create `lib/rate-limit.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  interval: number; // Time window in ms
  uniqueTokenPerInterval: number; // Max requests per interval
}

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new Map<string, number[]>();

  return {
    check: (limit: number, token: string): boolean => {
      const now = Date.now();
      const windowStart = now - options.interval;

      const tokenTimestamps = tokenCache.get(token) || [];
      const validTimestamps = tokenTimestamps.filter(
        (ts) => ts > windowStart
      );

      if (validTimestamps.length >= limit) {
        return false; // Rate limit exceeded
      }

      validTimestamps.push(now);
      tokenCache.set(token, validTimestamps);
      return true; // Within rate limit
    },
  };
}

const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Max 500 requests per interval
});
```

#### Option B: NextAuth.js Custom Sign-In Handler

Update your NextAuth configuration:

```typescript
// app/api/auth/[...nextauth]/route.ts or pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
});

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Check rate limit
        const identifier = credentials?.email || 'unknown';
        const isAllowed = limiter.check(5, identifier); // 5 attempts per 15 min
        
        if (!isAllowed) {
          throw new Error('Too many login attempts. Please try again later.');
        }
        
        // Your authentication logic here
        // ...
      },
    }),
  ],
  // ... rest of config
};

export default NextAuth(authOptions);
```

#### Option C: Use Upstash Redis (Recommended for Production)

Install:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Create `lib/rate-limit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
  analytics: true,
});
```

Use in NextAuth:

```typescript
import { rateLimiter } from '@/lib/rate-limit';

// In authorize function:
const identifier = credentials?.email || 'unknown';
const { success } = await rateLimiter.limit(identifier);

if (!success) {
  throw new Error('Too many login attempts. Please try again later.');
}
```

### Testing:
```bash
# Test rate limiting:
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://sales-form-chi.vercel.app/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  sleep 1
done

# After 5 attempts, should return 429 Too Many Requests
```

---

## Fix 4: Hide Framework Details (MEDIUM)

### Solution: Remove Next.js Headers

#### Option A: Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide Next.js version
  poweredByHeader: false,
  
  // Custom headers to remove Next.js info
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Powered-By',
            value: '', // Remove
          },
        ],
      },
    ];
  },
  
  // Remove Next.js headers in production
  ...(process.env.NODE_ENV === 'production' && {
    generateBuildId: async () => {
      return 'build-id'; // Use static build ID
    },
  }),
};

module.exports = nextConfig;
```

#### Option B: Vercel Configuration

Update `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Powered-By",
          "value": ""
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

#### Option C: Middleware to Remove Headers

Add to `middleware.ts`:

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Remove Next.js specific headers
  response.headers.delete('x-nextjs-prerender');
  response.headers.delete('x-nextjs-stale-time');
  response.headers.delete('x-vercel-id');
  response.headers.delete('x-vercel-cache');
  response.headers.delete('x-matched-path');
  
  return response;
}
```

### Testing:
```bash
# Verify headers are removed:
curl -I https://sales-form-chi.vercel.app/auth/login | grep -i "nextjs\|vercel"

# Should return no results
```

---

## Fix 5: Generic Error Messages (MEDIUM)

### Solution: Update NextAuth.js Error Handling

#### Update NextAuth Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        try {
          // Your authentication logic
          const user = await authenticateUser(credentials);
          
          if (!user) {
            // Generic error - don't reveal why it failed
            throw new Error('Invalid credentials');
          }
          
          return user;
        } catch (error) {
          // Log detailed error server-side only
          console.error('Auth error:', error);
          
          // Return generic error to client
          throw new Error('Invalid credentials');
        }
      },
    }),
  ],
  
  // Customize error pages
  pages: {
    signIn: '/auth/login',
    error: '/auth/error', // Generic error page
  },
  
  callbacks: {
    async signIn() {
      return true;
    },
  },
};

export default NextAuth(authOptions);
```

#### Create Generic Error Page

Create `app/auth/error/page.tsx`:

```typescript
export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-gray-600">
          Unable to sign in. Please check your credentials and try again.
        </p>
        <a href="/auth/login" className="mt-4 text-blue-600 hover:underline">
          Return to login
        </a>
      </div>
    </div>
  );
}
```

#### Update API Error Responses

```typescript
// In your API routes
export async function POST(request: Request) {
  try {
    // Your logic
  } catch (error) {
    // Log detailed error
    console.error('API Error:', error);
    
    // Return generic error
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
```

### Testing:
```bash
# Test error messages:
curl -X POST https://sales-form-chi.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}'

# Should return generic error, not "NextAuth.js" or framework details
```

---

## Complete Implementation Checklist

### Priority 0 (This Week)
- [ ] Fix CSP - Remove unsafe-inline/unsafe-eval
- [ ] Restrict CORS - Change from * to specific origins

### Priority 1 (This Month)
- [ ] Implement rate limiting on login endpoint
- [ ] Hide framework-specific headers
- [ ] Use generic error messages

### Testing
- [ ] Test CSP after deployment
- [ ] Test CORS restrictions
- [ ] Test rate limiting (6+ attempts)
- [ ] Verify headers are hidden
- [ ] Verify error messages are generic

---

## Deployment Steps

1. **Make changes locally**
2. **Test in development:**
   ```bash
   npm run dev
   # Test each fix
   ```

3. **Deploy to staging** (if available):
   ```bash
   vercel --env=staging
   ```

4. **Test in staging:**
   - Verify all fixes work
   - Check headers
   - Test rate limiting

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

6. **Verify in production:**
   ```bash
   curl -I https://sales-form-chi.vercel.app/auth/login
   # Check all headers
   ```

---

## Verification Commands

After deployment, run these to verify fixes:

```bash
# 1. Check CSP (should NOT have unsafe-inline/unsafe-eval)
curl -I https://sales-form-chi.vercel.app/auth/login | grep -i "content-security-policy"

# 2. Check CORS (should NOT be *)
curl -I https://sales-form-chi.vercel.app/api/auth/login | grep -i "access-control"

# 3. Check rate limiting (6th attempt should fail)
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://sales-form-chi.vercel.app/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nHTTP: %{http_code}\n"
done

# 4. Check headers (should NOT have Next.js headers)
curl -I https://sales-form-chi.vercel.app/auth/login | grep -i "nextjs\|vercel"

# 5. Check error messages (should be generic)
curl -X POST https://sales-form-chi.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}'
```

---

## Additional Security Recommendations

1. **Add Security Headers:**
   ```typescript
   // Add to middleware.ts
   response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
   response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
   response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
   response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
   ```

2. **Implement CAPTCHA:**
   - Add reCAPTCHA or hCaptcha after 3 failed attempts
   - Use NextAuth.js callbacks to integrate

3. **Monitor Failed Logins:**
   - Log all failed login attempts
   - Set up alerts for suspicious activity
   - Use services like Sentry or LogRocket

4. **Regular Security Audits:**
   - Run security scans monthly
   - Keep dependencies updated
   - Review NextAuth.js and Next.js updates

---

## Support

If you need help implementing these fixes:
1. Check Next.js documentation: https://nextjs.org/docs
2. Check NextAuth.js documentation: https://next-auth.js.org
3. Review Vercel security best practices: https://vercel.com/docs/security

---

**Document Created:** 2025-01-19  
**Estimated Implementation Time:** 8-12 hours total
