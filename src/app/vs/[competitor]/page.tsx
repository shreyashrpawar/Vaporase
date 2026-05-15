'use client';

import { use } from 'react';
import Link from 'next/link';
import { Lock, Check, X, Shield, Zap, Timer, ArrowRight, ArrowLeft, Star, Smartphone, Mail, Code } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const COMPETITORS: Record<string, any> = {
  '1password-send': {
    name: '1Password Send',
    headline: 'The Ultimate 1Password Send Alternative',
    description: 'Looking for a more lightweight, ephemeral way to share secrets without the enterprise overhead?',
    pros: ['Truly ephemeral (Burn on Read)', 'Secure Inbox for guests', 'Developer-first API', 'No account required to reveal'],
    cons: ['Requires full 1Password subscription for best features', 'Corporate-focused UX', 'No guest inbox feature'],
    matrix: [
      { feature: 'Burn on Read', ilusion: true, comp: false },
      { feature: 'Guest Drop Inbox', ilusion: true, comp: false },
      { feature: 'Developer API', ilusion: true, comp: true },
      { feature: 'File Sharing', ilusion: true, comp: true },
      { feature: 'E2E Encryption', ilusion: true, comp: true },
      { feature: 'Android App', ilusion: true, comp: true },
    ]
  },
  'firefox-send': {
    name: 'Firefox Send',
    headline: 'Firefox Send is gone. Ilusion is here.',
    description: 'Since Mozilla discontinued Firefox Send, users have been looking for a worthy successor. Ilusion is built on the same principles of privacy and simplicity.',
    pros: ['Open & Transparent', 'Modern UX', 'Self-destructing by default', 'Larger file limits'],
    cons: ['Discontinued/No longer maintained', 'Security vulnerabilities in unmaintained forks'],
    matrix: [
      { feature: 'Active Support', ilusion: true, comp: false },
      { feature: 'Burn on Read', ilusion: true, comp: true },
      { feature: 'Secure Inbox', ilusion: true, comp: false },
      { feature: 'Password Protection', ilusion: true, comp: true },
      { feature: 'Global Edge Network', ilusion: true, comp: false },
    ]
  },
  'bitwarden-send': {
    name: 'Bitwarden Send',
    headline: 'Ilusion vs Bitwarden Send',
    description: 'Bitwarden is great for passwords, but Ilusion is built specifically for ephemeral sharing and secure guest drops.',
    pros: ['Dedicated "Inbox" for receiving secrets', 'Superior mobile experience', 'Lightweight & fast', 'Programmatic API keys'],
    cons: ['Part of a larger complex ecosystem', 'Inbox feature requires Bitwarden account for sender'],
    matrix: [
      { feature: 'Anonymous Guest Drops', ilusion: true, comp: false },
      { feature: 'Custom Alias Links', ilusion: true, comp: true },
      { feature: 'Mobile Android App', ilusion: true, comp: true },
      { feature: 'Burn on Read', ilusion: true, comp: true },
      { feature: 'Unified Dashboard', ilusion: true, comp: true },
    ]
  }
};

export default function ComparisonPage({ params }: { params: Promise<{ competitor: string }> }) {
  const resolvedParams = use(params);
  const data = COMPETITORS[resolvedParams.competitor] || COMPETITORS['1password-send'];

  return (
    <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* ═══ Nav ═══ */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="badge badge-accent mb-4 inline-flex items-center gap-2">
            <Star className="w-3 h-3 fill-current" />
            Comparison
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
            {data.headline}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {data.description}
          </p>
        </div>

        {/* ═══ Comparison Matrix ═══ */}
        <div className="card gradient-border p-0 overflow-hidden mb-16 animate-fade-in-up delay-100 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                  <th className="py-5 px-6 font-bold text-sm">Feature</th>
                  <th className="py-5 px-6 font-bold text-sm text-center bg-accent/5" style={{ color: 'var(--accent-primary)' }}>Ilusion.io</th>
                  <th className="py-5 px-6 font-bold text-sm text-center">{data.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {data.matrix.map((row: any) => (
                  <tr key={row.feature} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6 text-sm font-medium">{row.feature}</td>
                    <td className="py-4 px-6 text-center bg-accent/5">
                      {row.ilusion ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-destructive mx-auto" />}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.comp ? <Check className="w-5 h-5 text-success mx-auto" opacity={0.5} /> : <X className="w-5 h-5 text-destructive mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ Why Choose Ilusion? ═══ */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-accent" />
              Why switch to Ilusion?
            </h2>
            <ul className="space-y-4">
              {data.pros.map((pro: string) => (
                <li key={pro} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-sm text-muted-foreground">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card bg-accent/5 border-accent/10 p-8 flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4 text-accent-light">Ready to start?</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Experience the next generation of ephemeral sharing. No credit card required to start.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/create" className="btn-primary w-full !py-3.5 group text-center">
                Create a Secret
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/sign-up" className="btn-secondary w-full !py-3.5 text-center">
                Sign Up for Free
              </Link>
            </div>
          </div>
        </div>

        {/* ═══ Callouts ═══ */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <Smartphone className="w-8 h-8 mx-auto mb-4 text-accent opacity-50" />
            <h4 className="font-bold mb-2">Android App</h4>
            <p className="text-[11px] text-muted-foreground">Native mobile support for sharing on the go.</p>
          </div>
          <div className="text-center p-6">
            <Mail className="w-8 h-8 mx-auto mb-4 text-accent opacity-50" />
            <h4 className="font-bold mb-2">Secure Inbox</h4>
            <p className="text-[11px] text-muted-foreground">Let clients send you secrets safely.</p>
          </div>
          <div className="text-center p-6">
            <Timer className="w-8 h-8 mx-auto mb-4 text-accent opacity-50" />
            <h4 className="font-bold mb-2">Zero Log Policy</h4>
            <p className="text-[11px] text-muted-foreground">We never store your decrypted data.</p>
          </div>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 px-6 py-12 max-w-6xl mx-auto w-full border-t border-white/5 text-center">
        <p className="text-xs text-muted-foreground mb-4">
          All trademarks, service marks, trade names, and product names are the property of their respective owners.
        </p>
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  );
}
