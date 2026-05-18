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
      router.push(`/secret/${alias}`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" /> Reveal Secret
        </h2>
      </div>

      <div className="bg-elevated border border-white/[0.05] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden group flex-1">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-accent/10" />

        <div className="relative z-10 space-y-5">
          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <button
              onClick={() => setMode('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                mode === 'link' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              Link
            </button>
            <button
              onClick={() => setMode('alias')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                mode === 'alias' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'
              }`}
            >
              <Shield className="w-3 h-3" />
              Alias
            </button>
          </div>

          <div className="space-y-6 pt-2">
            {mode === 'link' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://ilusion.io/secret/..."
                  className="input !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 !py-3 !text-xs font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[10px] font-mono font-bold text-accent">
                    ilusion.io/secret/
                  </div>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="alias-name"
                    className="input !pl-[140px] !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 !py-3 !text-xs font-bold"
                    onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleReveal}
              disabled={mode === 'link' ? !url : !alias}
              className="btn-primary w-full !py-3.5 !rounded-xl group text-xs font-bold uppercase tracking-widest shadow-xl shadow-accent/20 transition-all hover:scale-[1.02]"
            >
              Decrypt
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
