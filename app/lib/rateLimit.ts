import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding-window store for lightweight, zero-dependency rate limiting
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to keep memory footprint negligible
if (typeof setInterval !== 'undefined') {
  const gcTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  gcTimer.unref?.();
}

/**
 * Extract client IP from standard proxy and cloud headers with safe fallbacks
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export interface RateLimitConfig {
  limit: number;      // Maximum requests allowed within windowMs
  windowMs: number;   // Sliding window in milliseconds
  keyPrefix?: string; // Route/feature namespace
}

/**
 * Check if the given identifier has exceeded the configured rate limit
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetMs: config.windowMs,
    };
  }

  if (record.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.limit - record.count,
    resetMs: Math.max(0, record.resetAt - now),
  };
}

/**
 * High-level helper for Next.js Route Handlers.
 * Returns either allowed status with headers, or a ready-to-return 429 response.
 */
export function applyRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; headers: Record<string, string>; errorResponse?: NextResponse } {
  const ip = getClientIp(req);
  const identifier = `${config.keyPrefix || 'rl'}:${userId || ip}`;
  const result = checkRateLimit(identifier, config);

  const headers = {
    'X-RateLimit-Limit': String(config.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil(result.resetMs / 1000) || 1;
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً قبل إعادة المحاولة (Too many requests. Please slow down).',
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(retryAfter),
        },
      }
    );
    return { allowed: false, headers, errorResponse };
  }

  return { allowed: true, headers };
}

/**
 * Reset rate limit for a specific key (useful in test suites)
 */
export function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

/**
 * Clear all rate limits (useful in test suites)
 */
export function clearAllRateLimits() {
  rateLimitMap.clear();
}
