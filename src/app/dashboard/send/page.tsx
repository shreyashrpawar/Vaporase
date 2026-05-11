'use client';

import { useState } from 'react';
import { Search, User, Send, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import DropForm from '@/app/(drop)/[subdomain]/DropForm';

export default function DirectSendPage() {
  const [query, setQuery] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setProfile(null);

    try {
      const res = await fetch(`/api/profile/search?subdomain=${query.trim().toLowerCase()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'User not found');
      }

      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Send a Secret</h1>
          <p className="text-slate-500 mt-1">Drop a secure, ephemeral message directly into another user's inbox.</p>
        </div>
      </div>

      {!profile ? (
        <div className="glass rounded-3xl p-8 md:p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 rounded-3xl bg-accent/5 flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Who are you sending to?</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            Enter their Ilusion username below to find their secure inbox.
          </p>

          <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter username (e.g. shreyash)"
                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent/40 transition-all shadow-sm"
              />
            </div>
            
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive justify-center">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="mt-6 w-full py-4 rounded-2xl bg-accent hover:bg-accent-light text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-accent/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find User
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipient Found</p>
                <p className="text-lg font-bold text-slate-900">{profile.displayName}</p>
              </div>
            </div>
            <button
              onClick={() => setProfile(null)}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-accent transition-colors"
            >
              Change User
            </button>
          </div>

          <div className="animate-fade-in-up delay-100">
            <DropForm profile={profile} />
          </div>
        </div>
      )}
    </div>
  );
}
