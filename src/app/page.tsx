'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Shield, Eye, Timer, FileText, ArrowRight, Lock, Zap, Sparkles, ChevronRight, Inbox, Smartphone, Clock, Check, Key, Code } from 'lucide-react';
import { getLocalSecrets, LocalSecret } from '@/lib/local-history';
import { useState } from 'react';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localHistory, setLocalHistory] = useState<LocalSecret[]>([]);
  const [quickAlias, setQuickAlias] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    } else {
      setLocalHistory(getLocalSecrets());
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) return null;

  return (
    <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* AEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Ilusion",
              "operatingSystem": "Web, Android",
              "applicationCategory": "SecurityApplication",
              "description": "Secure, ephemeral, and E2EE secret sharing platform for sending passwords and files via self-destructing links.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Ilusion Security",
              "url": "https://ilusion.io",
              "logo": "https://ilusion.io/icon-512x512.png",
              "sameAs": [
                "https://twitter.com/ilusion_io",
                "https://github.com/ilusion-io"
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How can I send a password securely?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To send a password securely, use a zero-knowledge tool like Ilusion.io. Simply paste the password, set a self-destruct timer, and share the generated E2EE link. The password is encrypted in your browser and deleted after the first view."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is Ilusion.io secure for GDPR and HIPAA compliance?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Ilusion.io uses client-side AES-256 encryption, meaning no sensitive data is stored in plain text on our servers. This zero-knowledge architecture helps teams maintain privacy standards required for sensitive data handling."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is a self-destructing link?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A self-destructing link is a secure URL that grants access to a piece of information (like a password or file) only once. After the link is accessed, the data is permanently purged from the server, preventing future access."
                  }
                }
              ]
            }
          ])
        }}
      />
      {/* ═══ Nav ═══ */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {!isSignedIn ? (
            <>
              <Link href="/pricing" className="text-sm font-medium px-4 py-2 hover:text-accent transition-colors" style={{ color: 'var(--text-secondary)' }}>Pricing</Link>
              <Link href="/contact" className="text-sm font-medium px-4 py-2 hover:text-accent transition-colors" style={{ color: 'var(--text-secondary)' }}>Contact</Link>
              <Link href="/view" className="text-sm font-medium px-4 py-2 hover:text-accent transition-colors" style={{ color: 'var(--text-secondary)' }}>Reveal</Link>
              <Link href="/sign-in" className="text-sm font-medium px-4 py-2 hover:text-accent transition-colors" style={{ color: 'var(--text-secondary)' }}>Sign In</Link>
              <Link href="/sign-up" className="btn-primary !py-2.5 !px-5 !text-xs !rounded-xl ml-2">Get Started</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-sm font-medium px-3 py-2" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
              <UserButton />
            </>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 glass mt-2 mx-4 rounded-2xl p-4 flex flex-col gap-2 md:hidden animate-fade-in-up z-50">
            <Link href="/pricing" className="px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Pricing</Link>
            <Link href="/contact" className="px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Contact</Link>
            <Link href="/view" className="px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Reveal Secret</Link>
            <Link href="/sign-in" className="px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>Sign In</Link>
            <Link href="/sign-up" className="btn-primary !py-3 w-full text-center mt-2">Get Started</Link>
          </div>
        )}
      </nav>

      {/* ═══ Hero ═══ */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-24 text-center max-w-4xl mx-auto mesh-gradient">
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

          <div className="animate-fade-in-up opacity-0 delay-300 flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/create" className="btn-primary !py-3.5 !px-7 !text-sm group">
              Create a Secret
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/view" className="btn-secondary !py-3.5 !px-7 !text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Reveal a Secret
            </Link>
            <div className="btn-secondary !py-3.5 !px-7 !text-sm flex items-center gap-2 opacity-50 cursor-not-allowed">
              <Smartphone className="w-4 h-4" />
              Android Coming Soon
            </div>
          </div>

          <div className="animate-fade-in-up opacity-0 delay-350 max-w-sm mx-auto mb-16">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-sm font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>
                ilusion.io/secret/
              </div>
              <input
                type="text"
                value={quickAlias}
                onChange={(e) => setQuickAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-9]/g, ''))}
                placeholder="alias-name"
                className="input !pl-[175px] !pr-10 !py-4 !text-sm font-bold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && quickAlias) {
                    router.push(`/secret/${quickAlias}`);
                  }
                }}
              />
              <button
                onClick={() => quickAlias && router.push(`/secret/${quickAlias}`)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-accent/20"
                style={{ color: 'var(--accent-primary)' }}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
              Quick access: reveal a secret using its human-readable alias.
            </p>
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
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>🔗 ilusion.io/secret/Xk9mZ...</span>
                <span className="badge badge-success !text-[9px]"><Shield className="w-2.5 h-2.5" /> Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Local History for Guests */}
        {localHistory.length > 0 && (
          <div className="relative z-10 w-full max-w-2xl mx-auto mt-20 animate-fade-in delay-500">
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Your Recent Secrets</h2>
              </div>
              <Link href="/create" className="text-xs font-medium text-accent hover:underline">Create New</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {localHistory.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  className="card card-glow p-4 flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Expires {new Date(item.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-accent transition-all" />
                </Link>
              ))}
            </div>
            {localHistory.length > 4 && (
              <p className="text-center mt-6">
                <Link href="/create" className="text-xs text-muted-foreground hover:text-accent transition-colors">
                  View all local secrets in the creation page
                </Link>
              </p>
            )}
          </div>
        )}
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
            { icon: Lock, title: 'Developer API', desc: 'Programmatically generate secrets via REST API.', color: 'var(--accent-primary)', bg: 'var(--accent-subtle)' },
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

      {/* ═══ Use Cases (SEO Section) ═══ */}
      <section className="relative z-10 px-6 py-20 bg-white/[0.01] border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">Built for every <span className="text-gradient">Secure Workflow</span></h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">Stop sending sensitive data over unencrypted chats. Use Ilusion for high-stakes communication.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Key className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-base font-bold">Passwords & Credentials</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send database passwords, root credentials, or social media logins to teammates without leaving a trace in your Slack or Email history.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Code className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-base font-bold">API Keys & Tokens</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Share AWS keys, Stripe tokens, or private .env variables during onboarding or debugging sessions with zero exposure risk.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-base font-bold">Client Onboarding</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask clients to drop their sensitive account details into your **Secure Inbox** so you don't have to worry about them sending it via plain email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Mobile App Section ═══ */}
      <section className="relative z-10 px-6 py-24 max-w-5xl mx-auto w-full">
        <div className="card gradient-border overflow-hidden p-0" style={{ background: 'var(--bg-elevated)' }}>
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 p-8 md:p-12 text-left">
              <div className="badge badge-accent mb-4">Native Experience</div>
              <h2 className="text-3xl font-bold mb-4">Ilusion on your <span className="text-gradient">Android</span></h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Take security with you. Our mobile app features biometric unlock,
                instant push notifications for your Inbox, and deep-link support
                to reveal secrets directly from your messaging apps.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="btn-primary !py-3 !px-6 !text-xs flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <Smartphone className="w-4 h-4" />
                  Coming Soon to Play Store
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-muted-foreground">
                  <Check className="w-3 h-3 text-success" />
                  Verified & Secure
                </div>
              </div>
            </div>
            <div className="flex-1 relative h-[300px] md:h-[450px] w-full bg-accent/5 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 mesh-gradient opacity-30" />
              {/* Phone Mockup (CSS only) */}
              <div className="relative w-[180px] h-[360px] bg-zinc-900 rounded-[30px] border-[6px] border-zinc-800 shadow-2xl flex flex-col items-center p-4">
                <div className="w-16 h-1 bg-zinc-800 rounded-full mb-4" />
                <div className="w-full flex-1 rounded-xl bg-zinc-950 border border-white/5 p-3 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
                    <Lock className="w-4 h-4 text-accent" />
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full" />
                  <div className="h-2 w-[80%] bg-white/10 rounded-full" />
                  <div className="mt-auto h-8 w-full bg-accent/20 border border-accent/30 rounded-lg flex items-center justify-center text-[8px] font-bold text-accent">
                    Reveal Secret
                  </div>
                </div>
                <div className="mt-4 w-8 h-8 rounded-full border-2 border-zinc-800" />
              </div>
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ API Section ═══ */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 text-left">
            <div className="badge badge-accent mb-4">For Developers</div>
            <h2 className="text-3xl font-bold mb-4">Programmatic <span className="text-gradient">Secret Generation</span></h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Integrate ilusion.io directly into your CI/CD pipelines, support tools, or custom applications.
              Our simple REST API allows you to automate the creation of secure, temporary links for credentials and logs.
            </p>
            <Link href="/docs/api" className="text-sm font-bold text-accent hover:underline flex items-center gap-2">
              View API Documentation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 w-full">
            <div className="card bg-zinc-950 border border-white/10 p-0 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                <span className="text-[10px] font-mono text-muted-foreground ml-2">POST /api/secrets/create</span>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-xs font-mono leading-relaxed text-zinc-300">
                  <code>{`curl -X POST https://ilusion.io/api/secrets/create \\
  -H "Authorization: Bearer \${ILUSION_KEY}" \\
  -d '{
    "encryptedContent": "sensitive-data",
    "expiresInHours": 1,
    "alias": "deploy-logs"
  }'`}</code>
                </pre>
              </div>
            </div>
          </div>
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

      {/* ═══ Pricing ═══ */}
      <section id="pricing" className="relative z-10 px-6 py-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="badge badge-accent mb-4">Pricing Plans</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Choose the level of security and scale your workflow needs. Ephemeral privacy for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Guest Plan */}
          <div className="card gradient-border p-6 sm:p-8 flex flex-col group transition-transform hover:scale-[1.02]">
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-bold mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl sm:text-3xl font-bold">$0</span>
                <span className="text-xs text-muted-foreground">/ forever</span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Perfect for one-off secure anonymous sharing.</p>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-8 flex-1">
              {[
                'Up to 50MB file uploads',
                'AES-256 client-side E2EE',
                'Burn on Read / self-destructing',
                'No sign-up required'
              ].map(f => (
                <li key={f} className="flex items-center gap-3 text-[11px] sm:text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/create" className="btn-secondary !text-sm w-full text-center">Share Free Secret</Link>
          </div>

          {/* Pro Plan */}
          <div className="card gradient-border p-6 sm:p-8 flex flex-col relative group transition-transform hover:scale-[1.03]" style={{ background: 'var(--surface-overlay)', borderColor: 'var(--accent-muted)' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap z-10">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl sm:text-3xl font-bold">$2</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Get a custom secure inbox & full developer access.</p>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-8 flex-1">
              {[
                'Up to 100MB file uploads',
                'Password Protection',
                'Multi-view options',
                'IP Access Restrictions',
                'Developer API keys & integrations'
              ].map(f => (
                <li key={f} className="flex items-center gap-3 text-[11px] sm:text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="btn-primary !text-sm w-full text-center">Upgrade to Pro</Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ (SEO & AEO Section) ═══ */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="badge badge-accent mb-4">Security FAQ</div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">Common <span className="text-gradient">Questions</span></h2>
          <p className="text-sm text-muted-foreground">Everything you need to know about how we protect your data.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Is Ilusion.io really secure?",
              a: "Yes. We use industry-standard AES-256 encryption. For text secrets, encryption happens in your browser (Client-Side), meaning we never see your unencrypted data."
            },
            {
              q: "What does 'Burn on Read' mean?",
              a: "It means the secret is permanently deleted from our database the moment it is accessed. Once the link is opened, it can never be viewed again."
            },
            {
              q: "Can I send large files safely?",
              a: "Absolutely. Free users can send up to 50MB, and Pro users up to 100MB. All files are stored with temporary access keys and deleted automatically."
            },
            {
              q: "Do I need an account to receive a secret?",
              a: "No. Anyone with the secure link can reveal a secret. Accounts are only needed if you want to use the Secure Inbox or Developer API."
            }
          ].map((faq, i) => (
            <div key={i} className="card p-6 bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] transition-all">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                {faq.q}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed pl-4.5">
                {faq.a}
              </p>
            </div>
          ))}
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
      <footer className="relative z-10 px-6 py-16 max-w-7xl mx-auto w-full border-t border-white/[0.05]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
                <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Secure, ephemeral, and decentralized secret sharing for everyone.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/create" className="text-xs text-muted-foreground hover:text-accent transition-colors">Create Secret</Link></li>
              <li><Link href="/view" className="text-xs text-muted-foreground hover:text-accent transition-colors">Reveal Secret</Link></li>
              <li><Link href="/pricing" className="text-xs text-muted-foreground hover:text-accent transition-colors">Pricing</Link></li>
              <li><Link href="/docs/api" className="text-xs text-muted-foreground hover:text-accent transition-colors">API Docs</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Alternatives</h4>
            <ul className="space-y-2.5">
              <li><Link href="/vs/1password-send" className="text-xs text-muted-foreground hover:text-accent transition-colors">vs 1Password Send</Link></li>
              <li><Link href="/vs/firefox-send" className="text-xs text-muted-foreground hover:text-accent transition-colors">vs Firefox Send</Link></li>
              <li><Link href="/vs/bitwarden-send" className="text-xs text-muted-foreground hover:text-accent transition-colors">vs Bitwarden Send</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="/privacy" className="text-xs text-muted-foreground hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-xs text-muted-foreground hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="/contact" className="text-xs text-muted-foreground hover:text-accent transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-muted-foreground">© 2024 Ilusion.io. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-success opacity-50" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Encrypted at rest & in transit</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
