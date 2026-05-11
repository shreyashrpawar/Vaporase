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
  Key
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
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here&apos;s an overview of your security hub.</p>
        </div>
        <Link 
          href="/create" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-accent text-white font-bold hover:bg-accent-light transition-all shadow-lg shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          New Secret
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Secrets</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold text-slate-900">{stats.active}</h3>
            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Secure</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Created</p>
          <h3 className="text-4xl font-extrabold text-slate-900">{stats.total}</h3>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all group sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Key className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">API Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <h3 className="text-xl font-bold text-slate-900">Connected</h3>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Recent Activity
            </h2>
            <Link href="/dashboard/secrets" className="text-sm font-bold text-accent hover:underline">View All</Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {recentSecrets.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No activity yet. Create your first secret!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSecrets.map((secret) => (
                  <div key={secret.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        secret.status === 'active' ? 'bg-indigo-50 text-accent' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {secret.status === 'active' ? <Zap className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate flex items-center gap-2">
                          {secret.id}
                          {secret.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                        </p>
                        <p className="text-xs text-slate-500">
                          {secret.status === 'active' ? 'Created' : 'Burned'} {new Date(secret.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {secret.status === 'active' && (
                        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-indigo-50 text-accent text-[10px] font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                      <Link 
                        href={`/secret/${secret.id}`}
                        target="_blank"
                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      >
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips / Upgrade */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Quick Tips</h2>
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <Zap className="absolute -right-4 -top-4 w-24 h-24 text-white/5 group-hover:scale-125 transition-transform duration-700" />
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Pro Feature</p>
            <h3 className="text-lg font-bold mb-4">API Automation</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Use your API keys to generate one-time links directly from your server or CLI.
            </p>
            <Link 
              href="/dashboard/api-keys" 
              className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-accent transition-colors"
            >
              Get API Key <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Recent News</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>E2EE Support</strong> is now live for all users. Secure your text secrets client-side.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-200 shrink-0 mt-1.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Dashboard v2</strong> launched today with a unified management interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
