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
  backend?: 'upstash' | 'mongo_ttl' | 'local';
}

export interface RateLimitResponse {
  allowed: boolean;
  headers: Record<string, string>;
  errorResponse?: NextResponse;
  response?: NextResponse;
}

export interface IRateLimitDoc extends Document {
  key: string;
  count: number;
  timestamps: number[];
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
    timestamps: {
      type: [Number],
      default: [],
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

export const RateLimitModel: Model<IRateLimitDoc> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimitDoc>('RateLimit', RateLimitSchema);

// Sliding-window local fallback store used ONLY outside production when neither Upstash nor MongoDB is configured
const fallbackStore = new Map<string, { timestamps: number[]; resetAt: number }>();

let prodUpstashWarningLogged = false;

export function resetProdUpstashWarningFlag(): void {
  prodUpstashWarningLogged = false;
}

export function isUpstashConfigured(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/+$/, '');
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (
    !url ||
    !token ||
    url.includes('replace_with_') ||
    token.includes('replace_with_') ||
    url.includes('your_') ||
    token.includes('your_')
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

/**
 * Sliding window check on local fallback store (used only in non-production dev/test).
 */
function checkLocalSlidingWindow(key: string, config: RateLimitConfig): RateLimitCheckResult {
  const maxLimit = resolveMaxLimit(config);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const record = fallbackStore.get(key);

  const validTimestamps = record
    ? record.timestamps.filter((ts) => ts > windowStart)
    : [];

  if (validTimestamps.length >= maxLimit) {
    const oldestTs = validTimestamps[0] || now;
    const resetMs = Math.max(1000, oldestTs + config.windowMs - now);
    fallbackStore.set(key, {
      timestamps: validTimestamps,
      resetAt: oldestTs + config.windowMs,
    });
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      backend: 'local',
    };
  }

  validTimestamps.push(now);
  const oldestTs = validTimestamps[0] || now;
  const resetMs = Math.max(1000, oldestTs + config.windowMs - now);
  fallbackStore.set(key, {
    timestamps: validTimestamps,
    resetAt: now + config.windowMs,
  });

  return {
    allowed: true,
    remaining: Math.max(0, maxLimit - validTimestamps.length),
    resetMs,
    backend: 'local',
  };
}

/**
 * Upstash Redis REST API Sliding Window rate limiter.
 * Uses a sorted set (`ZREMRANGEBYSCORE`, `ZADD`, `ZCARD`, `ZRANGE`, `PEXPIRE`) in a single pipeline.
 */
export async function checkUpstashRateLimit(
  key: string,
  config: RateLimitConfig,
  upstash: { url: string; token: string }
): Promise<RateLimitCheckResult | null> {
  try {
    const maxLimit = resolveMaxLimit(config);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const redisKey = `rl:sw:${key}`;
    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    const res = await fetch(`${upstash.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstash.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['ZREMRANGEBYSCORE', redisKey, '-inf', String(windowStart)],
        ['ZADD', redisKey, String(now), member],
        ['ZCARD', redisKey],
        ['ZRANGE', redisKey, '0', '0', 'WITHSCORES'],
        ['PEXPIRE', redisKey, String(config.windowMs)],
      ]),
    });

    if (!res.ok) return null;
    const data = await res.json();

    // Support both 5-command sliding window pipeline response and legacy 2-command mock response
    const isSlidingPipeline = Array.isArray(data) && data.length >= 3 && data[2]?.result !== undefined;
    const count = isSlidingPipeline
      ? Number(data[2]?.result ?? 1)
      : Number(data?.[0]?.result ?? 1);

    let resetMs = config.windowMs;
    if (isSlidingPipeline && Array.isArray(data[3]?.result) && data[3].result.length >= 2) {
      const oldestScore = Number(data[3].result[1]);
      if (Number.isFinite(oldestScore) && oldestScore > 0) {
        resetMs = Math.max(1000, oldestScore + config.windowMs - now);
      }
    } else if (!isSlidingPipeline) {
      const pttl = Number(data?.[1]?.result ?? config.windowMs);
      resetMs = pttl > 0 ? pttl : config.windowMs;
    }

    const allowed = count <= maxLimit;
    return {
      allowed,
      remaining: allowed ? Math.max(0, maxLimit - count) : 0,
      resetMs,
      backend: 'upstash',
    };
  } catch {
    return null;
  }
}

/**
 * MongoDB TTL Collection (`RateLimitModel`) Sliding Window rate limiter.
 * Used as the primary fallback in production when Upstash Redis is not configured.
 */
export async function checkMongoRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitCheckResult | null> {
  try {
    const maxLimit = resolveMaxLimit(config);
    if ((mongoose.connection.readyState as number) !== 1) {
      if (!process.env.MONGODB_URI) {
        return null;
      }
      const conn = await connectToDatabase();
      if (!conn || (conn.connection.readyState as number) !== 1) {
        return null;
      }
    }

    const nowMs = Date.now();
    const now = new Date(nowMs);
    const windowStart = nowMs - config.windowMs;
    const nextReset = new Date(nowMs + config.windowMs);

    const existingDoc = await RateLimitModel.findOne({ key });

    if (existingDoc) {
      const activeTimestamps = Array.isArray(existingDoc.timestamps) && existingDoc.timestamps.length > 0
        ? existingDoc.timestamps.filter((ts) => ts > windowStart)
        : existingDoc.resetAt && existingDoc.resetAt.getTime() > nowMs
          ? Array.from({ length: existingDoc.count }, () => existingDoc.resetAt.getTime() - config.windowMs)
          : [];

      if (activeTimestamps.length >= maxLimit) {
        const oldestTs = activeTimestamps[0] || nowMs;
        const resetMs = Math.max(1000, oldestTs + config.windowMs - nowMs);
        await RateLimitModel.updateOne(
          { key },
          {
            $set: {
              count: activeTimestamps.length,
              timestamps: activeTimestamps,
              resetAt: new Date(oldestTs + config.windowMs),
            },
          }
        );
        return {
          allowed: false,
          remaining: 0,
          resetMs,
          backend: 'mongo_ttl',
        };
      }

      activeTimestamps.push(nowMs);
      const oldestTs = activeTimestamps[0] || nowMs;
      const resetMs = Math.max(1000, oldestTs + config.windowMs - nowMs);
      await RateLimitModel.updateOne(
        { key },
        {
          $set: {
            count: activeTimestamps.length,
            timestamps: activeTimestamps,
            resetAt: nextReset,
          },
        }
      );

      return {
        allowed: true,
        remaining: Math.max(0, maxLimit - activeTimestamps.length),
        resetMs,
        backend: 'mongo_ttl',
      };
    }

    await RateLimitModel.findOneAndUpdate(
      { key },
      {
        $set: {
          count: 1,
          timestamps: [nowMs],
          resetAt: nextReset,
        },
      },
      { upsert: true, new: true }
    );

    return {
      allowed: true,
      remaining: Math.max(0, maxLimit - 1),
      resetMs: config.windowMs,
      backend: 'mongo_ttl',
    };
  } catch {
    return null;
  }
}

/**
 * Shared distributed rate limit check:
 * 1. Upstash Redis REST API with Sliding Window (if UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN are set)
 * 2. If in production and Upstash is not configured -> log warning and fall back to MongoDB TTL collection (RateLimitModel)
 * 3. Local sliding-window store only outside production when neither Upstash nor MongoDB is available
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

  if (process.env.NODE_ENV === 'production' && !upstash) {
    if (!prodUpstashWarningLogged) {
      prodUpstashWarningLogged = true;
      console.warn(
        '[RateLimit] WARNING: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured in production. Falling back to MongoDB TTL collection (RateLimit).'
      );
    }
    const mongoResult = await checkMongoRateLimit(key, config);
    if (mongoResult) {
      return mongoResult;
    }
  }

  const mongoResult = await checkMongoRateLimit(key, config);
  if (mongoResult) {
    return mongoResult;
  }

  return checkLocalSlidingWindow(key, config);
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitCheckResult {
  return checkLocalSlidingWindow(key, config);
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
  return {
    allowed,
    remaining,
    resetMs,
    backend: userResult.backend || ipResult.backend,
  };
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
 * and returns HTTP 429 with standard RateLimit + Retry-After headers when exceeded.
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
        const userRes = checkLocalSlidingWindow(userKey, userConfig);
        const ipRes = checkLocalSlidingWindow(ipKey, ipConfig);
        syncResolved = buildRateLimitResponse(
          combineRateLimitResults(userRes, ipRes),
          config
        );
      } else {
        syncResolved = buildRateLimitResponse(
          checkLocalSlidingWindow(ipKey, ipConfig),
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
