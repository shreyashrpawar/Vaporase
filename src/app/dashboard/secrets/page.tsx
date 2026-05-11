'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  Shield, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Globe,
  FileText
} from 'lucide-react';

export default function SecretsDashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchSecrets();
    }
  }, [isLoaded, isSignedIn]);

  const fetchSecrets = async () => {
    try {
      const res = await fetch('/api/secrets/dashboard');
      if (!res.ok) throw new Error('Failed to fetch secrets');
      const data = await res.json();
      setSecrets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this secret? It will be permanently destroyed.')) return;

    try {
      const res = await fetch('/api/secrets/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) throw new Error('Failed to revoke secret');
      
      // Update local state
      setSecrets(secrets.map(s => s.id === id ? { ...s, status: 'revoked' } : s));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const activeSecrets = secrets.filter(s => s.status === 'active');
  const pastSecrets = secrets.filter(s => s.status !== 'active');

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center">
          <Shield className="w-6 h-6 text-accent-light" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">My Secrets</h1>
          <p className="text-zinc-500 text-sm">Detailed history and management of your shared secrets.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-8 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Active Secrets Section */}
      <div className="bg-zinc-900/50 rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.04]">
          <h2 className="text-lg font-bold text-zinc-200">Active Secrets</h2>
        </div>
        <div className="p-6">
          {activeSecrets.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No active secrets.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSecrets.map((secret) => (
                <div key={secret.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] card-glow">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="text-sm font-mono font-bold text-zinc-200 bg-white/[0.04] px-2 py-1 rounded-lg border border-white/[0.08]">
                        {secret.id}
                      </code>
                      {secret.isE2EE && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider border border-indigo-500/15">E2EE</span>}
                      {secret.hasPassword && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 uppercase tracking-wider border border-amber-500/15">Locked</span>}
                      {secret.hasIpWhitelist && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 uppercase tracking-wider border border-sky-500/15">IP Limited</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Exp: {new Date(secret.expiresAt).toLocaleString()}</span>
                      {secret.fileName && <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {secret.fileName}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(secret.id)}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Revoke Secret
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="bg-zinc-900/50 rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/[0.04]">
          <h2 className="text-lg font-bold text-zinc-400">Audit Log & History</h2>
        </div>
        <div className="p-6">
          {pastSecrets.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No history yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastSecrets.map((secret) => (
                <div key={secret.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] opacity-60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono text-zinc-600 line-through">
                        {secret.id}
                      </code>
                      {secret.status === 'burned' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <CheckCircle2 className="w-4 h-4" /> Burned
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                          <XCircle className="w-4 h-4" /> Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">
                      Created: {new Date(secret.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {secret.status === 'burned' && secret.readAt && (
                    <div className="text-right sm:text-right">
                      <div className="text-xs font-bold text-zinc-400 mb-1">Read on {new Date(secret.readAt).toLocaleString()}</div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                        <Globe className="w-3 h-3" /> {secret.readByIp || 'Unknown IP'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
