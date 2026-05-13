'use client';

import React, { useEffect, useState } from 'react';
import { DodoPayments } from 'dodopayments-checkout';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import './DodoEmbeddedCheckout.css';

interface DodoEmbeddedCheckoutProps {
  productId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const DodoEmbeddedCheckout: React.FC<DodoEmbeddedCheckoutProps> = ({
  productId,
  onSuccess,
  onError,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Dodo SDK
    DodoPayments.Initialize({
      mode: 'test', // TODO: Toggle to 'live' for production
      displayType: 'overlay',
      onEvent: (event) => {
        console.log('Dodo Event:', event);
        switch (event.event_type) {
          case 'checkout.opened':
            setIsLoading(false);
            break;
          case 'checkout.closed':
            setIsLoading(false);
            if (onClose) onClose();
            break;
          case 'checkout.error':
            setIsLoading(false);
            const errMsg = (event.data as any)?.message || 'An error occurred during checkout.';
            setError(String(errMsg));
            if (onError) onError(String(errMsg));
            break;
        }
      },
    });
  }, [onClose, onError]);

  const handleStartCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Create Checkout Session on Backend
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // 2. Open the Iframe/Overlay
      await DodoPayments.Checkout.open({
        checkoutUrl: data.checkoutUrl,
      });

    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err.message || 'Failed to start checkout. Please try again.';
      setError(msg);
      if (onError) onError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="dodo-checkout-container">
      {error && (
        <div className="dodo-error-banner">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      <button
        onClick={handleStartCheckout}
        disabled={isLoading}
        className={`dodo-checkout-btn ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>Upgrade Now</span>
        )}
      </button>
    </div>
  );
};
