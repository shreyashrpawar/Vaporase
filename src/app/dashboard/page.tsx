'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { 
  Shield, 
  Plus, 
  Clock, 
  ArrowRight, 
  Zap, 
  Eye, 
  Trash2,
  FileText,
  Activity,
  Key,
  Inbox,
  Send
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function DashboardOverview() {
  const { isLoaded, isSignedIn } = useAuth();
  const [stats, setStats] = useState({ active: 0, total: 0 });
  const [recentSecrets, setRecentSecrets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDashboardData();
    }
  }, [isLoaded, isSignedIn]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/secrets/dashboard');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRecentSecrets(data.slice(0, 5));
      setStats({
        active: data.filter((s: any) => s.status === 'active').length,
        total: data.length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
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
    <div className="space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back. Here&apos;s an overview of your security hub.</p>
        </div>
        <Link 
          href="/create" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-accent text-white font-bold hover:bg-accent-light transition-all shadow-lg shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0 border border-accent/50"
        >
          <Plus className="w-5 h-5" />
          New Secret
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/[0.06] card-glow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Live</span>
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Active Secrets</p>
          <h3 className="text-3xl font-extrabold text-zinc-100 stat-number">{stats.active}</h3>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/[0.06] card-glow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Total Created</p>
          <h3 className="text-3xl font-extrabold text-zinc-100 stat-number">{stats.total}</h3>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/[0.06] card-glow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Inbox className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Inbox Drops</p>
          <h3 className="text-3xl font-extrabold text-zinc-100 stat-number">—</h3>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/[0.06] card-glow group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Key className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success glow-dot" />
              <span className="text-xs font-bold text-zinc-500">Online</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">API Status</p>
          <h3 className="text-lg font-bold text-zinc-100">Connected</h3>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/create" className="bg-zinc-900/50 rounded-2xl p-6 border border-white/[0.06] card-glow group flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-accent-light" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-200 group-hover:text-white transition-colors">Create New Secret</h3>
            <p className="text-xs text-zinc-500">Encrypt & share a one-time link</p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-600 ml-auto group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </Link>
        <Link href="/dashboard/send" className="bg-zinc-900/50 rounded-2xl p-6 border border-white/[0.06] card-glow group flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Send className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-200 group-hover:text-white transition-colors">Send to Inbox</h3>
            <p className="text-xs text-zinc-500">Drop a secret to another user</p>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-600 ml-auto group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Recent Activity
            </h2>
            <Link href="/dashboard/secrets" className="text-sm font-bold text-accent hover:text-accent-light transition-colors">View All</Link>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl border border-white/[0.06] overflow-hidden">
            {recentSecrets.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">No activity yet. Create your first secret!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentSecrets.map((secret) => (
                  <div key={secret.id} className="p-5 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        secret.status === 'active' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-600'
                      }`}>
                        {secret.status === 'active' ? <Zap className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-200 truncate flex items-center gap-2 text-sm">
                          {secret.id}
                          {secret.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-success glow-dot" />}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {secret.status === 'active' ? 'Created' : 'Burned'} {new Date(secret.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {secret.status === 'active' && (
                        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/15">
                          Active
                        </span>
                      )}
                      <Link 
                        href={`/secret/${secret.id}`}
                        target="_blank"
                        className="p-2 hover:bg-white/[0.05] rounded-lg border border-transparent hover:border-white/[0.08] transition-all"
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-200">Quick Tips</h2>
          <div className="bg-gradient-to-br from-accent/15 via-zinc-900 to-zinc-900 rounded-2xl p-6 border border-accent/10 relative overflow-hidden group">
            <Zap className="absolute -right-4 -top-4 w-24 h-24 text-accent/5 group-hover:scale-125 transition-transform duration-700" />
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Pro Feature</p>
            <h3 className="text-lg font-bold text-zinc-100 mb-3">API Automation</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5">
              Use your API keys to generate one-time links directly from your server or CLI.
            </p>
            <Link 
              href="/dashboard/api-keys" 
              className="inline-flex items-center gap-2 text-sm font-bold text-accent-light hover:text-white transition-colors"
            >
              Get API Key <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-white/[0.06]">
            <h3 className="font-bold text-zinc-200 mb-4">Recent News</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-300">Secure Drop Inbox</strong> — Receive encrypted messages via your unique subdomain.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-300">Reply Securely</strong> — Reply to dropped secrets with one click.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0 mt-1.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-300">QR Codes</strong> — Every secret link now includes a QR code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
