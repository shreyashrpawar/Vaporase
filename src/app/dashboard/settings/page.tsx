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
    if (isLoaded && isSignedIn) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      if (data) {
        setProfile(data);
        setSubdomain(data.subdomain || '');
        setDisplayName(data.displayName || '');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim() || !displayName.trim()) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, displayName }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      setProfile(data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Profile Settings</h1>
          <p className="text-slate-500 text-sm">Configure your personal Secure Drop identity.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-8 rounded-xl bg-red-50 border border-red-200 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 mb-8 rounded-xl bg-green-50 border border-green-200 text-sm text-success">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-900 mb-2 block">Display Name</label>
            <p className="text-xs text-slate-500 mb-3">This is what senders will see on your drop page.</p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., John Doe or ACME Corp"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-900 mb-2 block">Secure Drop Subdomain</label>
            <p className="text-xs text-slate-500 mb-3">Claim your unique URL to receive secrets directly.</p>
            <div className="flex items-center">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="username"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-l-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 text-right"
                maxLength={30}
                required
              />
              <div className="bg-slate-100 border-y border-r border-slate-200 rounded-r-xl px-4 py-3 text-sm text-slate-500 font-mono flex items-center">
                .ilusion.io
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving || !subdomain.trim() || !displayName.trim()}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {profile && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Your Drop Link is Live</h3>
            <p className="text-sm text-slate-600 mb-3">
              Share this link in your email signature or bio to let people send you secure, self-destructing messages.
            </p>
            <div className="inline-flex items-center px-3 py-1.5 bg-white border border-indigo-100 rounded-lg text-xs font-mono font-bold text-accent">
              https://{profile.subdomain}.ilusion.io
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
