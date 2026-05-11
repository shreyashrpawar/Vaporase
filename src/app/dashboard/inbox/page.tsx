'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Inbox, Trash2, Eye, Shield, Loader2, AlertCircle, Search, MailOpen, Lock } from 'lucide-react';
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
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Inbox className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Secure Inbox</h1>
            <p className="text-slate-500 text-sm">Secrets dropped into your public profile.</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-8 rounded-xl bg-red-50 border border-red-200 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Active Secrets */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MailOpen className="w-5 h-5 text-accent" />
          New Secrets ({activeSecrets.length})
        </h2>
        
        {activeSecrets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Your inbox is empty</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              When someone drops a secret into your public profile, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeSecrets.map((secret) => (
              <div key={secret.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-accent/30 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
                    <code className="text-sm font-bold text-slate-900">ID: {secret.id}</code>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-accent text-[10px] font-bold uppercase tracking-wider">
                      Unread
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Dropped: {new Date(secret.createdAt).toLocaleString()}</span>
                    <span>Expires: {new Date(secret.expiresAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/secret/${secret.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-light text-white text-sm font-bold transition-colors shadow-lg shadow-accent/20"
                  >
                    <Eye className="w-4 h-4" />
                    Open Secret
                  </Link>
                  <button
                    onClick={() => handleRevoke(secret.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-destructive hover:bg-red-50 transition-colors"
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
        <div className="space-y-4 pt-8">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-400" />
            Inbox History
          </h2>
          <div className="grid gap-3 opacity-70">
            {pastSecrets.map((secret) => (
              <div key={secret.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-sm font-bold text-slate-500 line-through">ID: {secret.id}</code>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      secret.status === 'burned' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {secret.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
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
