'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Inbox, Trash2, Eye, Shield, Loader2, AlertCircle, Search, MailOpen, Lock, User } from 'lucide-react';
import Link from 'next/link';

export default function InboxPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchInbox();
    }
  }, [isLoaded, isSignedIn]);

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/secrets/inbox');
      if (!res.ok) throw new Error('Failed to fetch inbox');
      const data = await res.json();
      setSecrets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret without reading it?')) return;
    
    try {
      const res = await fetch(`/api/secrets/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to revoke secret');
      
      setSecrets(secrets.map(s => s.id === id ? { ...s, status: 'revoked' } : s));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredSecrets = secrets.filter(s => 
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sender?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSecrets = filteredSecrets.filter(s => s.status === 'active');
  const pastSecrets = filteredSecrets.filter(s => s.status !== 'active');

  if (!isLoaded || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center">
            <Inbox className="w-6 h-6 text-accent-light" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">Secure Inbox</h1>
            <p className="text-zinc-500 text-sm">Secrets dropped into your public profile.</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-zinc-900/50 border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Active Secrets */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
          <MailOpen className="w-5 h-5 text-accent" />
          New Secrets ({activeSecrets.length})
        </h2>
        
        {activeSecrets.length === 0 ? (
          <div className="bg-zinc-900/50 rounded-2xl border border-white/[0.06] p-12 text-center">
            <Inbox className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-300 mb-1">Your inbox is empty</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              When someone drops a secret into your public profile, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeSecrets.map((secret) => (
              <div key={secret.id} className="bg-zinc-900/50 rounded-2xl border border-white/[0.06] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-glow">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                    <code className="text-sm font-bold text-zinc-200">ID: {secret.id}</code>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/15">
                      Unread
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {secret.sender && (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        From: <span className="text-zinc-400 font-medium">{secret.sender.displayName}</span>
                      </span>
                    )}
                    <span>Dropped: {new Date(secret.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/secret/${secret.id}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white text-sm font-bold transition-all shadow-lg shadow-accent/20 border border-accent/50"
                  >
                    <Eye className="w-4 h-4" />
                    Open Secret
                  </Link>
                  <button
                    onClick={() => handleRevoke(secret.id)}
                    className="p-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                    title="Delete without reading"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {pastSecrets.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-white/[0.04]">
          <h2 className="text-lg font-bold text-zinc-400 flex items-center gap-2">
            <Lock className="w-5 h-5 text-zinc-600" />
            Inbox History
          </h2>
          <div className="grid gap-3 opacity-60">
            {pastSecrets.map((secret) => (
              <div key={secret.id} className="bg-zinc-900/30 rounded-2xl border border-white/[0.04] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-sm font-bold text-zinc-500 line-through">ID: {secret.id}</code>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      secret.status === 'burned' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'
                    }`}>
                      {secret.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-600">
                    {secret.status === 'burned' 
                      ? `Read on: ${new Date(secret.readAt).toLocaleString()}`
                      : `Deleted on: ${new Date(secret.expiresAt).toLocaleString()}`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
