import DodoPayments from 'dodopayments';

const dodo = new DodoPayments({
  bearerToken: 'NuDzr06ype_Fc0B9.-Z1NDuMV3TOq_llz_S9-P1k5D_-OeUFV7i9ZBRzv8VtJuclh',
  environment: 'test_mode',
});

async function test() {
  try {
    const sub = await dodo.subscriptions.retrieve('sub_0NejzV5EVzkbTY0fT0nLZ');
    console.log('Subscription:', sub);
  } catch (error: any) {
    console.error('Error Status:', error.status);
    console.error('Error Body:', error.body);
    console.error('Error Message:', error.message);
  }
}

test();
