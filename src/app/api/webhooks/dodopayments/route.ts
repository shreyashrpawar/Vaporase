import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'crypto';
import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment: 'live_mode',
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface DodoWebhookPayload {
  type: string;
  data: {
    metadata?: Record<string, string>;
    product_id?: string;
    product_cart?: Array<{ product_id?: string }>;
  };
}

// ─── Manual HMAC verification (fallback / extra safety) ───────────────────────

function verifyDodoSignature(
  body: string,
  headers: Record<string, string>,
  secret: string,
): boolean {
  // Dodo signs with: webhookId + "." + webhookTimestamp + "." + body
  const webhookId        = headers['webhook-id'];
  const webhookTimestamp = headers['webhook-timestamp'];
  const webhookSignature = headers['webhook-signature'];

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error('Missing required Dodo webhook headers');
    return false;
  }

  // Reject webhooks older than 5 minutes to block replay attacks
  const timestampMs = Number(webhookTimestamp) * 1000;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    console.error('Webhook timestamp too old — possible replay attack');
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  const secretBytes   = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const computedHmac  = createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  // webhookSignature may be a space-separated list of "v1,<base64>" entries
  const signatures = webhookSignature
    .split(' ')
    .map((s) => s.replace(/^v1,/, ''));

  return signatures.some((sig) => {
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(computedHmac));
    } catch {
      return false;
    }
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.text();

    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('DODO_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Collect headers as a plain lowercase Record — required by both SDK + manual path
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // ── Step 1: SDK verification (correct positional signature) ─────────────────
    let payload: DodoWebhookPayload;
    try {
      payload = dodo.webhooks.unwrap(
        body,
        { headers, key: webhookSecret }
      ) as DodoWebhookPayload;
    } catch (sdkErr) {
      console.warn('SDK unwrap failed, attempting manual HMAC verification:', sdkErr);

      // ── Step 2: Manual fallback so a broken SDK version doesn't kill prod ──────
      if (!verifyDodoSignature(body, headers, webhookSecret)) {
        console.error('Manual HMAC verification also failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      try {
        payload = JSON.parse(body) as DodoWebhookPayload;
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
    }

    // ─── Event routing ──────────────────────────────────────────────────────────

    const { type: eventType, data } = payload;
    console.log(`Received Dodo webhook: ${eventType}`);

    if (eventType === 'payment.succeeded') {
      const userId = data?.metadata?.user_id;

      if (!userId) {
        // Log full payload in dev so you can inspect the real shape
        console.warn('payment.succeeded missing metadata.user_id', JSON.stringify(payload, null, 2));
        // Return 200 so Dodo doesn't retry — this is a data issue, not a server error
        return NextResponse.json({ received: true, warning: 'no user_id in metadata' });
      }

      const YEARLY_PRODUCT_ID = (
        process.env.DODO_PRODUCT_ID_YEARLY ??
        process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY ??
        ''
      ).trim();

      const productId = (
        data?.product_id ??
        data?.product_cart?.[0]?.product_id ??
        ''
      ).trim();

      const expiryDate = new Date();
      if (YEARLY_PRODUCT_ID && productId === YEARLY_PRODUCT_ID) {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        expiryDate.setDate(expiryDate.getDate() + 30);
      }

      await db
        .update(userProfiles)
        .set({ plan: 'pro', planExpiresAt: expiryDate, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId));

      console.log(`User ${userId} → PRO (${productId || 'unknown product'}). Expires: ${expiryDate.toISOString()}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
