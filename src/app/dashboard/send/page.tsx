'use client';

import { useState } from 'react';
import { Search, User, Send, Loader2, AlertCircle } from 'lucide-react';
import DropForm from '@/app/(drop)/[subdomain]/DropForm';

export default function DirectSendPage() {
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true); setError(''); setProfile(null);
    try {
      const res = await fetch(`/api/profile/search?subdomain=${query.trim().toLowerCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User not found');
      setProfile(data);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Send</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Drop a secret into another user&apos;s inbox.</p>
      </div>

      {!profile ? (
        <div className="card p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Send className="w-7 h-7" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Who are you sending to?</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>Enter their Ilusion username.</p>

          <form onSubmit={handleSearch} className="max-w-sm mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="username" className="input !pl-10 !text-base !py-3" />
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-xs justify-center" style={{ color: 'var(--destructive)' }}>
                <AlertCircle className="w-3.5 h-3.5" />{error}
              </div>
            )}
            <button type="submit" disabled={isLoading || !query.trim()} className="btn-primary w-full mt-4">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</> : <><Search className="w-4 h-4" />Find User</>}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <User className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Recipient</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{profile.displayName}</p>
              </div>
            </div>
            <button onClick={() => setProfile(null)} className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Change</button>
          </div>
          <div className="animate-fade-in-up delay-100">
            <DropForm profile={profile} />
          </div>
        </div>
      )}
    </div>
  );
}
