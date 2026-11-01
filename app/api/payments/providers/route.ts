import { NextResponse } from 'next/server';
import { getEnabledProviders } from '@/lib/payments';

/**
 * GET /api/payments/providers
 * Returns the list of currently enabled payment providers and supported currencies
 * so the pricing UI only renders configured payment methods.
 */
export async function GET() {
  const result = getEnabledProviders();
  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

