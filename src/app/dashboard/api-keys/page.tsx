'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Lock, ArrowLeft, Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

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
      
      // Auto copy the new key
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
      <div className="noise-bg gradient-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="noise-bg gradient-bg min-h-screen flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold mb-4">Sign in to manage API keys</h1>
          <Link href="/sign-in" className="px-6 py-3 rounded-xl bg-accent text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="noise-bg gradient-bg min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <Lock className="w-4 h-4 text-accent-light" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ilusion<span className="text-accent-light">.io</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      <main className="relative z-10 flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Key className="w-6 h-6 text-accent-light" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
              <p className="text-muted-foreground text-sm">Manage keys for programmatic access to the Ilusion API.</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-8 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="glass rounded-2xl p-6 sm:p-8 space-y-8">
            {/* Create Key Form */}
            <form onSubmit={handleCreateKey} className="flex gap-3">
              <input
                type="text"
                placeholder="My App Production Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 bg-background/60 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                maxLength={50}
                required
              />
              <button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="shrink-0 px-6 py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Key
              </button>
            </form>

            <div className="h-px bg-border w-full" />

            {/* Keys List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Your Active Keys</h2>
              
              {keys.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground text-sm">No API keys generated yet.</p>
                </div>
              ) : (
                keys.map((key) => (
                  <div key={key.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background/40 border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm mb-1">{key.name}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-accent-light bg-accent/10 px-2 py-1 rounded">
                          {key.key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                          title="Copy key"
                        >
                          {copiedKey === key.key ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteKey(key.key)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Revoke key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* API Documentation Hint */}
            <div className="mt-8 bg-accent/5 border border-accent/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-accent-light mb-2">How to use your API key</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Include your key in the Authorization header of your requests to our endpoints.
              </p>
              <pre className="text-xs bg-black/40 p-3 rounded-lg overflow-x-auto text-muted-foreground">
                <code className="text-accent-light">curl</code> -X POST https://ilusion.io/api/secrets/create \<br/>
                {'  '}-H "Authorization: Bearer ilusion_sk_..." \<br/>
                {'  '}-H "Content-Type: application/json" \<br/>
                {'  '}-d '{'{"encryptedContent":"Hello World"}'}'
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
