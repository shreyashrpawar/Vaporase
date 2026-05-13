'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Shield, Clock, Trash2, CheckCircle2, XCircle, Loader2, AlertCircle, Globe, FileText } from 'lucide-react';

export default function SecretsDashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [secrets, setSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setShowSuccess(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Secrets</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Manage and audit your shared secrets.</p>
      </div>

      {showSuccess && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-accent/10 border border-accent/20 animate-fade-in">
          <div className="flex items-center gap-3 text-sm text-accent-light font-medium">
            <Zap className="w-5 h-5" />
            <span>Welcome to Ilusion Pro! Your account has been upgraded successfully.</span>
          </div>
          <button onClick={() => setShowSuccess(false)} className="p-1 hover:bg-accent/10 rounded-lg transition-colors">
            <XCircle className="w-4 h-4 text-accent/60" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--destructive)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Active */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <Shield className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active ({activeSecrets.length})</h2>
        </div>
        {activeSecrets.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No active secrets</p>
          </div>
        ) : (
          <div>
            {activeSecrets.map((secret, i) => (
              <div
                key={secret.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                style={{ borderBottom: i < activeSecrets.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-overlay)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{secret.id}</code>
                    {secret.isE2EE && <span className="badge badge-accent">E2EE</span>}
                    {secret.hasPassword && <span className="badge badge-warning">Locked</span>}
                    {secret.hasIpWhitelist && <span className="badge" style={{ background: 'color-mix(in srgb, #3b82f6 10%, transparent)', color: '#60a5fa', border: '1px solid color-mix(in srgb, #3b82f6 20%, transparent)' }}>IP</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(secret.expiresAt).toLocaleString()}</span>
                    {secret.fileName && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {secret.fileName}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(secret.id)}
                  className="btn-secondary !py-1.5 !px-3 !text-xs !rounded-lg !gap-1.5"
                  style={{ color: 'var(--destructive)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>Audit Log</h2>
        </div>
        {pastSecrets.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No history yet</p>
          </div>
        ) : (
          <div>
            {pastSecrets.map((secret, i) => (
              <div
                key={secret.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: i < pastSecrets.length - 1 ? '1px solid var(--border-subtle)' : 'none', opacity: 0.6 }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono line-through" style={{ color: 'var(--text-tertiary)' }}>{secret.id}</code>
                    {secret.status === 'burned' ? (
                      <span className="badge badge-warning"><CheckCircle2 className="w-3 h-3" /> Burned</span>
                    ) : (
                      <span className="badge badge-destructive"><XCircle className="w-3 h-3" /> Revoked</span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(secret.createdAt).toLocaleString()}
                  </p>
                </div>
                {secret.status === 'burned' && secret.readAt && (
                  <div className="text-right text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <p>Read: {new Date(secret.readAt).toLocaleString()}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5"><Globe className="w-3 h-3" />{secret.readByIp || 'Unknown'}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
