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
    setIsSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/profile', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ subdomain, displayName }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setProfile(data); 
      setSuccess('Profile updated successfully!'); 
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  if (!isLoaded || isLoading) return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      <div className="px-1">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500">Workspace Settings</h2>
        <p className="text-xs text-[#534d5e] dark:text-zinc-400 mt-1">Configure your receiving profile identity and advanced workspace preferences.</p>
      </div>

      {(error || success) && (
        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold border ${
          error
            ? 'bg-red-500/10 text-red-500 border-red-500/20'
            : 'bg-green-500/10 text-green-500 border-green-500/20'
        }`}>
          {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Settings Panel */}
        <div className="lg:col-span-8 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <SettingsIcon className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Identity Details</h3>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm shadow-zinc-900/5">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Display name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 ml-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Shreyash Pawar"
                      className="w-full bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm"
                      maxLength={50}
                      required
                    />
                    <p className="text-[9px] text-[#a5a1ad] dark:text-zinc-500 ml-1">Visible to anyone sending you encrypted messages or files.</p>
                  </div>

                  {/* Drop Alias */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 ml-1">Secure Drop Alias</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="username"
                        className="flex-1 bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-l-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm font-mono text-right"
                        maxLength={30}
                        required
                      />
                      <div className="flex items-center px-4 bg-[#f5f5ed] border border-[#e5e3d9] dark:border-zinc-800 border-l-0 rounded-r-xl text-[10px] font-bold text-[#534d5e] dark:text-zinc-400 self-stretch">
                        .ilusion.io
                      </div>
                    </div>
                    <p className="text-[9px] text-[#a5a1ad] dark:text-zinc-500 ml-1">Your public drop page: <span className="text-accent font-bold">{subdomain || 'username'}.ilusion.io</span></p>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#e5e3d9] dark:border-zinc-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || !subdomain.trim() || !displayName.trim()}
                    className="px-6 py-2.5 bg-accent hover:bg-accent-light disabled:bg-accent/30 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Advanced Security */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Globe className="w-4 h-4 text-accent" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Advanced Controls</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl space-y-3 opacity-55 relative group cursor-not-allowed shadow-sm shadow-zinc-900/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">Custom Branding</h4>
                  <Lock className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-[10px] text-[#534d5e] dark:text-zinc-400 leading-relaxed">
                  Upload corporate logos and inject signature layouts for your public drop pages.
                </p>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2 py-0.5 bg-accent text-white text-[8px] font-black rounded-full uppercase tracking-wider">Coming soon</span>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl space-y-3 relative group shadow-sm shadow-zinc-900/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">IP Restriction Lists</h4>
                  <Shield className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-[10px] text-[#534d5e] dark:text-zinc-400 leading-relaxed">
                  Lock down and reject incoming drop attempts unless originating from whitelisted IP pools.
                </p>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[8px] font-black rounded-full uppercase tracking-wider">Included</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-6 shadow-sm shadow-zinc-900/5 space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-accent/10" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-black uppercase tracking-wider">Sender Preview</h3>
              </div>

              <div className="p-4 bg-[#faf9f5]/50 dark:bg-zinc-900/40 border border-[#e5e3d9] dark:border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-black text-lg">
                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{displayName || 'Your Name'}</p>
                    <p className="text-[10px] text-[#a5a1ad] dark:text-zinc-550">@{subdomain || 'alias'}</p>
                  </div>
                </div>
                <div className="h-20 w-full bg-white dark:bg-zinc-950 rounded-xl border border-dashed border-[#e5e3d9] dark:border-zinc-800 flex items-center justify-center shadow-inner">
                  <p className="text-[9px] text-[#a5a1ad] dark:text-zinc-500 uppercase tracking-widest font-bold">Secure Drop Area</p>
                </div>
              </div>

              <p className="text-[9px] text-[#a5a1ad] dark:text-zinc-500 leading-relaxed italic">
                * This illustrates how sender-facing drop interfaces represent your workspace identity.
              </p>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/10 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-accent uppercase tracking-wider">Stealth Mode</h4>
            <p className="text-[10px] text-[#534d5e] dark:text-zinc-400 leading-relaxed font-medium">
              Temporarily deactivate public drop routing. Senders will receive a locked rejection state.
            </p>
            <button className="w-full py-2 bg-accent/10 border border-accent/20 text-accent rounded-xl text-[10px] font-bold hover:bg-accent/15 transition-all cursor-pointer">
              Pause Public Drops
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
