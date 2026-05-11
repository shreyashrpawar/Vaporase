'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Shield, Eye, Timer, FileText, ArrowRight, Lock, Zap, Globe, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard/secrets');
    }
  }, [isLoaded, isSignedIn, router]);

  if (isLoaded && isSignedIn) {
    return null; // Prevents flashing the landing page before redirect
  }

  return (
    <div className="noise-bg gradient-bg min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
            <Lock className="w-4.5 h-4.5 text-accent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-medium px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/secrets"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/api-keys"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                API Keys
              </Link>
              <Link
                href="/create"
                className="text-sm font-medium px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Create Secret
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="animate-fade-in-up opacity-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10 text-xs font-medium text-accent mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            End-to-end encrypted · Self-destructing
          </div>
        </div>

        <h1 className="animate-fade-in-up opacity-0 delay-100 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
          Share secrets that
          <br />
          <span className="text-gradient">vanish forever</span>
        </h1>

        <p className="animate-fade-in-up opacity-0 delay-200 text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Send passwords, files, and sensitive data through self-destructing links.
          Once viewed, your secret is permanently destroyed. No trace. No risk.
        </p>

        <div className="animate-fade-in-up opacity-0 delay-300 flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/create"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-accent hover:bg-accent-light text-white font-semibold transition-all hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-0.5"
          >
            Create a Secret
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-border hover:border-accent/30 hover:bg-accent/5 text-foreground font-semibold transition-all"
          >
            Learn More
          </a>
        </div>

        {/* Quick demo visual */}
        <div className="animate-fade-in-up opacity-0 delay-400 w-full max-w-xl">
          <div className="glass rounded-2xl p-6 glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-amber-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">ilusion.io/create</span>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-slate-100 rounded-full w-4/5 shimmer" />
              <div className="h-3 bg-slate-100 rounded-full w-3/5 shimmer" />
              <div className="h-3 bg-slate-100 rounded-full w-2/5 shimmer" />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">🔗 ilusion.io/s/Xk9mZ...</span>
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Encrypted
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-28 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Why <span className="text-gradient">Ilusion</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Built for security-conscious professionals who refuse to compromise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Eye,
              title: 'Burn on Read',
              description: 'Your secret is permanently deleted the moment it is viewed. No second chances.',
            },
            {
              icon: Timer,
              title: 'Auto-Expiry',
              description: 'Set a timer. If nobody reads it, the secret self-destructs automatically.',
            },
            {
              icon: FileText,
              title: 'File Sharing',
              description: 'Share images, documents, and videos up to 100MB — all encrypted and ephemeral.',
            },
            {
              icon: Zap,
              title: 'Lightning Fast',
              description: 'Edge-distributed database. Your secrets are always served from the nearest location.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass rounded-2xl p-6 hover:border-accent/30 hover:shadow-md transition-all group cursor-default"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three simple steps. Zero complexity.
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              step: '01',
              title: 'Paste or Upload',
              description: 'Enter your secret text or upload a file. Everything is encrypted before it leaves your browser.',
            },
            {
              step: '02',
              title: 'Share the Link',
              description: 'Copy the unique, one-time link and send it to your recipient through any channel.',
            },
            {
              step: '03',
              title: 'It Vanishes',
              description: 'Once opened, the secret is permanently destroyed. The link becomes dead forever.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-5 items-start group glass rounded-2xl p-5 hover:shadow-md transition-all">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-accent font-bold text-sm group-hover:bg-indigo-100 transition-colors">
                {item.step}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto w-full text-center">
        <div className="rounded-3xl p-12 bg-gradient-to-br from-accent/5 via-white to-purple-50 border border-accent/10 glow">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to share securely?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            No account required. Create your first self-destructing secret in seconds.
          </p>
          <Link
            href="/create"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-accent hover:bg-accent-light text-white font-semibold transition-all hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-0.5"
          >
            Create a Secret — It&apos;s Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-border max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              ilusion.io — Secure Ephemeral Sharing
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <Link href="/dashboard/api-keys" className="hover:text-foreground transition-colors">API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
