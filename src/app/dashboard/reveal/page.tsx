'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, Link as LinkIcon, ArrowRight, Shield, AlertCircle } from 'lucide-react';

export default function RevealPage() {
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
    <div className="space-y-8 animate-fade-in">
      <div className="px-2">
        <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Security Tools</h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Reveal encrypted secrets using a link or alias.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6 sm:space-y-8">
          <div className="bg-elevated border border-white/[0.05] rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl space-y-6 sm:space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-accent/10" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Internal Decryptor</h3>
                  <p className="text-xs text-muted-foreground mt-1">Decryption is performed locally in your workspace.</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                <button
                  onClick={() => setMode('link')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'link' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                    }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Secure Link
                </button>
                <button
                  onClick={() => setMode('alias')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'alias' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
                    }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Custom Alias
                </button>
              </div>

              <div className="space-y-8 pt-4">
                {mode === 'link' ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Input Secret Link</label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://ilusion.io/secret/..."
                      className="input !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 !py-4.5 !text-sm font-mono"
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
                        className="input !pl-28 !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 !py-4.5 !text-sm font-bold"
                        onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                      />
                    </div>
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-warning/5 border border-warning/10 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-warning uppercase tracking-widest">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Authentication Notice</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed ml-5.5">
                    Secrets revealed here are subject to the same **Single-View enforcement**. Once you click reveal, the content will be purged from all systems forever.
                  </p>
                </div>

                <button
                  onClick={handleReveal}
                  disabled={mode === 'link' ? !url : !alias}
                  className="btn-primary w-full !py-5 !rounded-2xl group text-sm font-bold uppercase tracking-widest shadow-2xl shadow-accent/20 transition-all hover:scale-[1.01]"
                >
                  Decrypt and Reveal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-elevated border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-6">
            <h3 className="text-sm font-bold">Why reveal here?</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Reveal secrets within your workspace without losing your context or sidebar.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Automatic logging of your activity (excluding secret content) for your security feed.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Direct integration with your encrypted storage if you choose to save them locally.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-accent/5 border border-accent/10 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-accent">Security Tip</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              "Always check the URL before entering decryption keys. ilusion.io uses client-side SHA-256 validation for every secret."
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
