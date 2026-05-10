'use client';

import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Shield, Eye, Timer, FileText, ArrowRight, Lock, Zap, Globe } from 'lucide-react';

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="noise-bg gradient-bg min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <Lock className="w-4 h-4 text-accent-light" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ilusion<span className="text-accent-light">.io</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white transition-colors"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard/api-keys"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                API Keys
              </Link>
              <Link
                href="/create"
                className="text-sm px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white transition-colors"
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-ring" />
            End-to-end encrypted · Self-destructing
          </div>
        </div>

        <h1 className="animate-fade-in-up opacity-0 delay-100 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          Share secrets that
          <br />
          <span className="text-gradient">vanish forever</span>
        </h1>

        <p className="animate-fade-in-up opacity-0 delay-200 text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Send passwords, files, and sensitive data through self-destructing links.
          Once viewed, your secret is permanently destroyed. No trace. No risk.
        </p>

        <div className="animate-fade-in-up opacity-0 delay-300 flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/create"
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Create a Secret
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl glass hover:bg-muted/80 text-foreground font-medium transition-all"
          >
            Learn More
          </a>
        </div>

        {/* Quick demo visual */}
        <div className="animate-fade-in-up opacity-0 delay-400 w-full max-w-xl">
          <div className="glass rounded-2xl p-6 glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-success/60" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">ilusion.io/create</span>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-muted/60 rounded-full w-4/5 shimmer" />
              <div className="h-3 bg-muted/60 rounded-full w-3/5 shimmer" />
              <div className="h-3 bg-muted/60 rounded-full w-2/5 shimmer" />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">🔗 ilusion.io/s/Xk9mZ...</span>
              <span className="text-xs text-success flex items-center gap-1">
                <Shield className="w-3 h-3" /> Encrypted
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Why <span className="text-gradient">Ilusion</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Built for security-conscious professionals who refuse to compromise.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="glass rounded-2xl p-6 hover:border-accent/30 transition-all group cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-5 h-5 text-accent-light" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three simple steps. Zero complexity.
          </p>
        </div>

        <div className="space-y-8">
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
            <div key={item.step} className="flex gap-6 items-start group">
              <div className="shrink-0 w-12 h-12 rounded-xl glass flex items-center justify-center text-accent-light font-bold text-sm group-hover:bg-accent/10 transition-colors">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg mb-1">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 max-w-4xl mx-auto w-full text-center">
        <div className="glass rounded-3xl p-12 glow">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to share securely?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            No account required. Create your first self-destructing secret in seconds.
          </p>
          <Link
            href="/create"
            className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-all hover:shadow-lg hover:shadow-accent/25"
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
