'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { DodoPayments } from 'dodopayments-checkout';
import { Check, Zap, Shield, Rocket, Loader2 } from 'lucide-react';
import Link from 'next/link';

const PRICING_PLANS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for quick, one-off secure sharing.',
    features: [
      'Up to 50MB file uploads',
      'End-to-End Encryption',
      'Self-destructing links',
      'Standard support',
    ],
    buttonText: 'Current Plan',
    buttonLink: '/create',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For power users who need more space and security.',
    features: [
      'Up to 500MB file uploads',
      'Password Protection',
      'Custom expiration (up to 30 days)',
      'IP Access Restrictions',
      'Advanced link tracking',
      'Priority Support',
      'API Access Key',
    ],
    buttonText: 'Upgrade to Pro',
    productId: 'p_29', // TODO: User should update this with their real Dodo Product ID
    highlight: true,
  },
];

export default function PricingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize Dodo Payments
    DodoPayments.Initialize({
      mode: "test", // Change to "live" for production
    });
  }, []);

  const handleUpgrade = async (productId: string) => {
    if (!isSignedIn) return;

    try {
      setIsLoading(true);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Open Dodo Checkout Overlay
      DodoPayments.Checkout.open({
        checkoutUrl: data.checkoutUrl,
      });
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Secure your digital life with Ilusion. Choose the plan that fits your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                plan.highlight
                  ? 'bg-white/[0.03] border-accent/50 shadow-[0_0_40px_-15px_rgba(99,102,241,0.3)] scale-105 z-10'
                  : 'bg-white/[0.01] border-white/10 hover:border-white/20'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.highlight ? (
                isSignedIn ? (
                  <button
                    onClick={() => handleUpgrade(plan.productId!)}
                    disabled={isLoading}
                    className="w-full btn-primary !py-4 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        {plan.buttonText}
                      </>
                    )}
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button className="w-full btn-primary !py-4">Sign in to Upgrade</button>
                  </SignInButton>
                )
              ) : (
                <Link
                  href={plan.buttonLink || '#'}
                  className="w-full block text-center py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium"
                >
                  {plan.buttonText}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
          <div className="p-6">
            <Shield className="w-10 h-10 text-accent mx-auto mb-4" />
            <h4 className="font-bold mb-2">Zero-Knowledge</h4>
            <p className="text-sm text-muted-foreground">
              We never see your decryption keys. Everything is encrypted on your device.
            </p>
          </div>
          <div className="p-6">
            <Rocket className="w-10 h-10 text-accent mx-auto mb-4" />
            <h4 className="font-bold mb-2">Lightning Fast</h4>
            <p className="text-sm text-muted-foreground">
              Optimized uploads and global CDN ensure your links load instantly anywhere.
            </p>
          </div>
          <div className="p-6">
            <Check className="w-10 h-10 text-accent mx-auto mb-4" />
            <h4 className="font-bold mb-2">Self-Destruct</h4>
            <p className="text-sm text-muted-foreground">
              Links burn automatically after reading or expiration. No traces left behind.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
