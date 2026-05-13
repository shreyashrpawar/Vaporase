'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle, Terminal, Lock } from 'lucide-react';
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
          if (data.plan) setUserPlan(data.plan);
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
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>API Keys</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Manage authentication keys for programmatic access.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--destructive)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="card p-6 space-y-6">
        <form onSubmit={handleCreateKey} className="flex gap-3">
          <input type="text" placeholder="Key name (e.g., Production)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="input flex-1" maxLength={50} required />
          {userPlan === 'pro' ? (
            <button type="submit" disabled={isCreating || !newKeyName.trim()} className="btn-primary !whitespace-nowrap">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              New Key
            </button>
          ) : (
            <Link href="/pricing" className="btn-primary !whitespace-nowrap flex items-center gap-2">
              <Lock className="w-4 h-4" />
              New Key <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">PRO</span>
            </Link>
          )}
        </form>

        <div style={{ height: 1, background: 'var(--border-subtle)' }} />

        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active Keys</h2>
          
          {keys.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border-default)' }}>
              <Key className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No API keys yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {keys.map((key) => (
                <div key={key.key} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{key.name}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono font-bold px-2 py-1 rounded-md" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>{key.key}</code>
                      <button onClick={() => copyToClipboard(key.key)} className="p-1 rounded" title="Copy">
                        {copiedKey === key.key ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-tertiary)' }}>{new Date(key.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => handleDeleteKey(key.key)} className="btn-secondary !p-2 !rounded-lg" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--destructive)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* API Documentation */}
        <div className="mt-8 bg-slate-900 rounded-3xl p-8 space-y-6 text-slate-300">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold text-white">Integration Guide</h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Text Secret
              </h4>
              <pre className="text-[11px] bg-black/40 border border-white/5 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
{`curl -X POST https://ilusion.io/api/secrets/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "encryptedContent": "Sensitive data...",
    "expiresInHours": 24
  }'`}
              </pre>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                File Secret Flow
              </h4>
              <div className="space-y-4">
                <div className="relative pl-6 border-l border-white/10">
                  <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-white/20 border-2 border-slate-900" />
                  <p className="text-[10px] font-bold text-white mb-1 uppercase">1. Get Upload Token</p>
                  <pre className="text-[10px] bg-black/40 p-3 rounded-xl overflow-x-auto font-mono text-slate-400">
{`POST /api/secrets/presign -> { url, fileKey }`}
                  </pre>
                </div>
                <div className="relative pl-6 border-l border-white/10">
                  <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-white/20 border-2 border-slate-900" />
                  <p className="text-[10px] font-bold text-white mb-1 uppercase">2. PUT to Storage URL</p>
                  <pre className="text-[10px] bg-black/40 p-3 rounded-xl overflow-x-auto font-mono text-slate-400">
{`PUT [url] --data-binary [file]`}
                  </pre>
                </div>
                <div className="relative pl-6 border-l border-white/10">
                  <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-accent border-2 border-slate-900" />
                  <p className="text-[10px] font-bold text-white mb-1 uppercase">3. Create Link</p>
                  <pre className="text-[10px] bg-black/40 p-3 rounded-xl overflow-x-auto font-mono text-slate-400">
{`POST /api/secrets/create { fileKey, fileName, ... }`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              * Remember to include the <code>Authorization: Bearer [key]</code> header in all requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
