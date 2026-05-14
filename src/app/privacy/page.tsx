'use client';

import Link from 'next/link';
import { Lock, ArrowLeft, ShieldCheck, EyeOff, Trash2, Globe, Database } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PrivacyPage() {
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
            Privacy <span className="text-gradient">Policy</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Your privacy is not just a feature; it is our foundation. ilusion.io is built to minimize
            data collection and maximize your security.
          </p>
        </div>

        <div className="space-y-12 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <EyeOff className="w-5 h-5 text-accent" />
              1. Zero-Knowledge Sharing
            </h2>
            <p className="mb-4">
              When you share a secret on ilusion.io, we do not have access to your content.
              If you choose End-to-End Encryption (E2EE), the decryption key never leaves your browser.
              Even for standard secrets, your data is encrypted at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Trash2 className="w-5 h-5 text-accent" />
              2. Ephemeral Storage
            </h2>
            <p className="mb-4">
              All data shared through ilusion.io is ephemeral by design:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li><strong>Burn on Read</strong>: Secrets are permanently deleted from our database immediately after they are accessed.</li>
              <li><strong>Automatic Expiry</strong>: If a secret is never read, it is automatically purged after the expiration time you set (e.g., 1 hour, 24 hours).</li>
              <li><strong>Immediate Purge</strong>: When a secret is deleted, all associated metadata and attachments are also purged from our storage systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Database className="w-5 h-5 text-accent" />
              3. Information We Collect
            </h2>
            <p className="mb-4">
              We collect minimal information required to operate the service:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li><strong>Account Information</strong>: Email address and basic profile data provided via Clerk for account management.</li>
              <li><strong>Usage Data</strong>: Aggregated, non-identifiable metrics to help us improve the platform (e.g., total secrets created).</li>
              <li><strong>Security Logs</strong>: We may temporarily log IP addresses for rate limiting and to prevent abuse of the service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <ShieldCheck className="w-5 h-5 text-accent" />
              4. Data Protection
            </h2>
            <p className="mb-4">
              We implement industry-standard security measures, including AES-256 encryption, SSL/TLS for all traffic,
              and strict access controls to protect our infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Globe className="w-5 h-5 text-accent" />
              5. Third-Party Services
            </h2>
            <p className="mb-4">
              We use select third-party providers to help us run ilusion.io:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li><strong>Clerk</strong>: For secure authentication and user management.</li>
              <li><strong>Dodo Payments</strong>: For secure billing and subscription management.</li>
              <li><strong>Mailtrap</strong>: For transactional emails and support requests.</li>
            </ul>
          </section>

          <section className="pt-8 border-t border-default">
            <h2 className="text-xl font-bold mb-4 text-foreground">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please reach out to our team at
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
            <span className="text-xs text-muted-foreground">ilusion.io — Privacy & Security</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
