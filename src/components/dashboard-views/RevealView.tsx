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
    <div className="animate-fade-in flex flex-col h-full space-y-4">
      {/* Mode Switcher */}
      <div className="flex p-1 rounded-xl bg-[var(--bg-inset)] dark:bg-zinc-900 border border-[var(--border-default)] dark:border-zinc-800">
        <button
          onClick={() => setMode('link')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold transition-all rounded-lg ${
            mode === 'link' 
              ? 'bg-[var(--accent-primary)] text-white shadow-md' 
              : 'text-[var(--text-secondary)] dark:text-zinc-500 hover:text-[var(--text-primary)] dark:hover:text-zinc-300'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          By link
        </button>
        <button
          onClick={() => setMode('alias')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold transition-all rounded-lg ${
            mode === 'alias' 
              ? 'bg-[var(--accent-primary)] text-white shadow-md' 
              : 'text-[var(--text-secondary)] dark:text-zinc-500 hover:text-[var(--text-primary)] dark:hover:text-zinc-300'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          By alias
        </button>
      </div>

      <div className="space-y-4">
        {mode === 'link' ? (
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ilusion.io/secret/..."
            className="w-full bg-[var(--bg-tertiary)] dark:bg-zinc-900 border border-[var(--border-default)] dark:border-zinc-800 rounded-xl px-4 py-3 text-[13px] text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-primary)]"
            onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
          />
        ) : (
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[13px] font-bold text-[var(--text-tertiary)] dark:text-zinc-600">
              ilusion.io/secret/
            </div>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="alias-name"
              className="w-full bg-[var(--bg-tertiary)] dark:bg-zinc-900 border border-[var(--border-default)] dark:border-zinc-800 rounded-xl pl-[130px] pr-4 py-3 text-[13px] font-bold text-[var(--text-primary)] dark:text-white placeholder:text-[var(--text-tertiary)] dark:placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-primary)]"
              onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
            />
          </div>
        )}

        <button
          onClick={handleReveal}
          disabled={mode === 'link' ? !url : !alias}
          className="w-full bg-[var(--bg-tertiary)] dark:bg-zinc-900 hover:bg-[var(--bg-secondary)] dark:hover:bg-zinc-800/80 text-[var(--text-primary)] dark:text-white border border-[var(--border-default)] dark:border-zinc-800 rounded-xl px-4 py-3 text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {mode === 'link' ? 'Paste a link to decrypt' : 'Decrypt via alias'}
        </button>
      </div>
    </div>
  );
}
