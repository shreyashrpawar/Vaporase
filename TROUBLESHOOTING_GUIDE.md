# 🎯 Dodo Payments Troubleshooting Guide (Ilusion)

If you are seeing "Failed to start checkout", follow these steps to verify your integration.

## 1. Backend Verification
The most common cause is the backend failing to create a session due to an invalid API key or incorrect environment.

### Check your API Key
- Ensure `DODO_API_KEY` in `.env.local` is correct.
- **IMPORTANT**: If you are using a **Test API Key**, you must initialize the Dodo SDK with `environment: 'test_mode'`. 
- We have updated `src/app/api/checkout/route.ts` to explicitly use `test_mode` to match your current development environment.

### Verify Product ID
- Ensure the `productId` in `src/app/pricing/page.tsx` matches the one in your Dodo Dashboard.
- Currently set to: `pdt_0NejTudTcUkCYcSyOLm2L`

## 2. Frontend Integration
We have created a dedicated component `DodoEmbeddedCheckout.tsx` to handle the complexity of the Dodo SDK.

### Key Fixes Applied:
1. **Awaiting the SDK**: `DodoPayments.Checkout.open` is now awaited.
2. **Event Handling**: We use `onEvent` to track when the overlay actually opens or hits an error, allowing us to manage the loading spinner correctly.
3. **Error Shaking**: Added a visual shake animation if the checkout fails to start, providing better feedback.

## 3. Environment Variables
Ensure these are set in your `.env.local`:
```bash
DODO_API_KEY=NuDzr...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Next Steps
If the error persists:
1. Open your Browser Console (F12) and check the "Network" tab.
2. Look for the `/api/checkout` request.
3. If it returns 500, check the server logs.
4. If it returns 200 but the overlay doesn't appear, check the console for "Dodo Event" logs.
