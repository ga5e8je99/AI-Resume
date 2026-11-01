import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import {
  CANONICAL_FUNNEL_EVENTS,
  FunnelEvent,
  sanitizeAnalyticsProperties,
  trackServerEvent,
} from '@/lib/analytics';

const ALLOWED_CLIENT_EVENTS = new Set<string>([
  ...CANONICAL_FUNNEL_EVENTS,
  'demo_started',
  'ats_scan_completed',
  'ai_generation_used',
  'credits_exhausted',
]);

/**
 * POST /api/analytics/event
 * Receives consented client-side funnel events (after cookie consent is granted)
 * and records them into the server-side funnel buffer for the Admin Funnel Dashboard.
 * Note: `payment_succeeded` is strictly authoritative from webhooks or verified orders.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyRateLimit(req, {
      limit: 120,
      ipLimit: 180,
      windowMs: 60 * 1000,
      keyPrefix: 'analytics_event',
    });
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, 8 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }

    const eventName = String(parsed.data?.event || '').trim();
    if (!eventName || !ALLOWED_CLIENT_EVENTS.has(eventName)) {
      return NextResponse.json(
        { error: 'INVALID_EVENT', message: 'Unrecognized funnel event name.' },
        { status: 400 }
      );
    }

    const cleanProps = sanitizeAnalyticsProperties(parsed.data?.properties);

    // Block spoofed client-side payment_succeeded unless it comes from verified_order or webhook
    if (
      eventName === 'payment_succeeded' &&
      cleanProps.source !== 'verified_order' &&
      cleanProps.source !== 'webhook'
    ) {
      return NextResponse.json(
        {
          error: 'UNVERIFIED_PAYMENT_EVENT',
          message: 'payment_succeeded requires webhook or verified order confirmation.',
        },
        { status: 400 }
      );
    }

    trackServerEvent(eventName as FunnelEvent, cleanProps, {
      source: cleanProps.source === 'webhook' ? 'webhook' : 'server',
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ received: false }, { status: 500 });
  }
}

