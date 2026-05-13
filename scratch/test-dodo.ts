import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: 'NuDzr06ype_Fc0B9.-Z1NDuMV3TOq_llz_S9-P1k5D_-OeUFV7i9ZBRzv8VtJuclh',
  environment: 'test_mode',
});

async function test() {
  try {
    const checkout = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: 'pdt_0NejTudTcUkCYcSyOLm2L', quantity: 1 }],
      metadata: { user_id: 'test_user' },
      return_url: 'http://localhost:3000/dashboard',
    });
    console.log('Success:', checkout);
  } catch (error: any) {
    console.error('Error Status:', error.status);
    console.error('Error Body:', error.body);
    console.error('Error Message:', error.message);
  }
}

test();
