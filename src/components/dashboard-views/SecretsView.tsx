'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shield, Clock, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle, Globe, FileText, Zap, Check, Copy } from 'lucide-react';

export default function SecretsDashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (secret: any) => {
    const link = `${window.location.origin}/secret/${secret.alias || secret.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(secret.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

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
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      {showSuccess && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 animate-fade-in shrink-0">
          <div className="flex items-center gap-2 text-xs text-accent font-medium">
            <Zap className="w-4 h-4" />
            <span>Welcome to Ilusion Pro!</span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="p-1 hover:bg-accent/10 rounded-lg transition-colors">
            <XCircle className="w-3.5 h-3.5 text-accent/60" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> Active Secrets
        </h2>
        <span className="bg-accent/10 text-accent text-[9px] px-2 py-0.5 rounded-full font-bold">
          {activeSecrets.length}
        </span>
      </div>

      <div className="bg-elevated border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl flex-1 flex flex-col">
        {activeSecrets.length === 0 ? (
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-white/[0.02] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/[0.05]">
              <Shield className="w-6 h-6 text-muted-foreground opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">No active secrets found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05] overflow-y-auto max-h-[500px]">
            {activeSecrets.map((secret) => (
              <div
                key={secret.id}
                className="group flex flex-col justify-between gap-3 p-4 transition-all hover:bg-white/[0.02]"
              >
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-success glow-dot shrink-0" />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="text-xs font-mono font-bold tracking-tight text-foreground truncate">{secret.id.slice(0, 12)}...</code>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {secret.recipient ? (
                          <span className="text-[8px] bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            To: {secret.recipient.displayName}
                          </span>
                        ) : (
                          <span className="text-[8px] bg-white/5 text-muted-foreground border border-white/5 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Public Link
                          </span>
                        )}
                        {secret.hasPassword && (
                          <span className="text-[8px] bg-warning/10 text-warning border border-warning/20 px-1.5 py-0.5 rounded font-black tracking-wide uppercase">
                            Locked
                          </span>
                        )}
                        <span className={`text-[8px] border px-1.5 py-0.5 rounded font-black tracking-wide uppercase ${
                          secret.burnOnRead 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {secret.burnOnRead ? '1-View Burn' : 'Multi-View'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground pt-0.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 opacity-50" />
                          <span className="truncate">Expires {new Date(secret.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyLink(secret)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                      title="Copy Link"
                    >
                      {copiedId === secret.id ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRevoke(secret.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Revoke"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
