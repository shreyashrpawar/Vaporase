import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
});

import { createHmac } from 'crypto';

// This is the webhook handler for Dodo Payments
export async function POST(req: Request) {
  try {
    const body = await req.text(); // Get raw body for signature verification
    const signature = req.headers.get('x-dodo-signature');
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    // Verify signature if secret is provided
    if (webhookSecret && signature) {
      const computedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (computedSignature !== signature) {
        console.error('Webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    const eventType = payload.type;
    const data = payload.data;

    console.log(`Received Dodo Webhook: ${eventType}`);

    // Handle payment success
    if (eventType === 'payment.succeeded') {
      // Dodo Payments includes our metadata in the data object
      const userId = data?.metadata?.user_id || payload?.metadata?.user_id;

      if (userId) {
        const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || process.env.DODO_PRODUCT_ID_PRO;
        const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY || process.env.DODO_PRODUCT_ID_YEARLY;
        
        // Robust product ID detection - checking top level and product_cart array
        const productId = String(
          data?.product_id || 
          data?.productId || 
          data?.product?.id || 
          data?.product_cart?.[0]?.product_id || 
          data?.product_cart?.[0]?.productId ||
          ''
        ).trim();
        
        const cleanYearlyId = String(YEARLY_PRODUCT_ID || '').trim();

        const expiryDate = new Date();
        if (productId === cleanYearlyId && cleanYearlyId !== '') {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setDate(expiryDate.getDate() + 30);
        }

        // Update user to Pro status in our database
        await db.update(userProfiles)
          .set({ 
            plan: 'pro', 
            planExpiresAt: expiryDate,
            updatedAt: new Date() 
          })
          .where(eq(userProfiles.userId, userId));
        
        console.log(`User ${userId} upgraded to PRO via one-time payment. Expires: ${expiryDate}`);
      } else {
        console.warn('Webhook received without metadata user_id', data?.metadata);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
