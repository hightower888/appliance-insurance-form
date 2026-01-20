import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Allowed origins for CORS
const allowedOrigins = [
  'https://sales-form-chi.vercel.app',
  // Add other allowed origins here
  // 'https://your-custom-domain.com',
];

export function middleware(request: NextRequest) {
  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Clone request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Get origin from request
  const origin = request.headers.get('origin');

  // Handle CORS
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    if (origin && allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }
    return new NextResponse(null, { status: 403 });
  }

  // Set CSP header with nonce (NO unsafe-inline or unsafe-eval)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://*.vercel.app https://*.vercel-insights.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://api.postcodes.io https://*.vercel.app;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // Remove Next.js specific headers (hide framework details)
  response.headers.delete('x-nextjs-prerender');
  response.headers.delete('x-nextjs-stale-time');
  response.headers.delete('x-vercel-id');
  response.headers.delete('x-vercel-cache');
  response.headers.delete('x-matched-path');

  // Add additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-Powered-By', ''); // Remove X-Powered-By

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handle CORS there)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
