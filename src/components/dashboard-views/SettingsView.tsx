'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Settings as SettingsIcon, Globe, Check, Loader2, AlertCircle, Save, Lock, Eye, Shield } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      <div className="px-2">
        <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Workspace Settings</h2>
        <p className="text-xs text-muted-foreground mt-1">Configure your identity and receiving preferences.</p>
      </div>

      {(error || success) && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${error
          ? 'bg-destructive/10 text-destructive border-destructive/20'
          : 'bg-success/10 text-success border-success/20'
          }`}>
          {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          {error || success}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-4 px-2">
              <SettingsIcon className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Identity</h3>
            </div>

            <div className="bg-elevated border border-white/[0.05] rounded-3xl p-8 shadow-2xl">
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Shreyash Pawar"
                      className="input !bg-white/[0.02] border-white/[0.1] focus:border-accent/30"
                      maxLength={50}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground ml-1 opacity-60">Visible to anyone sending you secrets.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Drop Alias</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="username"
                        className="input !rounded-r-none !bg-white/[0.02] border-white/[0.1] focus:border-accent/30 flex-1 text-right font-mono"
                        maxLength={30}
                        required
                      />
                      <div className="flex items-center px-4 bg-white/[0.05] border border-white/[0.1] border-l-0 rounded-r-2xl text-[11px] font-bold text-muted-foreground">
                        .ilusion.io
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-1 opacity-60">Your permanent secure drop URL: <span className="text-accent">{subdomain || 'username'}.ilusion.io</span></p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/[0.05] flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || !subdomain.trim() || !displayName.trim()}
                    className="btn-primary !py-3 !px-10 !text-xs group"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <Globe className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">Advanced Security</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4 opacity-50 relative group cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">Custom Branding</h4>
                  <Lock className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Upload your company logo and customize colors for your public drop page.
                </p>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="badge badge-accent !text-[9px]">Coming soon</span>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4 relative group">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">IP Restrictions</h4>
                  <Shield className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Restrict access to your drop link to specific IP ranges or regions.
                </p>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="badge badge-accent !text-[9px]">Included</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-elevated border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-accent/10" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold">Public Preview</h3>
              </div>

              <div className="p-5 bg-white/[0.03] border border-white/[0.05] rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{displayName || 'Your Name'}</p>
                    <p className="text-[10px] text-muted-foreground">@{subdomain || 'alias'}</p>
                  </div>
                </div>
                <div className="h-20 w-full bg-white/[0.05] rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Secure Drop Area</p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                * This is how your secure profile looks to external senders.
              </p>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-accent">Go Anonymous?</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              If you disable your public profile, users can only send secrets via direct ID.
            </p>
            <button className="w-full py-2 bg-accent/10 border border-accent/20 text-accent rounded-lg text-[10px] font-bold hover:bg-accent/20 transition-all">
              Pause Public Drop (Coming Soon)
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
