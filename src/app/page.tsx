'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Shield, Eye, Timer, FileText, ArrowRight, Lock, Zap, Sparkles, ChevronRight, Inbox, Smartphone } from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.push('/dashboard/secrets');
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) return null;

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

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className="text-sm font-medium px-3 py-2 transition-colors" style={{ color: 'var(--text-secondary)' }}>Sign In</Link>
              <Link href="/sign-up" className="btn-primary !py-2 !px-4 !text-xs">Get Started</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-sm font-medium px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
              <UserButton />
            </>
          )}
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto mesh-gradient">
        <div className="relative z-10 w-full">
          <div className="animate-fade-in-up opacity-0">
            <div className="badge badge-accent !py-1.5 !px-3 !text-[11px] mx-auto mb-6 inline-flex">
              <Sparkles className="w-3 h-3" />
              End-to-end encrypted · Self-destructing
            </div>
          </div>

          <h1 className="animate-fade-in-up opacity-0 delay-100 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5" style={{ color: 'var(--text-primary)' }}>
            Share secrets that
            <br />
            <span className="text-gradient">vanish forever</span>
          </h1>

          <p className="animate-fade-in-up opacity-0 delay-200 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Send passwords, files, and sensitive data through self-destructing links.
            Once viewed, your secret is permanently destroyed.
          </p>

          <div className="animate-fade-in-up opacity-0 delay-300 flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link href="/create" className="btn-primary !py-3.5 !px-7 !text-sm group">
              Create a Secret
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="/ilusion.apk" download className="btn-secondary !py-3.5 !px-7 !text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Download App
            </a>
          </div>

          {/* Terminal mockup */}
          <div className="animate-fade-in-up opacity-0 delay-400 max-w-lg mx-auto">
            <div className="card gradient-border p-5" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444', opacity: 0.6 }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b', opacity: 0.6 }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e', opacity: 0.6 }} />
                <span className="text-[10px] font-mono ml-2" style={{ color: 'var(--text-tertiary)' }}>ilusion.io/create</span>
              </div>
              <div className="space-y-2.5">
                <div className="h-2.5 rounded-full w-[80%] shimmer" />
                <div className="h-2.5 rounded-full w-[60%] shimmer" />
                <div className="h-2.5 rounded-full w-[40%] shimmer" />
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>🔗 ilusion.io/s/Xk9mZ...</span>
                <span className="badge badge-success !text-[9px]"><Shield className="w-2.5 h-2.5" /> Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ Features ═══ */}
      <section id="features" className="relative z-10 px-6 py-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
            Why <span className="text-gradient">Ilusion</span>?
          </h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Built for security-conscious teams who refuse to compromise.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {[
            { icon: Eye, title: 'Burn on Read', desc: 'Permanently deleted once viewed. No second chances.', color: 'var(--accent-primary)', bg: 'var(--accent-subtle)' },
            { icon: Timer, title: 'Auto-Expiry', desc: 'Set a timer. Unread secrets self-destruct.', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 10%, transparent)' },
            { icon: FileText, title: 'File Sharing', desc: 'Encrypted files up to 100MB. Ephemeral.', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
            { icon: Zap, title: 'Edge Fast', desc: 'Served from the nearest edge location.', color: '#60a5fa', bg: 'color-mix(in srgb, #3b82f6 10%, transparent)' },
          ].map((f) => (
            <div key={f.title} className="card card-glow p-5 group">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ background: f.bg }}>
                <f.icon className="w-4 h-4" style={{ color: f.color }} />
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Steps ═══ */}
      <section className="relative z-10 px-6 py-20 max-w-3xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>How it works</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Three steps. Zero complexity.</p>
        </div>
        <div className="space-y-3 stagger">
          {[
            { step: '01', title: 'Paste or Upload', desc: 'Enter text or upload a file. Encrypted before leaving your browser.' },
            { step: '02', title: 'Share the Link', desc: 'Copy the unique link. Send it through any channel.' },
            { step: '03', title: 'It Vanishes', desc: 'Once opened, permanently destroyed. The link is dead forever.' },
          ].map((s) => (
            <div key={s.step} className="card card-glow p-5 flex gap-4 items-start group">
              <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--accent-muted)' }}>
                {s.step}
              </div>
              <div>
                <h3 className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Inbox CTA ═══ */}
      <section className="relative z-10 px-6 py-16 max-w-3xl mx-auto w-full">
        <div className="card gradient-border p-8 text-center" style={{ boxShadow: 'var(--shadow-glow)' }}>
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Inbox className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Secure Drop Inbox</h2>
          <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Get your own <code className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>username.ilusion.io</code> link.
          </p>
          <Link href="/sign-up" className="btn-primary !text-sm group">
            Claim Your Inbox <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="relative z-10 px-6 py-20 max-w-3xl mx-auto w-full text-center">
        <div className="card gradient-border p-10" style={{ boxShadow: 'var(--shadow-glow)' }}>
          <h2 className="text-2xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>Ready to share securely?</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>No account required. Create your first secret in seconds.</p>
          <Link href="/create" className="btn-primary !text-sm group">
            Create a Secret — Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 px-6 py-6 max-w-6xl mx-auto w-full" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>ilusion.io — Secure Ephemeral Sharing</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <Link href="/dashboard/api-keys" className="hover:underline">API</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
