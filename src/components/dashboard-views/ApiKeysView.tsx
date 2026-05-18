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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Programmatic Access</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage authentication keys for your integrations. <Link href="/docs/api" className="text-accent hover:underline font-medium ml-1">View API Docs →</Link>
          </p>
        </div>
        <form onSubmit={handleCreateKey} className="flex gap-2">
          <input
            type="text"
            placeholder="Key Name..."
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="input !py-2 !text-xs !bg-white/[0.02] !w-40 sm:!w-48"
            maxLength={50}
            required
          />
          <button type="submit" disabled={isCreating || !newKeyName.trim()} className="btn-primary !py-2 !px-4 !text-xs">
            {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create Key
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-10">
          {/* Active Keys */}
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <Key className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Active Credentials</h3>
            </div>

            <div className="bg-elevated border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl">
              {keys.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                    <Terminal className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No active API keys</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-2">Create a key to start integrating Ilusion.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {keys.map((key) => (
                    <div
                      key={key.key}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-all hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent/20 transition-all">
                          <Key className="w-5 h-5 text-muted-foreground group-hover:text-accent" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">{key.name}</p>
                          <div className="flex items-center gap-2">
                            <code className="text-[11px] font-mono bg-accent/5 text-accent px-2 py-0.5 rounded border border-accent/10">
                              {key.key}
                            </code>
                            <button
                              onClick={() => copyToClipboard(key.key)}
                              className="p-1.5 rounded-lg hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-all"
                            >
                              {copiedKey === key.key ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter opacity-50">Created On</p>
                          <p className="text-xs font-medium text-foreground/80">{new Date(key.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteKey(key.key)}
                          className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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

          {/* Integration Guide */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <Terminal className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Integration Guide</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-3xl p-6 border border-white/[0.05] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Create Secret</h4>
                  <span className="badge badge-accent !text-[8px]">REST API</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto p-4 bg-black/40 rounded-2xl border border-white/5">
                  {`curl -X POST https://ilusion.io/api/v1/secrets \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Secret data...",
    "expiry": 24
  }'`}
                </pre>
              </div>

              <div className="bg-elevated border border-white/[0.05] rounded-3xl p-6 space-y-6">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Multi-Step Flow</h4>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Auth Token', desc: 'Exchange key for session.' },
                    { step: '2', title: 'File Sign', desc: 'Get S3 presigned URL.' },
                    { step: '3', title: 'Finalize', desc: 'Create encrypted link.' }
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-[10px] font-bold group-hover:border-accent/30 transition-all shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-elevated border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-accent/10" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold">Security Checklist</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Never share your API keys.',
                  'Rotate keys every 90 days.',
                  'Use environmental variables.',
                  'Restrict keys by IP (Pro).'
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span className="text-[11px] text-muted-foreground leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Terminal className="w-3.5 h-3.5" />
              <h4 className="text-xs font-bold">SDK Support</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              We provide official libraries for Node.js, Python, and Go to help you integrate faster.
            </p>
            <Link href="/docs/sdks" className="block text-[10px] font-bold text-accent hover:underline">View SDK Docs →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
