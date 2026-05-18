'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle, Terminal, Lock, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ApiKeysPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          // Force pro for UI
          setUserPlan('pro');
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchKeys();
    }
  }, [isLoaded, isSignedIn]);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      if (!res.ok) throw new Error('Failed to fetch keys');
      const data = await res.json();
      setKeys(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!res.ok) throw new Error('Failed to create key');

      const newKey = await res.json();
      setKeys([newKey, ...keys]);
      setNewKeyName('');
      copyToClipboard(newKey.key);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/keys?key=${key}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete key');
      setKeys(keys.filter(k => k.key !== key));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      
      {/* Header and Creator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500">Programmatic Access</h2>
          <p className="text-xs text-[#534d5e] dark:text-zinc-400 mt-1">
            Manage your developer API authentication keys. <Link href="/docs/api" className="text-accent hover:underline font-bold ml-1">View API Docs →</Link>
          </p>
        </div>
        <form onSubmit={handleCreateKey} className="flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Key Name..."
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-900 dark:text-white placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm w-40 sm:w-48"
            maxLength={50}
            required
          />
          <button 
            type="submit" 
            disabled={isCreating || !newKeyName.trim()} 
            className="px-4 py-2 bg-accent hover:bg-accent-light disabled:opacity-30 disabled:hover:bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Create Key</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Active Keys Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Key className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Active Credentials</h3>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm shadow-zinc-900/5">
              {keys.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-16 h-16 bg-zinc-900/5 dark:bg-zinc-900/30 border border-[#e5e3d9] dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Terminal className="w-6 h-6 text-accent opacity-60" />
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">No active API keys</p>
                  <p className="text-xs text-[#a5a1ad] dark:text-zinc-500 mt-1.5">Generate a credentials token above to start automating secrets with Ilusion.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#e5e3d9] dark:divide-zinc-800">
                  {keys.map((key) => (
                    <div
                      key={key.key}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-all hover:bg-[#faf9f5]/50 dark:hover:bg-zinc-900/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent/20 transition-all shrink-0">
                          <Key className="w-4 h-4 text-accent" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none">{key.name}</p>
                          <div className="flex items-center gap-2">
                            <code className="text-[11px] font-mono bg-accent/5 text-accent px-2.5 py-1 rounded-lg border border-accent/10 select-all leading-none">
                              {key.key}
                            </code>
                            <button
                              onClick={() => copyToClipboard(key.key)}
                              className="p-1.5 rounded-lg bg-white dark:bg-zinc-950 hover:bg-[#faf9f5] dark:hover:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 text-[#534d5e] dark:text-zinc-400 hover:text-accent dark:hover:text-accent shadow-sm transition-all"
                            >
                              {copiedKey === key.key ? <Check className="w-3.5 h-3.5 text-green-500 animate-scale-in" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-[#e5e3d9] dark:border-transparent pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] font-black uppercase text-[#a5a1ad] dark:text-zinc-500 tracking-wider">Created On</p>
                          <p className="text-xs font-bold text-zinc-900/80 dark:text-white/80 mt-0.5">{new Date(key.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteKey(key.key)}
                          className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/15 hover:border-red-500/20 shadow-sm transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Integration Guide Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Terminal className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Integration Quickstart</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Curl Box */}
              <div className="bg-zinc-950 rounded-3xl p-5 border border-zinc-850 space-y-4 shadow-sm shadow-zinc-900/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Create Secret Link</h4>
                  <span className="px-2 py-0.5 bg-accent/20 border border-accent/30 text-accent text-[8px] font-black rounded-full uppercase tracking-wider">REST API</span>
                </div>
                <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed overflow-x-auto p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
                  {`curl -X POST https://ilusion.io/api/v1/secrets \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Super secret text...",
    "expiry": 24
  }'`}
                </pre>
              </div>

              {/* Steps Box */}
              <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-5 space-y-5 shadow-sm shadow-zinc-900/5">
                <h4 className="text-[9px] font-black text-[#a5a1ad] dark:text-zinc-550 uppercase tracking-widest">Encrypted Upload Pipeline</h4>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Session Exchange', desc: 'Secure ephemeral token initialization.' },
                    { step: '2', title: 'File Presigning', desc: 'AWS S3 / Cloudflare R2 direct negotiation.' },
                    { step: '3', title: 'Link Finalization', desc: 'Assemble local keys & client-side decrypt URL.' }
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 group items-center">
                      <div className="w-7 h-7 rounded-lg bg-accent/5 border border-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white">{s.title}</p>
                        <p className="text-[10px] text-[#534d5e] dark:text-zinc-450 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar credentials policies */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-6 shadow-sm shadow-zinc-900/5 space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-accent/10" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-black uppercase tracking-wider">Security Policies</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Never share your private API keys.',
                  'Rotate key tokens every 90 days.',
                  'Load credentials via env variables.',
                  'Restrict scope endpoints by IP (Pro).'
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-[#534d5e] dark:text-zinc-400 leading-tight font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/10 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Terminal className="w-4 h-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">Official SDKs</h4>
            </div>
            <p className="text-[10px] text-[#534d5e] dark:text-zinc-400 leading-relaxed font-medium">
              Interact programmatically using official wrapper packages crafted for Node.js, Python, and Go.
            </p>
            <Link href="/docs/sdks" className="inline-block text-[10px] font-bold text-accent hover:underline">Explore Official SDKs →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
