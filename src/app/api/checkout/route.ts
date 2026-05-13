import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY!,
  environment: 'test_mode', // Add this
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email for better checkout experience
    const { currentUser } = await import('@clerk/nextjs/server');
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;

    const { productId, source } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const checkout = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: userEmail || '',
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Valued Customer',
      },
      billing_address: {
        country: 'US',
        zipcode: '10001',
      },
      metadata: {
        user_id: userId,
      },
      // Redirect back to dashboard after payment
      // If source is 'app', use custom deep link scheme to return to the Flutter app
      return_url: source === 'app' 
        ? 'ilusion://payment-success' 
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
    });

    return NextResponse.json({ 
      checkoutUrl: checkout.checkout_url,
      sessionId: checkout.session_id 
    });
  } catch (error: any) {
    console.error('Dodo Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
