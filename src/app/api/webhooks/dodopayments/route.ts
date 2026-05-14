import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// This is the webhook handler for Dodo Payments
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload.type;
    const data = payload.data;

    console.log(`Received Dodo Webhook: ${eventType}`);

    // Handle payment or subscription success
    if (
      eventType === 'payment.succeeded' || 
      eventType === 'subscription.created' || 
      eventType === 'subscription.active'
    ) {
      // Dodo Payments includes our metadata in the data object
      const userId = data?.metadata?.user_id || payload?.metadata?.user_id;

      if (userId) {
        const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO;
        const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY;
        const productId = data?.product_id || data?.product?.id;

        const expiryDate = new Date();
        if (productId === YEARLY_PRODUCT_ID) {
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
        
        console.log(`User ${userId} upgraded to PRO (${productId === YEARLY_PRODUCT_ID ? 'Yearly' : 'Monthly'}). Expires: ${expiryDate}`);
      } else {
        console.warn('Webhook received without external_id (userId)', data?.metadata);
      }
    }

    // Handle cancellations if needed
    if (eventType === 'subscription.cancelled') {
      const userId = data?.metadata?.user_id || payload?.metadata?.user_id;
      if (userId) {
        await db.update(userProfiles)
          .set({ plan: 'free', updatedAt: new Date() })
          .where(eq(userProfiles.userId, userId));
        console.log(`User ${userId} subscription cancelled`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
