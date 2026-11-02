import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import DataStore from '@/app/lib/datastore';

const UnsubscribeSchema = z.object({
  token: z.string().trim().min(8).max(160),
});

async function handleUnsubscribe(req: NextRequest, tokenInput: string, forceJson: boolean) {
  const rl = await applyRateLimit(req, {
    limit: 30,
    ipLimit: 60,
    windowMs: 60 * 1000,
    keyPrefix: 'job_alerts_unsub',
  });
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  const validated = UnsubscribeSchema.safeParse({ token: tokenInput });
  if (!validated.success) {
    return NextResponse.json(
      { error: 'INVALID_TOKEN', message: 'A valid unsubscribe token is required.' },
      { status: 400 }
    );
  }

  const updated = await DataStore.unsubscribeJobAlertByToken(validated.data.token);
  if (!updated) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Job alert not found or already unsubscribed.' },
      { status: 404 }
    );
  }

  const acceptHeader = req.headers.get('accept') || '';
  const wantsJson =
    forceJson ||
    req.nextUrl.searchParams.get('format') === 'json' ||
    acceptHeader.includes('application/json');

  if (wantsJson) {
    return NextResponse.json({
      success: true,
      unsubscribed: true,
      searchId: updated.id,
      query: updated.query,
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed - JobMatch AI</title>
</head>
<body style="margin:0;padding:40px 16px;background:#FAF8F4;color:#14181F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;">
  <div style="max-width:460px;margin:0 auto;background:#FFFFFF;border:1px solid #E4DFD5;border-radius:12px;padding:32px 24px;">
    <div style="display:inline-block;padding:6px 14px;border-radius:6px;background:#E3EFEA;color:#0F5C4D;font-weight:700;font-size:13px;margin-bottom:16px;">
      JobMatch AI
    </div>
    <h1 style="font-size:20px;margin:0 0 10px 0;">You have been unsubscribed</h1>
    <p style="font-size:14px;color:#4A5160;line-height:1.6;margin:0 0 24px 0;">
      Email job alerts for <strong>"${updated.query.replace(/[<>"']/g, '')}"</strong> have been turned off.
    </p>
    <a href="/jobs" style="display:inline-block;background:#0F5C4D;color:#FFFFFF;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;">
      Return to Job Search
    </a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  return handleUnsubscribe(req, token, false);
}

export async function POST(req: NextRequest) {
  let token = req.nextUrl.searchParams.get('token') || '';
  if (!token) {
    const parsed = await parseBoundedJsonBody(req, 4096).catch(() => null);
    if (parsed && parsed.ok && parsed.data?.token) {
      token = String(parsed.data.token);
    }
  }
  return handleUnsubscribe(req, token, true);
}

