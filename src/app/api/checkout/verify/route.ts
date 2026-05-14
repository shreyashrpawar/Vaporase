import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment: 'test_mode',
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

    const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || process.env.DODO_PRODUCT_ID_PRO;
    const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY || process.env.DODO_PRODUCT_ID_YEARLY;

    let isValid = false;
    let productId = '';

    if (subscription_id) {
      const subscription = await dodo.subscriptions.retrieve(subscription_id);
      isValid = subscription && (subscription.status === 'active' || subscription.status === 'pending');
      // SDK might return snake_case or camelCase
      productId = (subscription as any).product_id || (subscription as any).productId;
    } else if (payment_id) {
      const payment = await dodo.payments.retrieve(payment_id);
      const status = (payment as any).status;
      isValid = payment && (status === 'succeeded' || status === 'captured');
      productId = (payment as any).product_id || (payment as any).productId;
    }

    console.log('Verification Debug:', { productId, YEARLY_PRODUCT_ID, isValid });

    if (isValid) {
      const expiryDate = new Date();
      
      // Handle Yearly vs Monthly expiration
      // Be extra careful with comparison - ensure both are strings and trimmed
      const cleanProductId = String(productId || '').trim();
      const cleanYearlyId = String(YEARLY_PRODUCT_ID || '').trim();

      if (cleanProductId === cleanYearlyId && cleanYearlyId !== '') {
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
