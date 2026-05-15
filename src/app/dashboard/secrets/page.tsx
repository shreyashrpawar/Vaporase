'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shield, Clock, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle, Globe, FileText, Zap, Check } from 'lucide-react';

export default function SecretsDashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setShowSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
    if (isLoaded && isSignedIn) fetchSecrets();
  }, [isLoaded, isSignedIn]);

  const fetchSecrets = async () => {
    try {
      const res = await fetch('/api/secrets/dashboard');
      if (!res.ok) throw new Error('Failed to fetch secrets');
      setSecrets(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this secret? It will be permanently destroyed.')) return;
    try {
      const res = await fetch('/api/secrets/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Failed');
      setSecrets(secrets.map(s => s.id === id ? { ...s, status: 'revoked' } : s));
    } catch (err: any) { alert(err.message); }
  };

  if (!isLoaded || isLoading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
    </div>
  );

  const activeSecrets = secrets.filter(s => s.status === 'active');
  const pastSecrets = secrets.filter(s => s.status !== 'active');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Success Notification */}
      {showSuccess && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-accent/10 border border-accent/20 animate-fade-in">
          <div className="flex items-center gap-3 text-sm text-accent font-medium">
            <Zap className="w-5 h-5" />
            <span>Welcome to Ilusion Pro! Your account has been upgraded successfully.</span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="p-1 hover:bg-accent/10 rounded-lg transition-colors">
            <XCircle className="w-4 h-4 text-accent/60" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Activity Feed */}
        <div className="lg:col-span-3 space-y-8">
          {/* Active Secrets Section */}
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Active Secrets</h2>
                <span className="bg-accent/10 text-accent text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {activeSecrets.length}
                </span>
              </div>
            </div>

            <div className="bg-elevated border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl">
              {activeSecrets.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                    <Shield className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No active secrets found</p>
                  <Link href="/dashboard/send" className="text-xs text-accent hover:underline mt-2 inline-block">Create your first secret</Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {activeSecrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-all hover:bg-white/[0.02]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 w-2 h-2 rounded-full bg-success glow-dot" />
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="text-sm font-mono font-bold tracking-tight text-foreground">{secret.id}</code>
                            {secret.isE2EE && <span className="badge badge-accent !text-[9px]">E2EE</span>}
                            {secret.hasPassword && <span className="badge badge-warning !text-[9px]">Encrypted</span>}
                            {secret.hasIpWhitelist && <span className="badge !bg-blue-500/10 !text-blue-400 !border-blue-500/20 !text-[9px]">Restricted</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 opacity-50" />
                              <span>Expires {new Date(secret.expiresAt).toLocaleString()}</span>
                            </div>
                            {/* File Indicator */}
                            {(() => {
                              let filesCount = 0;
                              let displayLabel = '';
                              if (secret.filesJson) {
                                try {
                                  const files = JSON.parse(secret.filesJson);
                                  filesCount = files.length;
                                  displayLabel = filesCount > 1 ? `${filesCount} Files` : files[0]?.fileName;
                                } catch (e) {}
                              } else if (secret.fileName) {
                                filesCount = 1;
                                displayLabel = secret.fileName;
                              }

                              if (filesCount === 0) return null;

                              return (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/[0.03] rounded-md border border-white/[0.05]">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="max-w-[150px] truncate">{displayLabel || 'Attached File'}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevoke(secret.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Audit Log Section */}
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-40">Security Audit Log</h2>
            </div>

            <div className="bg-elevated/50 border border-white/[0.03] rounded-3xl overflow-hidden">
              {pastSecrets.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground opacity-50">
                  No historical data available
                </div>
              ) : (
                <div className="divide-y divide-white/[0.02]">
                  {pastSecrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-50 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${secret.status === 'burned' ? 'bg-warning' : 'bg-destructive'}`} />
                        <div className="space-y-1">
                          <code className="text-xs font-mono line-through">{secret.id}</code>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {new Date(secret.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`text-[9px] px-1.5 rounded-md border ${
                              secret.status === 'burned' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                              {secret.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {secret.status === 'burned' && secret.readAt && (
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground text-right">
                          <div className="space-y-0.5">
                            <p>Read by {secret.readByIp || 'Unknown'}</p>
                            <p className="opacity-50">{new Date(secret.readAt).toLocaleString()}</p>
                          </div>
                          <Globe className="w-4 h-4 opacity-30" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Workspace Sidebar */}
        <div className="space-y-6">
          <div className="bg-elevated border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-accent/10" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Workspace Plan</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                  userPlan === 'pro' ? 'bg-accent text-white' : 'bg-white/5 text-muted-foreground'
                }`}>
                  {userPlan.toUpperCase()}
                </span>
              </div>
              
              {userPlan === 'free' ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Unlock higher limits and advanced security features.
                  </p>
                  <div className="space-y-2">
                    {['100MB Uploads', 'Password Protection', 'IP Restrictions'].map(f => (
                      <div key={f} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-accent" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link href="/pricing" className="flex items-center justify-center gap-2 w-full py-2.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-all hover:scale-[1.02] shadow-lg shadow-accent/20">
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade to Pro
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-accent font-medium leading-relaxed">
                    You have full access to all Pro features.
                  </p>
                  <div className="space-y-2">
                    {['Unlimited High-Speed', 'Priority Audit Log', 'Developer API'].map(f => (
                      <div key={f} className="flex items-center gap-2 text-[10px] text-accent/80">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-[10px] text-center font-bold text-accent">
                    Subscription Active
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-foreground">Support & Resources</h4>
            <div className="space-y-2">
              <Link href="/docs" className="block text-[11px] text-muted-foreground hover:text-accent transition-colors">API Documentation</Link>
              <Link href="/contact" className="block text-[11px] text-muted-foreground hover:text-accent transition-colors">Privacy Guide</Link>
              <a href="mailto:support@ilusion.io" className="block text-[11px] font-bold text-accent hover:underline pt-2">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
