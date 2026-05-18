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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Incoming Secrets</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage secrets dropped into your secure profile.</p>
        </div>
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input !pl-9 !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 !w-full sm:!w-64"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-10">
          {/* Active / New Messages */}
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <MailOpen className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">New Messages</h3>
            </div>

            <div className="bg-elevated border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl">
              {activeSecrets.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                    <Inbox className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Your inbox is clean</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-2">New incoming secrets will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {activeSecrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-all hover:bg-white/[0.02]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-accent glow-dot" />
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="text-sm font-mono font-bold tracking-tight text-foreground">{secret.id.slice(0, 12)}...</code>
                            <span className="badge badge-accent !text-[9px]">Unread</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                            {secret.sender && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.03] rounded-md border border-white/[0.05]">
                                <User className="w-3.5 h-3.5" />
                                <span className="font-bold text-foreground/80">{secret.sender.displayName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 opacity-50" />
                              <span>Received {new Date(secret.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/secret/${secret.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-all hover:scale-[1.02]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Reveal
                        </Link>
                        <button
                          onClick={() => handleRevoke(secret.id)}
                          className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Delete"
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

          {/* History */}
          {pastSecrets.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Archive</h3>
              </div>
              <div className="bg-elevated/50 border border-white/[0.03] rounded-3xl overflow-hidden">
                <div className="divide-y divide-white/[0.02]">
                  {pastSecrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="p-4 flex items-center justify-between opacity-50 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${secret.status === 'burned' ? 'bg-warning' : 'bg-destructive'}`} />
                        <code className="text-xs font-mono line-through">{secret.id.slice(0, 12)}...</code>
                        <span className={`text-[9px] px-1.5 rounded-md border ${
                          secret.status === 'burned' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}>
                          {secret.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(secret.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Widget */}
        <aside className="space-y-6">
          <div className="bg-elevated border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-accent/10" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <MailOpen className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold">Public Drop Link</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Allow anyone to send you secrets directly. Share this link in your BIOS or messages.
              </p>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl flex items-center justify-between gap-3 group/link">
                  <code className="text-[10px] text-accent font-bold truncate">
                    {profile?.subdomain ? `${profile.subdomain}.ilusion.io` : 'ilusion.io/...'}
                  </code>
                  <button 
                    onClick={() => {
                      if (!profile?.subdomain) return;
                      const link = `https://${profile.subdomain}.ilusion.io`;
                      navigator.clipboard.writeText(link);
                      alert('Link copied!');
                    }}
                    disabled={!profile?.subdomain}
                    className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-30"
                  >
                    <Copy className="w-3.5 h-3.5 text-accent" />
                  </button>
                </div>
                <Link 
                  href={profile?.subdomain ? `https://${profile.subdomain}.ilusion.io` : '#'} 
                  target="_blank"
                  className={`flex items-center justify-center gap-2 w-full py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-white/90 transition-all ${!profile?.subdomain ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Test My Link
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <h4 className="text-xs font-bold text-foreground">Inbox Security</h4>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Secrets sent to your inbox are E2E encrypted. Only you can reveal them using your private session key.
            </p>
            <Link href="/docs/inbox" className="block text-[10px] font-bold text-accent hover:underline">Learn how it works →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
