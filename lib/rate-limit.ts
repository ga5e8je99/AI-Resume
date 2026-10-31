import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import mongoose, { Schema, Document, Model } from 'mongoose';
import connectToDatabase from '@/app/lib/db';

export const DEFAULT_MAX_AI_BODY_BYTES = 100 * 1024; // 100 KB max payload for AI endpoints
export const DEFAULT_MAX_AI_INPUT_CHARS = 35000;     // 35,000 chars max text input for AI endpoints

export interface RateLimitConfig {
  limit?: number;        // Maximum requests allowed within windowMs (per user / identifier)
  maxRequests?: number;  // Alias for limit
  ipLimit?: number;      // Optional separate per-IP limit (checked alongside userId)
  windowMs: number;      // Window duration in milliseconds
  keyPrefix?: string;    // Route/feature namespace
  prefix?: string;       // Alias for keyPrefix
  userId?: string;       // Optional user identifier (enables dual per-user + per-IP check)
  identifier?: string;   // Optional custom account/email identifier
  errorMessage?: string; // Optional custom error message on 429
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export interface RateLimitResponse {
  allowed: boolean;
  headers: Record<string, string>;
  errorResponse?: NextResponse;
  response?: NextResponse;
}

interface IRateLimitDoc extends Document {
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitSchema = new Schema<IRateLimitDoc>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
      default: 1,
    },
    resetAt: {
      type: Date,
      required: true,
      // MongoDB TTL index: documents automatically expire when resetAt is reached
      index: { expires: 0 },
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

const RateLimitModel: Model<IRateLimitDoc> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimitDoc>('RateLimit', RateLimitSchema);

// Local fallback store used only when neither Upstash Redis nor MongoDB is reachable
const fallbackStore = new Map<string, { count: number; resetAt: number }>();

function isUpstashConfigured(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (
    !url ||
    !token ||
    url.includes('replace_with_') ||
    token.includes('replace_with_')
  ) {
    return null;
  }
  return { url, token };
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

function resolveMaxLimit(config: RateLimitConfig): number {
  return config.limit ?? config.maxRequests ?? 30;
}

function resolveIpLimit(config: RateLimitConfig, hasUserIdentifier: boolean): number {
  const maxLimit = resolveMaxLimit(config);
  if (typeof config.ipLimit === 'number' && config.ipLimit > 0) {
    return config.ipLimit;
  }
  return hasUserIdentifier ? Math.max(maxLimit * 2, 60) : maxLimit;
}

function resolvePrefix(config: RateLimitConfig): string {
  return config.keyPrefix ?? config.prefix ?? 'rl';
}

function checkLocalFallback(key: string, config: RateLimitConfig): RateLimitCheckResult {
  const maxLimit = resolveMaxLimit(config);
  const now = Date.now();
  const record = fallbackStore.get(key);

  if (!record || now > record.resetAt) {
    fallbackStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, maxLimit - 1),
      resetMs: config.windowMs,
    };
  }

  if (record.count >= maxLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxLimit - record.count),
    resetMs: Math.max(0, record.resetAt - now),
  };
}

async function checkUpstashRateLimit(
  key: string,
  config: RateLimitConfig,
  upstash: { url: string; token: string }
): Promise<RateLimitCheckResult | null> {
  try {
    const maxLimit = resolveMaxLimit(config);
    const redisKey = `rl:${key}`;
    const res = await fetch(`${upstash.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['PTTL', redisKey],
      ]),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const count = Number(data?.[0]?.result ?? 1);
    let pttl = Number(data?.[1]?.result ?? -1);

    if (count === 1 || pttl < 0) {
      await fetch(`${upstash.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstash.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([['PEXPIRE', redisKey, config.windowMs]]),
      });
      pttl = config.windowMs;
    }

    const allowed = count <= maxLimit;
    return {
      allowed,
      remaining: allowed ? Math.max(0, maxLimit - count) : 0,
      resetMs: pttl > 0 ? pttl : config.windowMs,
    };
  } catch {
    // Intentionally ignored: fall back to MongoDB or in-memory store if Upstash is unreachable
    return null;
  }
}

async function checkMongoRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitCheckResult | null> {
  try {
    const maxLimit = resolveMaxLimit(config);
    if ((mongoose.connection.readyState as number) !== 1) {
      // Only attempt connection if MONGODB_URI is explicitly configured
      if (!process.env.MONGODB_URI) {
        return null;
      }
      const conn = await connectToDatabase();
      if (!conn || (conn.connection.readyState as number) !== 1) {
        return null;
      }
    }

    const now = new Date();
    const nextReset = new Date(now.getTime() + config.windowMs);

    // First try incrementing an active window document
    const activeDoc = await RateLimitModel.findOneAndUpdate(
      { key, resetAt: { $gt: now } },
      { $inc: { count: 1 } },
      { new: true }
    );

    if (activeDoc) {
      const resetMs = Math.max(0, activeDoc.resetAt.getTime() - now.getTime());
      const allowed = activeDoc.count <= maxLimit;
      return {
        allowed,
        remaining: allowed ? Math.max(0, maxLimit - activeDoc.count) : 0,
        resetMs,
      };
    }

    // Otherwise reset / upsert a new window
    const freshDoc = await RateLimitModel.findOneAndUpdate(
      { key },
      { $set: { count: 1, resetAt: nextReset } },
      { upsert: true, new: true }
    );

    const count = freshDoc?.count ?? 1;
    const resetMs = freshDoc
      ? Math.max(0, freshDoc.resetAt.getTime() - now.getTime())
      : config.windowMs;
    const allowed = count <= maxLimit;
    return {
      allowed,
      remaining: allowed ? Math.max(0, maxLimit - count) : 0,
      resetMs,
    };
  } catch {
    // Intentionally ignored: fall back to in-memory store if MongoDB rate-limit query fails
    return null;
  }
}

/**
 * Shared distributed rate limit check:
 * 1. Upstash Redis REST API (if UPSTASH_REDIS_REST_URL is configured)
 * 2. MongoDB TTL collection (RateLimitModel)
 * 3. Local fallback when offline
 */
export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitCheckResult> {
  const upstash = isUpstashConfigured();
  if (upstash) {
    const upstashResult = await checkUpstashRateLimit(key, config, upstash);
    if (upstashResult) {
      return upstashResult;
    }
  }

  const mongoResult = await checkMongoRateLimit(key, config);
  if (mongoResult) {
    return mongoResult;
  }

  return checkLocalFallback(key, config);
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitCheckResult {
  return checkLocalFallback(key, config);
}

function combineRateLimitResults(
  userResult: RateLimitCheckResult,
  ipResult: RateLimitCheckResult
): RateLimitCheckResult {
  const allowed = userResult.allowed && ipResult.allowed;
  const remaining = Math.min(userResult.remaining, ipResult.remaining);
  let resetMs = Math.max(userResult.resetMs, ipResult.resetMs);
  if (!userResult.allowed && ipResult.allowed) {
    resetMs = userResult.resetMs;
  } else if (!ipResult.allowed && userResult.allowed) {
    resetMs = ipResult.resetMs;
  }
  return { allowed, remaining, resetMs };
}

function buildRateLimitResponse(
  result: RateLimitCheckResult,
  config: RateLimitConfig
): RateLimitResponse {
  const maxLimit = resolveMaxLimit(config);
  const retryAfter = Math.max(1, Math.ceil(result.resetMs / 1000));
  const baseHeaders: Record<string, string> = {
    'X-RateLimit-Limit': String(maxLimit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(retryAfter),
  };

  if (!result.allowed) {
    const headers: Record<string, string> = {
      ...baseHeaders,
      'Retry-After': String(retryAfter),
    };
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
        message:
          config.errorMessage ||
          'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً قبل إعادة المحاولة (Too many requests. Please slow down).',
      },
      {
        status: 429,
        headers,
      }
    );
    return { allowed: false, headers, errorResponse, response: errorResponse };
  }

  return { allowed: true, headers: baseHeaders };
}

/**
 * Universal rate limiter for Next.js Route Handlers.
 * Enforces both per-user (when userId/identifier is present) AND per-IP limits,
 * and returns standard RateLimit + Retry-After headers on 429 responses.
 */
export function applyRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<RateLimitResponse> & RateLimitResponse {
  const ip = getClientIp(req);
  const prefix = resolvePrefix(config);
  const resolvedUserId = (userId || config.userId || config.identifier || '').trim();
  const hasUser = Boolean(resolvedUserId);

  const userConfig: RateLimitConfig = {
    ...config,
    limit: resolveMaxLimit(config),
  };
  const ipConfig: RateLimitConfig = {
    ...config,
    limit: resolveIpLimit(config, hasUser),
  };

  const userKey = hasUser ? `${prefix}:user:${resolvedUserId}` : '';
  const ipKey = `${prefix}:ip:${ip}`;

  let syncResolved: RateLimitResponse | null = null;
  const getSync = (): RateLimitResponse => {
    if (!syncResolved) {
      if (hasUser) {
        const userRes = checkLocalFallback(userKey, userConfig);
        const ipRes = checkLocalFallback(ipKey, ipConfig);
        syncResolved = buildRateLimitResponse(
          combineRateLimitResults(userRes, ipRes),
          config
        );
      } else {
        syncResolved = buildRateLimitResponse(
          checkLocalFallback(ipKey, ipConfig),
          config
        );
      }
    }
    return syncResolved;
  };

  const asyncPromise = (async () => {
    if (hasUser) {
      const [userRes, ipRes] = await Promise.all([
        checkRateLimitAsync(userKey, userConfig),
        checkRateLimitAsync(ipKey, ipConfig),
      ]);
      return buildRateLimitResponse(combineRateLimitResults(userRes, ipRes), config);
    }
    const ipRes = await checkRateLimitAsync(ipKey, ipConfig);
    return buildRateLimitResponse(ipRes, config);
  })();

  return Object.defineProperties(asyncPromise, {
    allowed: {
      get() {
        return getSync().allowed;
      },
    },
    headers: {
      get() {
        return getSync().headers;
      },
    },
    errorResponse: {
      get() {
        return getSync().errorResponse;
      },
    },
    response: {
      get() {
        return getSync().response;
      },
    },
  }) as Promise<RateLimitResponse> & RateLimitResponse;
}

/**
 * Safely reads and parses a JSON request body while enforcing a strict maximum byte size
 * (Content-Length header pre-check + actual UTF-8 byte length check) to prevent abuse on AI endpoints.
 */
export async function parseBoundedJsonBody<T = Record<string, any>>(
  req: NextRequest,
  maxBytes: number = DEFAULT_MAX_AI_BODY_BYTES
): Promise<
  | { ok: true; data: T; rawBytes: number }
  | { ok: false; errorResponse: NextResponse }
> {
  const contentLengthHeader = req.headers.get('content-length');
  if (contentLengthHeader) {
    const declaredLength = Number(contentLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      return {
        ok: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: 'PAYLOAD_TOO_LARGE',
            message: `Request body exceeds maximum allowed size of ${Math.round(maxBytes / 1024)}KB.`,
          },
          { status: 413 }
        ),
      };
    }
  }

  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'INVALID_BODY',
          message: 'Failed to read request payload.',
        },
        { status: 400 }
      ),
    };
  }

  const rawBytes = Buffer.byteLength(rawText, 'utf8');
  if (rawBytes > maxBytes) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: `Request body (${Math.ceil(rawBytes / 1024)}KB) exceeds maximum allowed size of ${Math.round(maxBytes / 1024)}KB.`,
        },
        { status: 413 }
      ),
    };
  }

  try {
    const data = JSON.parse(rawText) as T;
    return { ok: true, data, rawBytes };
  } catch {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'INVALID_JSON',
          message: 'Invalid JSON request payload.',
        },
        { status: 400 }
      ),
    };
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  fallbackStore.delete(key);
  try {
    if (mongoose.connection.readyState === 1) {
      await RateLimitModel.deleteOne({ key });
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'RateLimit' },
      extra: { context: 'resetRateLimit MongoDB deleteOne failed', key },
    });
  }
}

export async function clearAllRateLimits(): Promise<void> {
  fallbackStore.clear();
  try {
    if (mongoose.connection.readyState === 1) {
      await RateLimitModel.deleteMany({});
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'RateLimit' },
      extra: { context: 'clearAllRateLimits MongoDB deleteMany failed' },
    });
  }
}
