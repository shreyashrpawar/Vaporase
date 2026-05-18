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
    <div className="flex flex-col h-full animate-fade-in">
      {/* Messages */}
      {showSuccess && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 shrink-0 mb-4">
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
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-destructive/10 text-destructive border border-destructive/20 shrink-0 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="h-14 flex items-center justify-between border-b border-transparent text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500 shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> Active Secrets
        </div>
        <span className="bg-[#6F21C1]/10 text-[#6F21C1] dark:bg-[#6F21C1]/20 dark:text-[#D494FF] text-[9px] px-2 py-0.5 rounded-full font-bold">
          {activeSecrets.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-4 custom-scrollbar">
        {activeSecrets.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/[0.02] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-white/[0.05]">
              <Shield className="w-6 h-6 text-slate-400 dark:text-zinc-600" />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">No active secrets found</p>
          </div>
        ) : (
          activeSecrets.map((secret) => (
            <div
              key={secret.id}
              className="group relative flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md"
            >
              {/* Purple Left Border line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6F21C1] rounded-l-xl" />

              <div className="flex items-start justify-between pl-1">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                    {secret.recipient ? `To: ${secret.recipient.displayName}` : 'Unnamed secret'}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {secret.recipient ? (
                      <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-md font-semibold tracking-wide">
                        Direct
                      </span>
                    ) : (
                      <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-semibold tracking-wide">
                        Public link
                      </span>
                    )}
                    
                    {secret.hasPassword && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md font-semibold tracking-wide">
                        Locked
                      </span>
                    )}
                    
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${
                      secret.burnOnRead 
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                        : 'bg-[#6F21C1]/10 text-[#6F21C1] dark:text-[#D494FF]'
                    }`}>
                      {secret.burnOnRead ? '1-View burn' : 'Multi-view'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 pt-1 font-medium">
                    <Clock className="w-3 h-3 opacity-60" />
                    <span>Expires {new Date(secret.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                
                {/* Active Dot */}
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-1 pl-1">
                <button
                  onClick={() => handleCopyLink(secret)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  {copiedId === secret.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy link</span>
                </button>

                <button
                  onClick={() => handleRevoke(secret.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
