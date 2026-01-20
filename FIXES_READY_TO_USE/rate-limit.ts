/**
 * Rate Limiting Utility
 * Prevents brute force attacks on login endpoints
 */

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

class RateLimiter {
  private tokenCache: Map<string, number[]>;
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.tokenCache = new Map();
    this.options = options;

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(limit: number, token: string): boolean {
    const now = Date.now();
    const windowStart = now - this.options.interval;

    const tokenTimestamps = this.tokenCache.get(token) || [];
    const validTimestamps = tokenTimestamps.filter(
      (ts) => ts > windowStart
    );

    if (validTimestamps.length >= limit) {
      return false; // Rate limit exceeded
    }

    validTimestamps.push(now);
    this.tokenCache.set(token, validTimestamps);
    return true; // Within rate limit
  }

  getRemainingAttempts(limit: number, token: string): number {
    const now = Date.now();
    const windowStart = now - this.options.interval;

    const tokenTimestamps = this.tokenCache.get(token) || [];
    const validTimestamps = tokenTimestamps.filter(
      (ts) => ts > windowStart
    );

    return Math.max(0, limit - validTimestamps.length);
  }

  reset(token: string): void {
    this.tokenCache.delete(token);
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.options.interval;

    for (const [token, timestamps] of this.tokenCache.entries()) {
      const validTimestamps = timestamps.filter((ts) => ts > windowStart);
      if (validTimestamps.length === 0) {
        this.tokenCache.delete(token);
      } else {
        this.tokenCache.set(token, validTimestamps);
      }
    }
  }
}

// Create rate limiter instance
// 5 attempts per 15 minutes
export const loginRateLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Max 500 unique tokens tracked
});

// Helper function to check rate limit
export function checkRateLimit(identifier: string, maxAttempts: number = 5): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const allowed = loginRateLimiter.check(maxAttempts, identifier);
  const remaining = loginRateLimiter.getRemainingAttempts(maxAttempts, identifier);
  const resetTime = Date.now() + 15 * 60 * 1000; // 15 minutes from now

  return {
    allowed,
    remaining,
    resetTime,
  };
}

// Reset rate limit (call on successful login)
export function resetRateLimit(identifier: string): void {
  loginRateLimiter.reset(identifier);
}
