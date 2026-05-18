'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Shield, Settings, Menu, X, Rocket, LayoutGrid } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(err => console.error('Failed to fetch profile in layout:', err));
    }
  }, [isSignedIn]);

  if (!isLoaded) return null;

  const isSettings = pathname === '/dashboard/settings';

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] dark:bg-zinc-950 flex flex-col font-sans transition-colors overflow-hidden">
      {/* ═══ Top Navigation ═══ */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[#1f152e] dark:bg-zinc-900 border-b border-white/5 dark:border-zinc-800 transition-colors">
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--accent-primary)] shadow-inner border border-white/10 transition-all group-hover:scale-105">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              ilusion<span className="text-white/60">.io</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                !isSettings 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Workspace
            </Link>
            <Link
              href="/dashboard/settings"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                isSettings 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings & API
            </Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {profile?.plan === 'pro' ? (
            <div className="hidden sm:flex flex-col items-end gap-0.5 text-right bg-white/5 border border-accent/20 px-3.5 py-1 rounded-2xl">
              <span className="text-[10px] font-bold text-accent tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                <Rocket className="w-3 h-3 text-accent" /> Pro Member
              </span>
              {profile?.planExpiresAt && (
                <span className="text-[9px] text-white/50 font-mono">
                  Expires {new Date(profile.planExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          ) : (
            <Link href="/pricing" className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors rounded-full text-white text-sm font-bold shadow-md shadow-purple-950/20">
              <Rocket className="w-3.5 h-3.5" /> Upgrade
            </Link>
          )}
          <div className="border-l border-white/10 pl-4 h-6 flex items-center">
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 border border-white/10" } }} />
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Dropdown */}
      {isMobileOpen && (
        <div className="md:hidden bg-[#1f152e] dark:bg-zinc-900 border-b border-white/5 dark:border-zinc-800">
          <div className="px-4 py-3 flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                !isSettings ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Workspace
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isSettings ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings & API
            </Link>
            <div className="h-px bg-white/10 my-2" />
            
            {profile?.plan === 'pro' ? (
              <div className="flex flex-col gap-0.5 bg-white/5 border border-accent/20 px-4 py-3 rounded-xl mx-2">
                <span className="text-[11px] font-bold text-accent tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                  <Rocket className="w-3.5 h-3.5 text-accent" /> Pro Member
                </span>
                {profile?.planExpiresAt && (
                  <span className="text-[10px] text-white/50 font-mono">
                    Expires {new Date(profile.planExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            ) : (
              <Link
                href="/pricing"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-all mx-2"
              >
                <Rocket className="w-4 h-4" /> Upgrade to Pro
              </Link>
            )}

            <div className="h-px bg-white/10 my-2" />
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-bold text-white/60">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
