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
      {/* AEO: SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Ilusion Secret Viewer",
            "operatingSystem": "Web",
            "applicationCategory": "SecurityApplication",
            "description": "Secure utility to decrypt and reveal ephemeral secrets sent via ilusion.io. Data is destroyed immediately after viewing.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />
      
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12 mesh-gradient">
        <div className="w-full max-w-xl space-y-12 animate-fade-in-up">
          <div className="text-center space-y-4">
            <div className="badge badge-accent mx-auto !py-1.5 !px-3 !text-[10px] uppercase tracking-widest font-bold">
              Recipient Portal
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Reveal a <span className="text-gradient">Secret</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Decryption is happening on your device. Enter the secure link or alias below to reveal the contents.
            </p>
          </div>

          <div className="bg-elevated border border-white/[0.05] rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-accent/10" />
            
            {/* Mode Switcher */}
            <div className="relative z-10 flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
              <button
                onClick={() => setMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                  mode === 'link' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Secure Link
              </button>
              <button
                onClick={() => setMode('alias')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                  mode === 'alias' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Custom Alias
              </button>
            </div>

            <div className="relative z-10 space-y-8">
              {mode === 'link' ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Input Link</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ilusion.io/secret/..."
                    className="input !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 !py-4 !text-sm font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Alias Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-xs font-mono font-bold text-accent">
                      ilusion.io/s/
                    </div>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="alias-name"
                      className="input !pl-28 !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 !py-4 !text-sm font-bold"
                      onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                    />
                  </div>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-warning/5 border border-warning/10 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-warning uppercase tracking-widest">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  <span>Single-View Enforcement</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed ml-5.5">
                  The secret will be <strong>permanently destroyed</strong> immediately after being revealed. This action cannot be reversed.
                </p>
              </div>

              <button
                onClick={handleReveal}
                disabled={mode === 'link' ? !url : !alias}
                className="btn-primary w-full !py-4.5 !rounded-2xl group text-xs font-bold uppercase tracking-widest shadow-2xl shadow-accent/20"
              >
                Reveal Secret Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid sm:grid-cols-3 gap-8 px-4">
            {[
              { icon: Shield, title: 'Zero-Trace', desc: 'Encrypted on device.' },
              { icon: Eye, title: 'Ephemeral', desc: 'Self-destructs instantly.' },
              { icon: Lock, title: 'Anonymous', desc: 'No recipient tracking.' }
            ].map((t) => (
              <div key={t.title} className="text-center space-y-2 group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto transition-all group-hover:bg-accent/10 group-hover:border-accent/20">
                  <t.icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground">{t.title}</h3>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
