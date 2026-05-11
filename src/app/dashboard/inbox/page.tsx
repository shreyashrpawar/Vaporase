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
    if (isLoaded && isSignedIn) fetchInbox();
  }, [isLoaded, isSignedIn]);

  const fetchInbox = async () => {
    try {
      const res = await fetch('/api/secrets/inbox');
      if (!res.ok) throw new Error('Failed to fetch inbox');
      setSecrets(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
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
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Inbox</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Secrets dropped into your profile.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input !pl-9 !w-full sm:!w-56"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--destructive) 20%, transparent)', color: 'var(--destructive)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* New */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MailOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New ({activeSecrets.length})</h2>
        </div>

        {activeSecrets.length === 0 ? (
          <div className="card p-12 text-center">
            <Inbox className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Your inbox is empty</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Secrets dropped into your profile appear here.</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {activeSecrets.map((secret) => (
              <div key={secret.id} className="card card-glow p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                    <MailOpen className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{secret.id.slice(0, 16)}...</code>
                      <span className="badge badge-accent">Unread</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {secret.sender && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {secret.sender.displayName}
                        </span>
                      )}
                      <span>{new Date(secret.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/secret/${secret.id}`} className="btn-primary !py-2 !px-3 !text-xs !rounded-lg !gap-1.5">
                    <Eye className="w-3.5 h-3.5" />Open
                  </Link>
                  <button onClick={() => handleRevoke(secret.id)} className="btn-secondary !py-2 !px-2.5 !rounded-lg" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--destructive)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {pastSecrets.length > 0 && (
        <div className="space-y-3 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>History</h2>
          </div>
          <div className="space-y-2" style={{ opacity: 0.6 }}>
            {pastSecrets.map((secret) => (
              <div key={secret.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <code className="text-xs font-mono line-through" style={{ color: 'var(--text-tertiary)' }}>{secret.id.slice(0, 16)}...</code>
                  <span className={`ml-2 badge ${secret.status === 'burned' ? 'badge-warning' : 'badge-destructive'}`}>{secret.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
