'use client';

import Link from 'next/link';
import { Lock, ArrowLeft, Copy, Check, Terminal, Shield, Zap, Key, Code } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = `curl -X POST https://www.ilusion.io/api/secrets/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "encryptedContent": "This is a secret message",
    "expiresInHours": 24,
    "alias": "my-custom-link"
  }'`;

  const responseExample = `{
  "id": "Xk9mZ7pQ",
  "expiresAt": "2024-05-15T14:30:00.000Z",
  "link": "https://www.ilusion.io/s/my-custom-link"
}`;

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
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-12">
          <div className="badge badge-accent mb-4">Documentation</div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Developer <span className="text-gradient">API</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Integrate secure, ephemeral sharing directly into your applications. Our simple REST API 
            allows you to programmatically generate self-destructing secrets with custom aliases.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="card p-6" style={{ background: 'var(--surface-overlay)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold mb-2">Fast Integration</h3>
            <p className="text-xs text-muted-foreground">Standard REST API that works with any language or framework.</p>
          </div>
          <div className="card p-6" style={{ background: 'var(--surface-overlay)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold mb-2">Secure by Default</h3>
            <p className="text-xs text-muted-foreground">All data is encrypted and immediately purged after being read.</p>
          </div>
          <div className="card p-6" style={{ background: 'var(--surface-overlay)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Key className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold mb-2">Bearer Auth</h3>
            <p className="text-xs text-muted-foreground">Simple token-based authentication via your Developer Dashboard.</p>
          </div>
        </div>

        <div className="space-y-16">
          {/* Base URL */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-accent" />
              Base URL
            </h2>
            <div className="card !bg-zinc-950 border-zinc-800 p-4 font-mono text-sm text-zinc-300 shadow-lg">
              https://www.ilusion.io/api
            </div>
          </section>

          {/* Authentication */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-accent" />
              Authentication
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              All API requests require an API Key passed in the <code className="bg-accent/10 text-accent px-1.5 py-0.5 rounded">Authorization</code> header as a Bearer token. 
              You can generate your keys in the <Link href="/dashboard/api-keys" className="text-accent hover:underline">Developer Dashboard</Link>.
            </p>
            <div className="card !bg-zinc-950 border-zinc-800 p-4 font-mono text-sm text-zinc-300 shadow-lg">
              Authorization: Bearer {'{YOUR_API_KEY}'}
            </div>
          </section>

          {/* Create Secret */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Code className="w-5 h-5 text-accent" />
                Create Secret
              </h2>
              <span className="badge badge-success !text-[10px]">POST</span>
            </div>
            
            <div className="card !bg-zinc-950 border-zinc-800 p-0 overflow-hidden mb-8 shadow-xl">
              <div className="px-4 py-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400">/secrets/create</span>
                <button 
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {copied === 'curl' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="p-5 bg-zinc-950 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-200 leading-relaxed">
                  <code>{curlExample}</code>
                </pre>
              </div>
            </div>

            <h3 className="font-bold text-sm mb-4">Request Parameters</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-default text-muted-foreground">
                    <th className="py-3 px-4 font-medium">Field</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium">Required</th>
                    <th className="py-3 px-4 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default">
                  <tr className="hover:bg-accent/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-accent">encryptedContent</td>
                    <td className="py-3 px-4 text-xs font-medium">string</td>
                    <td className="py-3 px-4 text-xs">Yes</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">The text content to store.</td>
                  </tr>
                  <tr className="hover:bg-accent/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-accent">expiresInHours</td>
                    <td className="py-3 px-4 text-xs font-medium">number</td>
                    <td className="py-3 px-4 text-xs">No</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">Expiration time (1-168). Defaults to 24.</td>
                  </tr>
                  <tr className="hover:bg-accent/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-accent">alias</td>
                    <td className="py-3 px-4 text-xs font-medium">string</td>
                    <td className="py-3 px-4 text-xs">No</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">Custom URL slug (letters, numbers, hyphens).</td>
                  </tr>
                  <tr className="hover:bg-accent/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-accent">passwordHash</td>
                    <td className="py-3 px-4 text-xs font-medium">string</td>
                    <td className="py-3 px-4 text-xs">No</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">SHA-256 hash if password protection is needed.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Response */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Response Format
            </h2>
            <div className="card !bg-zinc-950 border-zinc-800 p-0 overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-400">200 OK</span>
                <button 
                  onClick={() => copyToClipboard(responseExample, 'resp')}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {copied === 'resp' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="p-5 bg-zinc-950 overflow-x-auto">
                <pre className="text-xs font-mono text-zinc-200 leading-relaxed">
                  <code>{responseExample}</code>
                </pre>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-20 pt-12 border-t border-white/10 text-center">
          <h2 className="text-2xl font-bold mb-4">Start Automating Today</h2>
          <p className="text-sm text-muted-foreground mb-8">Ready to get your API keys? Create an account or sign in to your dashboard.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="btn-primary !px-8 !py-3">Create Free Account</Link>
            <Link href="/dashboard/api-keys" className="btn-secondary !px-8 !py-3">Go to Dashboard</Link>
          </div>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 px-6 py-8 max-w-6xl mx-auto w-full border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ilusion.io — Developer Documentation</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
