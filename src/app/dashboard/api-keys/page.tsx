'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle, Terminal } from 'lucide-react';

export default function ApiKeysPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Key className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">API Access</h1>
          <p className="text-slate-500 text-sm">Manage authentication keys for programmatic secret creation.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-8 rounded-xl bg-red-50 border border-red-200 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-8 shadow-sm">
        {/* Create Key Form */}
        <form onSubmit={handleCreateKey} className="flex gap-3">
          <input
            type="text"
            placeholder="Key Name (e.g., Production Server)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
            maxLength={50}
            required
          />
          <button
            type="submit"
            disabled={isCreating || !newKeyName.trim()}
            className="shrink-0 px-6 py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            New Key
          </button>
        </form>

        <div className="h-px bg-slate-100 w-full" />

        {/* Keys List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Active API Keys</h2>
          
          {keys.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <Key className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">No API keys found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {keys.map((key) => (
                <div key={key.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm mb-1">{key.name}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] text-accent font-bold bg-white border border-accent/10 px-3 py-1.5 rounded-lg font-mono">
                        {key.key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="text-slate-400 hover:text-accent p-1.5 transition-colors rounded-lg hover:bg-white"
                        title="Copy key"
                      >
                        {copiedKey === key.key ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteKey(key.key)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-destructive hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
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
