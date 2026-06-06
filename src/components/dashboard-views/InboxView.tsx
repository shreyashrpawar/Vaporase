'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Inbox, Trash2, Eye, Shield, Loader2, AlertCircle, Search, MailOpen, Lock, User, Copy, RotateCw } from 'lucide-react';
import Link from 'next/link';

export default function InboxPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchInbox();
      fetchProfile();
    }
  }, [isLoaded, isSignedIn]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) { console.error('Failed to fetch profile', err); }
  };

  const fetchInbox = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/secrets/inbox');
      if (!res.ok) throw new Error('Failed to fetch inbox');
      setSecrets(await res.json());
    } catch (err: any) { setError(err.message); }
    finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Delete this secret without reading it?')) return;
    try {
      const res = await fetch('/api/secrets/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Failed');
      setSecrets(secrets.map(s => s.id === id ? { ...s, status: 'revoked' } : s));
    } catch (err: any) { alert(err.message); }
  };

  const filteredSecrets = secrets.filter(s =>
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.sender?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeSecrets = filteredSecrets.filter(s => s.status === 'active');
  const pastSecrets = filteredSecrets.filter(s => s.status !== 'active');

  if (!isLoaded || isLoading) return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="h-14 flex items-center justify-between border-b border-transparent shrink-0 mb-2">
        <div className="h-3 w-24 bg-[var(--border-default)] dark:bg-white/[0.04] rounded-full animate-pulse" />
      </div>
      <div className="flex flex-col space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-[88px] w-full bg-[var(--border-default)] dark:bg-white/[0.04] rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center justify-between border-b border-transparent text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] dark:text-zinc-500 shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <Inbox className="w-3.5 h-3.5" /> Secure Inbox
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInbox(true)}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors group cursor-pointer disabled:opacity-50"
            title="Refresh Inbox"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[var(--text-secondary)] dark:text-zinc-400 group-hover:text-accent transition-transform duration-500 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
          <span className="bg-accent/10 text-accent dark:bg-accent/20 text-[9px] px-2.5 py-0.5 rounded-full font-black">
            {activeSecrets.length}
          </span>
        </div>
      </div>

      {activeSecrets.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-[var(--bg-tertiary)] dark:bg-zinc-900 border border-[var(--border-default)] dark:border-zinc-800 rounded-2xl min-h-[200px]">
          <div className="mb-4 text-[var(--text-tertiary)] dark:text-zinc-600">
            <MailOpen className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-[13px] font-bold text-[var(--text-primary)] dark:text-zinc-300 mb-1">Your inbox is clean</h3>
          <p className="text-[11px] text-[var(--text-secondary)] dark:text-zinc-500">Secrets sent to you appear here</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-tertiary)] dark:bg-zinc-900 border border-[var(--border-default)] dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-[var(--border-default)] dark:divide-white/[0.05]">
          {activeSecrets.map((secret) => (
            <div
              key={secret.id}
              className="group flex items-center justify-between gap-4 p-4 transition-all hover:bg-[var(--bg-secondary)] dark:hover:bg-white/[0.02]"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs font-mono font-bold tracking-tight text-[var(--text-primary)] dark:text-white truncate">{secret.id.slice(0, 8)}...</code>
                    <span className="text-[9px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] dark:text-[#D494FF] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Unread</span>
                  </div>
                  {secret.sender && (
                    <div className="text-[10px] text-[var(--text-secondary)] dark:text-zinc-400 truncate">
                      From: <span className="font-bold text-[var(--text-primary)] dark:text-zinc-300">{secret.sender.displayName}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/secret/${secret.id}`}
                  className="p-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)] hover:text-white transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleRevoke(secret.id)}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
