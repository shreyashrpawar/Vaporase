'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import {
  Shield,
  Plus,
  ArrowRight,
  Zap,
  Eye,
  Activity,
  Key,
  Inbox,
  Send,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function DashboardOverview() {
  const { isLoaded, isSignedIn } = useAuth();
  const [stats, setStats] = useState({ active: 0, total: 0, burned: 0 });
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
      setRecentSecrets(data.slice(0, 6));
      setStats({
        active: data.filter((s: any) => s.status === 'active').length,
        total: data.length,
        burned: data.filter((s: any) => s.status === 'burned').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Overview
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Welcome back. Here&apos;s your security dashboard.
          </p>
        </div>
      </div>

      {/* ═══ Bento Grid ═══ */}
      <div className="bento-grid stagger">
        {/* ── Active Secrets (large) ── */}
        <div className="bento-span-2 card card-glow p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                <Shield className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Active Secrets</span>
            </div>
            <span className="badge badge-success">Live</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {stats.active}
            </span>
            <span className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              of {stats.total} total
            </span>
          </div>
          <div className="flex gap-1 mt-4">
            {Array.from({ length: Math.min(stats.total, 20) }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full"
                style={{
                  background: i < stats.active ? 'var(--accent-primary)' : 'var(--border-default)',
                  opacity: i < stats.active ? 1 : 0.5,
                }}
              />
            ))}
            {stats.total === 0 && <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--border-default)' }} />}
          </div>
        </div>

        {/* ── Burned ── */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)' }}>
              <Eye className="w-4 h-4" style={{ color: 'var(--warning)' }} />
            </div>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Burned</span>
          <span className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{stats.burned}</span>
        </div>

        {/* ── API Status ── */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)' }}>
              <Key className="w-4 h-4" style={{ color: 'var(--success)' }} />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="status-dot live" />
            </div>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>API</span>
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Connected</span>
        </div>

        {/* ── Quick Actions (full width) ── */}
        <div className="bento-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/create" className="card card-glow p-5 flex items-center gap-4 group cursor-pointer">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
              style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}
            >
              <Plus className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Create New Secret</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Encrypt & share a one-time link</p>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-tertiary)' }} />
          </Link>

          <Link href="/dashboard/send" className="card card-glow p-5 flex items-center gap-4 group cursor-pointer">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
              style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)' }}
            >
              <Send className="w-5 h-5" style={{ color: 'var(--success)' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Send to Inbox</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Drop a secret to another user</p>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: 'var(--text-tertiary)' }} />
          </Link>
        </div>

        {/* ── Recent Activity (full width) ── */}
        <div className="bento-span-full card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
            </div>
            <Link href="/dashboard/secrets" className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
              View All
            </Link>
          </div>

          {recentSecrets.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No activity yet</p>
            </div>
          ) : (
            <div>
              {recentSecrets.map((secret, i) => (
                <div
                  key={secret.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 transition-colors"
                  style={{
                    borderBottom: i < recentSecrets.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-overlay)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: secret.status === 'active' ? 'var(--accent-subtle)' : 'var(--surface-overlay)',
                      }}
                    >
                      {secret.status === 'active' ? (
                        <Zap className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      ) : (
                        <Eye className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {secret.id.slice(0, 12)}...
                        </code>
                        {secret.status === 'active' && <div className="status-dot live" style={{ width: 6, height: 6 }} />}
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(secret.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {secret.status === 'active' ? (
                      <span className="badge badge-accent">Active</span>
                    ) : (
                      <span className="badge badge-warning">Burned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
