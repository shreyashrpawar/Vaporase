'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Inbox, Trash2, Eye, Shield, Loader2, AlertCircle, Search, MailOpen, Lock, User, Copy } from 'lucide-react';
import Link from 'next/link';

export default function InboxPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">
          <Inbox className="w-3.5 h-3.5" /> Secure Inbox
        </h2>
      </div>

      <div className="bg-elevated border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl flex-1 flex flex-col">
        {activeSecrets.length === 0 ? (
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white/[0.02] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/[0.05]">
              <Inbox className="w-6 h-6 text-muted-foreground opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Your inbox is clean</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05] overflow-y-auto max-h-[400px]">
            {activeSecrets.map((secret) => (
              <div
                key={secret.id}
                className="group flex items-center justify-between gap-4 p-4 transition-all hover:bg-white/[0.02]"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent glow-dot shrink-0" />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-xs font-mono font-bold tracking-tight text-foreground truncate">{secret.id.slice(0, 8)}...</code>
                      <span className="badge badge-accent !text-[8px]">Unread</span>
                    </div>
                    {secret.sender && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        From: <span className="font-bold text-foreground/80">{secret.sender.displayName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/secret/${secret.id}`}
                    className="p-2 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-white transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleRevoke(secret.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
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
    </div>
  );
}
