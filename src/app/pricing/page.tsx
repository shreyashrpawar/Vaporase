'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { DodoEmbeddedCheckout } from '@/components/DodoEmbeddedCheckout';
import { Check, Zap, Shield, Rocket, Loader2, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const PRICING_PLANS = [
  {
    name: 'Standard',
    price: '$0',
    description: 'Our standard high-security plan, now free for everyone.',
    features: [
      'Up to 100MB file uploads',
      'End-to-End Encryption',
      'Password Protection',
      'Custom Alias Support',
      'IP Access Restrictions',
      'Self-destructing links',
    ],
    buttonText: 'Active Plan',
    buttonLink: '/create',
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || undefined;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [verifying, setVerifying] = useState(false);

  const handlePaymentSuccess = async (paymentId?: string) => {
    setVerifying(true);
    let attempts = 0;

    if (paymentId) {
      try {
        await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_id: paymentId })
        });
      } catch (err) {
        console.error('Explicit verify failed:', err);
      }
    }
    
    const pollProfile = () => {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data?.plan === 'pro') {
            setProfile(data);
            setVerifying(false);
          } else {
            attempts++;
            if (attempts < 10) {
              setTimeout(pollProfile, 1500);
            } else {
              setVerifying(false);
            }
          }
        })
        .catch(() => {
          attempts++;
          if (attempts < 10) {
            setTimeout(pollProfile, 1500);
          } else {
            setVerifying(false);
          }
        });
    };
    
    setTimeout(pollProfile, 1000);
  };

  useEffect(() => {
    if (isSignedIn) {
      setLoadingProfile(true);
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error('Failed to fetch profile:', err))
        .finally(() => setLoadingProfile(false));
    }
  }, [isSignedIn]);

  const isUserPro = profile?.plan === 'pro';

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'The standard plan for everyday secure sharing.',
      features: [
        '50MB file uploads',
        'Single-view auto-destruct',
        'Custom Alias Links',
        'End-to-End Encryption',
      ],
      buttonText: 'Current Plan',
      buttonLink: '/create',
      highlight: false,
    },
    {
      name: 'Pro',
      price: billingCycle === 'yearly' ? '$16' : '$2',
      period: billingCycle === 'yearly' ? 'per year' : 'per month',
      badge: 'Most Popular',
      description: 'Advanced capabilities for professionals and teams.',
      features: [
        '100MB file uploads',
        'Password Protection',
        'Multi-view options',
        'IP Access Restrictions',
        'API Access Key',
      ],
      buttonText: isUserPro ? 'Active Plan' : 'Upgrade to Pro',
      productId: billingCycle === 'yearly' 
        ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY || '' 
        : process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO || '',
      highlight: true,
    },
  ];

  return (
    <div className="dot-grid min-h-screen bg-background text-foreground py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-24">
        <div className="text-center space-y-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[120px] -z-10" />
          <div className="badge badge-accent mx-auto !py-1.5 !px-4 !text-[11px] uppercase tracking-widest font-bold">
            Predictable Pricing
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Simple, Transparent <span className="text-gradient">Plans</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Choose the level of security and scale your workflow needs. No hidden fees, just pure ephemeral privacy.
          </p>

          <div className="flex items-center justify-center gap-3 pt-8">
            <span className={`text-sm font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-zinc-200 dark:bg-white/10 rounded-full p-1 transition-colors hover:bg-zinc-300 dark:hover:bg-white/20"
            >
              <div className={`w-5 h-5 bg-accent rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-2 transition-colors ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full text-[10px]">Save 33%</span>
            </span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 max-w-4xl mx-auto gap-8 relative z-10 justify-center">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative p-10 rounded-[3rem] border transition-all duration-500 overflow-hidden ${
                plan.highlight
                  ? 'bg-elevated border-accent/40 shadow-2xl shadow-accent/20 scale-[1.02] z-20'
                  : 'bg-zinc-50/50 dark:bg-white/[0.01] border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:bg-zinc-100/50 dark:hover:bg-white/[0.02]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16" />
              )}

              {plan.badge && (
                <div className="absolute top-6 right-6 bg-accent px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-accent/20">
                  {plan.badge}
                </div>
              )}

              <div className="mb-10 space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold tracking-tight">{plan.name}</h3>
                  {plan.name.includes('Pro') && <Rocket className="w-5 h-5 text-accent" />}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tighter">{plan.price}</span>
                  {plan.period && <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{plan.period}</span>}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-5 mb-12">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-4 text-sm group/feat">
                    <div className="w-6 h-6 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center shrink-0 group-hover/feat:bg-accent/10 group-hover/feat:border-accent/30 transition-all">
                      <Check className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-foreground/80 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {plan.productId && !isUserPro ? (
                  isSignedIn ? (
                    <DodoEmbeddedCheckout 
                      productId={plan.productId} 
                      source={source} 
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <SignInButton mode="modal">
                      <button className="w-full block text-center py-4.5 rounded-2xl bg-accent text-white font-bold uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all text-sm">
                        Sign in to Upgrade
                      </button>
                    </SignInButton>
                  )
                ) : (
                  <Link
                    href={plan.buttonLink || '/dashboard'}
                    className={`w-full block text-center py-4.5 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] transition-all text-sm ${plan.highlight ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'}`}
                  >
                    {plan.buttonText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-24 border-t border-white/[0.05] grid md:grid-cols-3 gap-12">
          {[
            { icon: Shield, title: 'Zero-Knowledge', desc: 'Client-side encryption ensures we never see your data.' },
            { icon: Rocket, title: 'Edge Optimized', desc: 'Global CDN ensures instant link generation and reveals.' },
            { icon: Lock, title: 'Auto-Destruction', desc: 'Every secret burns immediately upon reveal or expiry.' }
          ].map((feature) => (
            <div key={feature.title} className="space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent/20 transition-all">
                <feature.icon className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <h4 className="text-lg font-bold tracking-tight">{feature.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="p-12 bg-accent/5 border border-accent/10 rounded-[3rem] text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Large Team or Enterprise?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Need custom data retention policies, SAML SSO, or volume discounts? We offer bespoke solutions for high-stakes security environments.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 text-accent font-bold hover:underline">
            Contact Enterprise Sales <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {verifying && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in">
          <div className="card p-8 max-w-sm w-full text-center space-y-6 gradient-border">
            <div className="w-16 h-16 bg-accent/10 border border-accent/30 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Verifying Subscription</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're confirming your secure premium activation. This will only take a moment...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
