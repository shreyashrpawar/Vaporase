'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth, useUser } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Shield, Settings, Rocket, LayoutGrid } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Initialize profile with Clerk publicMetadata if available (instant load)
  const [profile, setProfile] = useState<any>(() => {
    if (user?.publicMetadata?.plan) {
      return { plan: user.publicMetadata.plan, planExpiresAt: user.publicMetadata.planExpiresAt };
    }
    return null;
  });

  useEffect(() => {
    if (isSignedIn) {
      // Sync from Clerk instantly in case state didn't catch it
      if (user?.publicMetadata?.plan) {
        setProfile((prev: any) => ({
          ...prev,
          plan: user.publicMetadata.plan,
          planExpiresAt: user.publicMetadata.planExpiresAt || prev?.planExpiresAt
        }));
      }

      // Background fetch to ensure absolute consistency
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data && (!profile || data.plan !== profile.plan || data.planExpiresAt !== profile.planExpiresAt)) {
            setProfile(data);
          }
        })
        .catch(err => console.error('Failed to fetch profile in layout:', err));
    }
  }, [isSignedIn, user]);

  if (!isLoaded) return null;

  const isSettings = pathname === '/dashboard/settings';

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] flex flex-col font-sans transition-colors overflow-hidden">
      {/* ═══ Top Navigation — Theme Aware ═══ */}
      <header
        className="h-14 md:h-[52px] shrink-0 flex items-center justify-between px-4 md:px-5 transition-colors border-b"
        style={{
          backgroundColor: 'var(--dashboard-nav-bg)',
          borderColor: 'var(--dashboard-nav-border)',
        }}
      >
        <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--accent-primary)] shadow-md border border-black/5 dark:border-white/10 transition-all group-hover:scale-105">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span
              className="text-[15px] font-bold tracking-tight hidden sm:inline"
              style={{ color: 'var(--dashboard-nav-text)' }}
            >
              ilusion<span style={{ opacity: 0.4 }}>.io</span>
            </span>
          </Link>

          {/* Desktop Nav Pills */}
          <nav
            className="hidden md:flex items-center gap-0.5 rounded-lg p-0.5"
            style={{ backgroundColor: 'var(--dashboard-nav-pill-bg)' }}
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all"
              style={{
                backgroundColor: !isSettings ? 'var(--dashboard-nav-pill-active)' : 'transparent',
                color: !isSettings ? 'var(--dashboard-nav-text)' : 'var(--dashboard-nav-text-muted)',
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Workspace
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all"
              style={{
                backgroundColor: isSettings ? 'var(--dashboard-nav-pill-active)' : 'transparent',
                color: isSettings ? 'var(--dashboard-nav-text)' : 'var(--dashboard-nav-text-muted)',
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {profile?.plan === 'pro' ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-[var(--accent-subtle)] border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full">
              <Rocket className="w-3 h-3 text-[var(--accent-primary)]" />
              <span className="text-[11px] font-bold text-[var(--accent-primary)] tracking-wide uppercase">Pro</span>
              {profile?.planExpiresAt && (
                <>
                  <span style={{ color: 'var(--dashboard-nav-text-muted)', opacity: 0.4 }}>·</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--dashboard-nav-text-muted)' }}>
                    {new Date(profile.planExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/pricing"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-all rounded-lg text-white text-[12px] font-bold shadow-sm hover:shadow-md active:scale-[0.97]"
            >
              <Rocket className="w-3 h-3" /> Upgrade
            </Link>
          )}
          <div
            className="pl-2.5 h-5 flex items-center"
            style={{ borderLeft: '1px solid var(--dashboard-nav-border)' }}
          >
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          </div>
        </div>
      </header>

      {/* ═══ Mobile Sub-Nav (visible below md) ═══ */}
      <div
        className="md:hidden shrink-0 flex items-center gap-1 px-3 py-1.5 border-b transition-colors"
        style={{
          backgroundColor: 'var(--dashboard-nav-bg)',
          borderColor: 'var(--dashboard-nav-border)',
        }}
      >
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
          style={{
            backgroundColor: !isSettings ? 'var(--dashboard-nav-pill-active)' : 'transparent',
            color: !isSettings ? 'var(--dashboard-nav-text)' : 'var(--dashboard-nav-text-muted)',
          }}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Workspace
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all"
          style={{
            backgroundColor: isSettings ? 'var(--dashboard-nav-pill-active)' : 'transparent',
            color: isSettings ? 'var(--dashboard-nav-text)' : 'var(--dashboard-nav-text-muted)',
          }}
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </Link>
        {profile?.plan !== 'pro' && (
          <Link href="/pricing" className="flex items-center gap-1 px-2.5 py-2 bg-[var(--accent-primary)] rounded-lg text-white text-[11px] font-bold">
            <Rocket className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
