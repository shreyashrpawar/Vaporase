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

    const { payment_id } = await req.json();

    if (!payment_id) {
      return NextResponse.json({ error: 'Missing Payment ID' }, { status: 400 });
    }

    const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || process.env.DODO_PRODUCT_ID_PRO || 'pdt_pro';
    const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY || process.env.DODO_PRODUCT_ID_YEARLY || 'pdt_pro_yearly';

    let isValid = false;
    let productId = '';

    const payment = await dodo.payments.retrieve(payment_id);
    const status = (payment as any).status;
    isValid = payment && (status === 'succeeded' || status === 'captured');
    
    // Dodo often puts product info in a product_cart array
    productId = (payment as any).product_id || 
                (payment as any).productId || 
                (payment as any).product_cart?.[0]?.product_id || 
                (payment as any).product_cart?.[0]?.productId;

    console.log('Verification Debug:', { 
      productId, 
      YEARLY_PRODUCT_ID, 
      isValid,
      full_cart: (payment as any).product_cart 
    });

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
