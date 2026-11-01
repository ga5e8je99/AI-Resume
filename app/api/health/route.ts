import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/app/lib/db';
import DataStore from '@/app/lib/datastore';
import { getEnabledProviders } from '@/lib/payments';
import { lemonSqueezyProvider } from '@/lib/payments/providers/lemonsqueezy';
import { getCircuitBreakerState } from '@/app/lib/aiGovernance';
import { resolveVerifiedSenderAddress } from '@/lib/email';
import { getSentryEnvironment, getSentryRelease } from '@/lib/sentry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Public UptimeRobot & infrastructure health endpoint.
 * Reports database connectivity and provider configuration booleans WITHOUT exposing any secrets.
 */
export async function GET() {
  const startMs = Date.now();

  // 1. Database Connectivity Check (never exposes connection string or credentials)
  let dbStatus: 'up' | 'degraded' | 'down' = 'up';
  let dbMode: 'mongodb' | 'local_datastore' = 'local_datastore';
  let dbLatencyMs = 0;

  const dbStart = Date.now();
  const hasMongoUri = Boolean(
    process.env.MONGODB_URI &&
      !process.env.MONGODB_URI.includes('<username>') &&
      !process.env.MONGODB_URI.includes('127.0.0.1:27017/jobmatch_ci_dummy')
  );

  if (hasMongoUri) {
    try {
      const conn = await connectToDatabase();
      if (conn && mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        dbStatus = 'up';
        dbMode = 'mongodb';
      } else {
        await DataStore.getProjectDailyAiSpend();
        dbStatus = process.env.NODE_ENV === 'production' ? 'degraded' : 'up';
        dbMode = 'local_datastore';
      }
    } catch {
      try {
        await DataStore.getProjectDailyAiSpend();
        dbStatus = process.env.NODE_ENV === 'production' ? 'degraded' : 'up';
        dbMode = 'local_datastore';
      } catch {
        dbStatus = 'down';
      }
    }
  } else {
    try {
      await DataStore.getProjectDailyAiSpend();
      dbStatus = 'up';
      dbMode = 'local_datastore';
    } catch {
      dbStatus = 'down';
    }
  }
  dbLatencyMs = Math.max(0, Date.now() - dbStart);

  // 2. Provider Configuration Check (boolean flags only — zero secrets exposed)
  const { enabledProviders: enabledPaymentProviders } = getEnabledProviders();
  const lemonConfigured = lemonSqueezyProvider.isConfigured();
  const stripeConfigured = enabledPaymentProviders.includes('stripe');
  const paymobConfigured = enabledPaymentProviders.includes('paymob');

  const aiKey = (process.env.OPENAI_API_KEY || '').trim();
  const aiConfigured = Boolean(aiKey && !aiKey.includes('replace_with'));
  const aiEnabled = process.env.AI_PROVIDER_ENABLED !== 'false';
  const cbState = getCircuitBreakerState();

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const emailConfigured = Boolean(resendKey && !resendKey.includes('replace_with'));
  const senderAddr = resolveVerifiedSenderAddress();
  const verifiedDomainSender =
    senderAddr.includes('@') &&
    !senderAddr.toLowerCase().includes('@gmail.com') &&
    !senderAddr.toLowerCase().includes('@yahoo.com');

  const upstashConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      !process.env.UPSTASH_REDIS_REST_URL.includes('replace_with')
  );
  const rateLimitBackend: 'upstash' | 'mongodb_ttl' | 'memory' = upstashConfigured
    ? 'upstash'
    : process.env.NODE_ENV === 'production'
    ? 'mongodb_ttl'
    : 'memory';

  const sentryDsn = (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '').trim();
  const sentryConfigured = Boolean(
    sentryDsn && !sentryDsn.includes('examplePublicKey@o0.ingest.sentry.io')
  );

  const overallStatus: 'ok' | 'degraded' | 'down' =
    dbStatus === 'down'
      ? 'down'
      : dbStatus === 'degraded' || cbState.state === 'OPEN'
      ? 'degraded'
      : 'ok';

  const httpStatus = overallStatus === 'down' ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Math.max(0, Date.now() - startMs),
      environment: getSentryEnvironment(),
      release: getSentryRelease(),
      database: {
        status: dbStatus,
        mode: dbMode,
        latencyMs: dbLatencyMs,
      },
      providers: {
        payments: {
          configured: enabledPaymentProviders.length > 0,
          enabledProviders: enabledPaymentProviders,
          lemonsqueezy: lemonConfigured,
          stripe: stripeConfigured,
          paymob: paymobConfigured,
        },
        ai: {
          configured: aiConfigured,
          providerEnabled: aiEnabled,
          fallbackReady: true,
          circuitBreakerState: cbState.state,
        },
        email: {
          configured: emailConfigured,
          verifiedDomainSender,
        },
        rateLimit: {
          upstashConfigured,
          backend: rateLimitBackend,
        },
        monitoring: {
          sentryConfigured,
          environment: getSentryEnvironment(),
          release: getSentryRelease(),
        },
      },
    },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

/**
 * HEAD /api/health
 * Lightweight UptimeRobot HEAD probe support.
 */
export async function HEAD() {
  const res = await GET();
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  });
}
