'use client';

import { useState } from 'react';
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
  const { isLoaded } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
          <button className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] transition-colors rounded-full text-white text-sm font-bold shadow-md shadow-purple-950/20">
            <Rocket className="w-3.5 h-3.5" /> Upgrade
          </button>
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
