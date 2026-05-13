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

    const { subscription_id } = await req.json();

    if (!subscription_id) {
      return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });
    }

    // Verify the subscription directly with Dodo Payments
    const subscription = await dodo.subscriptions.retrieve(subscription_id);

    if (subscription && (subscription.status === 'active' || subscription.status === 'pending')) {
      // Dodo Payments confirms it's active/processing
      
      // Update user to Pro status in our database
      await db.update(userProfiles)
        .set({ plan: 'pro', updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId));
      
      return NextResponse.json({ success: true, plan: 'pro' });
    } else {
      return NextResponse.json({ error: 'Subscription not active' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verify Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
