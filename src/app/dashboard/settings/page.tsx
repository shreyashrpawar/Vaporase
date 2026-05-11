'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Settings as SettingsIcon, Globe, Check, Loader2, AlertCircle, Save } from 'lucide-react';

export default function SettingsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [subdomain, setSubdomain] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchProfile();
  }, [isLoaded, isSignedIn]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      if (data) { setProfile(data); setSubdomain(data.subdomain || ''); setDisplayName(data.displayName || ''); }
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim() || !displayName.trim()) return;
    setIsSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subdomain, displayName }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setProfile(data); setSuccess('Profile updated!'); setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setIsSaving(false); }
  };

  if (!isLoaded || isLoading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Configure your Secure Drop identity.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--destructive)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--success)' }}>
          <Check className="w-4 h-4 shrink-0" />{success}
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>Display Name</label>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Visible on your drop page.</p>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., John Doe" className="input" maxLength={50} required />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>Subdomain</label>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Your unique URL for receiving secrets.</p>
            <div className="flex">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="username"
                className="input !rounded-r-none text-right"
                maxLength={30}
                required
              />
              <div
                className="flex items-center px-3 text-xs font-mono whitespace-nowrap rounded-r-xl"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderLeft: 'none', color: 'var(--text-tertiary)' }}
              >
                .ilusion.io
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <button type="submit" disabled={isSaving || !subdomain.trim() || !displayName.trim()} className="btn-primary w-full">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {profile && (
        <div className="card gradient-border p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
            <Globe className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Your Drop Link</p>
            <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Share this to receive encrypted messages.</p>
            <code className="text-xs font-mono font-bold px-2 py-1 rounded-md" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
              https://{profile.subdomain}.ilusion.io
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
