'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, Link as LinkIcon, ArrowLeft, ArrowRight, Shield } from 'lucide-react';

export default function ViewSecretPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'link' | 'alias'>('link');
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');

  const handleReveal = () => {
    if (mode === 'link') {
      if (!url) return;
      try {
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname + parsedUrl.hash;
        router.push(path);
      } catch (e) {
        // Fallback if not a full URL
        if (url.includes('/secret/') || url.includes('/s/')) {
          router.push(url.startsWith('/') ? url : `/${url}`);
        }
      }
    } else {
      if (!alias) return;
      router.push(`/s/${alias}`);
    }
  };

  return (
    <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-foreground">
              Reveal a Secret
            </h1>
            <p className="text-muted-foreground">
              Enter a secure link or a custom alias to view the contents.
            </p>
          </div>

          <div className="card gradient-border p-8">
            {/* Mode Switcher */}
            <div className="flex p-1 rounded-xl mb-8" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)' }}>
              <button
                onClick={() => setMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  mode === 'link' ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                By Link
              </button>
              <button
                onClick={() => setMode('alias')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  mode === 'alias' ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-4 h-4" />
                By Alias
              </button>
            </div>

            <div className="space-y-6">
              {mode === 'link' ? (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block text-left">Secure Link</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ilusion.io/secret/..."
                    className="input !py-3.5"
                    onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block text-left">Custom Alias</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-sm font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>
                      ilusion.io/s/
                    </div>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="alias-name"
                      className="input !pl-[105px] !py-3.5 font-bold"
                      onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl p-4 text-left space-y-2.5" style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)' }}>
                <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--warning)' }}>
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>Secrets are <strong>permanently destroyed</strong> immediately after being viewed.</span>
                </div>
              </div>

              <button
                onClick={handleReveal}
                disabled={mode === 'link' ? !url : !alias}
                className="btn-primary w-full !py-4 group"
              >
                Reveal Secret
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
