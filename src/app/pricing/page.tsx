'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { DodoEmbeddedCheckout } from '@/components/DodoEmbeddedCheckout';
import { Check, Zap, Shield, Rocket, Loader2, Lock, ArrowRight } from 'lucide-react';
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
    price: '$2',
    period: '/month',
    description: 'For power users who need more space and security.',
    features: [
      'Up to 100MB file uploads',
      'Password Protection',
      'Custom expiration (up to 30 days)',
      'IP Access Restrictions',
      'Advanced link tracking',
      'Priority Support',
      'API Access Key',
    ],
    buttonText: 'Upgrade to Pro',
    productId: 'pdt_0NejTudTcUkCYcSyOLm2L',
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
      description: 'Perfect for quick, one-off secure sharing.',
      features: [
        'Up to 50MB file uploads',
        'End-to-End Encryption',
        'Self-destructing links',
        'Standard support',
      ],
      buttonText: !isUserPro ? 'Current Plan' : 'Basic Plan',
      buttonLink: '/create',
      highlight: false,
    },
    {
      name: 'Pro Monthly',
      price: '$2',
      period: '/month',
      description: 'For power users who need more space and security.',
      features: [
        'Up to 100MB file uploads',
        'Password Protection',
        'Custom expiration (up to 30 days)',
        'IP Access Restrictions',
        'Advanced link tracking',
        'Priority Support',
        'API Access Key',
      ],
      buttonText: isUserPro ? 'Active Plan' : 'Upgrade to Pro',
      productId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO,
      highlight: false,
    },
    {
      name: 'Pro Yearly',
      price: '$18',
      period: '/year',
      description: 'Professional security at the best possible value.',
      features: [
        'Everything in Monthly',
        '25% Savings',
        '365 Days of Pro access',
        'Priority Support',
        'Advanced link tracking',
        'Priority Support',
        'API Access Key',
      ],
      buttonText: isUserPro ? 'Active Plan' : 'Upgrade to Pro',
      productId: process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_YEARLY,
      highlight: true,
      badge: 'Best Value — Save 25%'
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
        </div>
 
        <div className="grid lg:grid-cols-3 gap-8 relative z-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`group relative p-10 rounded-[3rem] border transition-all duration-500 overflow-hidden ${
                plan.highlight
                  ? 'bg-elevated border-accent/40 shadow-2xl shadow-accent/20 scale-[1.02] z-20'
                  : 'bg-white/[0.01] border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
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
                {plan.productId ? (
                  isSignedIn ? (
                    loadingProfile ? (
                      <button className="w-full py-4.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-sm font-bold" disabled>
                        <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                      </button>
                    ) : isUserPro ? (
                      <Link
                        href="/dashboard"
                        className="w-full block text-center py-4.5 rounded-2xl bg-accent/10 border border-accent/20 text-accent font-bold hover:bg-accent/20 transition-all text-sm uppercase tracking-widest"
                      >
                        Active Plan — Open Dashboard
                      </Link>
                    ) : (
                      <div className="hover:scale-[1.01] transition-transform">
                        <DodoEmbeddedCheckout productId={plan.productId} source={source} />
                      </div>
                    )
                  ) : (
                    <SignInButton mode="modal">
                      <button className="w-full btn-primary !py-4.5 !rounded-2xl !text-sm font-bold uppercase tracking-widest shadow-xl shadow-accent/20">
                        Sign in to Upgrade
                      </button>
                    </SignInButton>
                  )
                ) : (
                  <Link
                    href={plan.buttonLink || '#'}
                    className={`w-full block text-center py-4.5 rounded-2xl border transition-all text-sm font-bold uppercase tracking-widest ${
                      !isUserPro && plan.name === 'Free'
                        ? 'bg-white/[0.03] border-white/10 text-muted-foreground cursor-default' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-foreground'
                    }`}
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
    </div>
  );
}
