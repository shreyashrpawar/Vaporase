import Link from 'next/link';
import { HelpCircle, Terminal, Shield, Key, Eye, Lock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ilusion Documentation, Guides & Help Center',
  description: 'Find guides, tutorials, and security deep dives for Ilusion. Learn how standard zero-knowledge links, custom aliases, secure developer inboxes, and API keys work.',
  keywords: ['secure sharing tutorial', 'ephemeral link guide', 'zero knowledge documentation', 'developer security help center'],
  openGraph: {
    title: 'Ilusion Documentation, Guides & Help Center',
    description: 'Learn how to securely share passwords, credentials, and files with zero-knowledge end-to-end encryption.',
  }
};

export default function DocsPage() {
  const categories = [
    {
      title: 'Getting Started',
      description: 'New to Ilusion? Learn the basics of sharing encrypted text and files securely.',
      items: [
        {
          title: 'Quick Start Guide',
          href: '/docs/quickstart',
          description: 'Step-by-step tutorial on generating your first secure sharing link with custom settings.',
          icon: HelpCircle,
          badge: 'Free'
        },
        {
          title: 'Developer API Reference',
          href: '/docs/api',
          description: 'Integrate programmatic ephemeral sharing directly into your backend code or CI/CD pipelines.',
          icon: Terminal,
          badge: 'Pro'
        }
      ]
    },
    {
      title: 'Security & Technology',
      description: 'Understand the underlying cryptography and privacy principles powering our E2EE engine.',
      items: [
        {
          title: 'E2EE Cryptography Deep Dive',
          href: '/docs/zero-knowledge-e2ee',
          description: 'How we utilize WebCrypto API AES-256 and URL hash fragments to protect your data.',
          icon: Shield,
          badge: 'Technical'
        }
      ]
    },
    {
      title: 'Advanced & B2B Features',
      description: 'Leverage professional settings to control credentials delivery and brand reputation.',
      items: [
        {
          title: 'Custom URL Aliases',
          href: '/docs/custom-aliases',
          description: 'How to reserve memorable slugs for secure redirects and client onboarding.',
          icon: Key,
          badge: 'Pro'
        },
        {
          title: 'Secure Inbox Drops',
          href: '/docs/inbox-drops',
          description: 'Create a personal portal to let clients upload passwords directly to your dashboard.',
          icon: Eye,
          badge: 'Pro'
        }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      {/* Intro */}
      <div>
        <div className="badge badge-accent mb-4">Knowledge Base</div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">
          How can we help?
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Welcome to the Ilusion documentation center. Explore our step-by-step tutorials, technical security references, and developer APIs to get the most out of secure E2EE sharing.
        </p>
      </div>

      {/* Grid of categories */}
      <div className="space-y-12">
        {categories.map((cat) => (
          <section key={cat.title} className="space-y-4">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-xl font-bold text-foreground">{cat.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {cat.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="card p-6 flex flex-col justify-between hover:border-accent/40 hover:shadow-glow transition-all duration-300 relative group"
                    style={{ background: 'var(--surface-overlay)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <Icon className="w-5 h-5 text-accent" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-border text-muted-foreground">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-foreground mb-2 group-hover:text-accent transition-colors duration-200">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Call to Action banner */}
      <div className="p-8 rounded-2xl border border-border bg-gradient-to-r from-accent/5 to-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-md">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Lock className="w-4.5 h-4.5 text-accent" />
            Ready to secure your workflow?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create standard zero-knowledge links, customize aliases, or build secure client dropdown portals instantly.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-up" className="btn-primary !px-5 !py-2.5 !text-xs">
            Start Free
          </Link>
          <Link href="/pricing" className="btn-secondary !px-5 !py-2.5 !text-xs">
            View Pro Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
