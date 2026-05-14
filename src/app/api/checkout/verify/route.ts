import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment: 'live_mode',
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription_id, payment_id } = await req.json();

    if (!subscription_id && !payment_id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO;
    const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY;

    let isValid = false;
    let productId = '';

    if (subscription_id) {
      const subscription = await dodo.subscriptions.retrieve(subscription_id);
      isValid = subscription && (subscription.status === 'active' || subscription.status === 'pending');
      productId = (subscription as any).product_id;
    } else if (payment_id) {
      const payment = await dodo.payments.retrieve(payment_id);
      // Use any cast to bypass strict status type check which might be missing 'succeeded' or 'captured' in some SDK versions
      const status = (payment as any).status;
      isValid = payment && (status === 'succeeded' || status === 'captured');
      productId = (payment as any).product_id;
    }

    if (isValid) {
      const expiryDate = new Date();
      
      // Handle Yearly vs Monthly expiration
      if (productId === YEARLY_PRODUCT_ID) {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        expiryDate.setDate(expiryDate.getDate() + 30);
      }

      await db.update(userProfiles)
        .set({ 
          plan: 'pro', 
          planExpiresAt: expiryDate,
          updatedAt: new Date() 
        })
        .where(eq(userProfiles.userId, userId));
      
      return NextResponse.json({ success: true, plan: 'pro', expiresAt: expiryDate });
    } else {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
