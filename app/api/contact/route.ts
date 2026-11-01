import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  try {
    const ipLimit = await applyRateLimit(req, {
      limit: 10,
      ipLimit: 10,
      windowMs: 60 * 60 * 1000,
      keyPrefix: 'contact_ip',
    });
    if (!ipLimit.allowed && ipLimit.errorResponse) {
      return ipLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, 16 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }

    const body = parsed.data || {};
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 150) : '';
    const topic = typeof body.topic === 'string' ? body.topic.trim().slice(0, 50) : 'general';
    const orderRef = typeof body.orderReference === 'string' ? body.orderReference.trim().slice(0, 80) : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Please provide your name (at least 2 characters).', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    if (!message || message.length < 10 || message.length > 4000) {
      return NextResponse.json(
        {
          error: 'Message must be between 10 and 4000 characters.',
          code: 'INVALID_MESSAGE',
        },
        { status: 400 }
      );
    }

    const userLimit = await applyRateLimit(
      req,
      {
        limit: 5,
        ipLimit: 10,
        windowMs: 60 * 60 * 1000,
        keyPrefix: 'contact_email',
      },
      email
    );
    if (!userLimit.allowed && userLimit.errorResponse) {
      return userLimit.errorResponse;
    }

    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const supportInbox = process.env.SUPPORT_EMAIL || 'support@jobmatch.ai';

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeTopic = escapeHtml(topic);
    const safeOrderRef = escapeHtml(orderRef || 'N/A');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

    await sendEmail({
      to: supportInbox,
      subject: `[JobMatch Support ${ticketId}] (${safeTopic.toUpperCase()}) from ${safeName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="margin-top: 0; color: #111827;">New Support Inquiry (${ticketId})</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Topic:</strong> ${safeTopic}</p>
          <p><strong>Order Reference:</strong> ${safeOrderRef}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="line-height: 1.6; color: #374151;">${safeMessage}</p>
        </div>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        ticketId,
        message: 'Your message has been received. Our support team will reply within 1–2 business days.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Contact API Error]:', error);
    return NextResponse.json(
      { error: 'Could not submit your message right now. Please email support@jobmatch.ai.' },
      { status: 500 }
    );
  }
}

