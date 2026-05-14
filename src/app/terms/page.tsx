'use client';

import Link from 'next/link';
import { Lock, ArrowLeft, Scale, AlertCircle, Zap, ShieldAlert, CreditCard } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function TermsPage() {
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
            Back
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-12">
          <div className="badge badge-accent mb-4">Last Updated: May 2024</div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Terms of <span className="text-gradient">Service</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Please read these terms carefully before using ilusion.io. By using the service,
            you agree to be bound by these terms.
          </p>
        </div>

        <div className="space-y-12 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Scale className="w-5 h-5 text-accent" />
              1. Acceptance of Terms
            </h2>
            <p className="mb-4">
              By accessing or using ilusion.io ("the Service"), you agree to comply with and be bound by these Terms of Service.
              If you do not agree to these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Zap className="w-5 h-5 text-accent" />
              2. Description of Service
            </h2>
            <p className="mb-4">
              ilusion.io provides a platform for secure, ephemeral data sharing. We allow users to share encrypted secrets
              that "self-destruct" based on specific triggers (e.g., being read or after a time duration).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-5 h-5 text-accent" />
              3. Prohibited Conduct
            </h2>
            <p className="mb-4">
              You agree not to use the Service for any illegal or unauthorized purpose. This includes, but is not limited to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Distributing malware, viruses, or any destructive code.</li>
              <li>Sharing content that infringes on the intellectual property of others.</li>
              <li>Attempting to bypass rate limits or compromise the security of our infrastructure.</li>
              <li>Using the Service to facilitate fraud, harassment, or illegal activities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-accent" />
              4. Subscriptions and Payments
            </h2>
            <p className="mb-4">
              Certain features of ilusion.io are provided on a subscription basis. By subscribing, you agree to the pricing and
              billing terms presented at the time of purchase. All payments are processed through our third-party provider,
              Dodo Payments.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <AlertCircle className="w-5 h-5 text-accent" />
              5. Limitation of Liability
            </h2>
            <p className="mb-4">
              ilusion.io is provided "as is" without any warranties. We are not liable for any data loss,
              service interruptions, or any damages arising from your use of the Service. Since our service is ephemeral,
              you are responsible for maintaining your own backups of any critical data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              6. Changes to Terms
            </h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Your continued use of the Service after
              changes are posted constitutes your acceptance of the new terms.
            </p>
          </section>

          <section className="pt-8 border-t border-default">
            <h2 className="text-xl font-bold mb-4 text-foreground">Contact</h2>
            <p className="mb-4">
              Questions about our Terms of Service should be sent to
              <Link href="/contact" className="text-accent hover:underline ml-1">hello@ilusion.io</Link>.
            </p>
          </section>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 px-6 py-8 max-w-6xl mx-auto w-full border-t border-default">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ilusion.io — Terms of Service</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
