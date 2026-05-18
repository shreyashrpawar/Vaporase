'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Lock, Shield, Settings, Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!isLoaded) return null;

  const navItems = [
    { name: 'Workspace', href: '/dashboard', icon: Shield },
    { name: 'Settings & API', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* ═══ Top Navigation ═══ */}
      <header 
        className="sticky top-0 z-50 border-b"
        style={{ 
          background: 'var(--bg-elevated)', 
          backdropFilter: 'blur(20px)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
                  <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
                </span>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/dashboard') && pathname !== '/dashboard/settings');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isActive 
                          ? 'bg-accent/10 text-accent' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserButton />
              
              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2 text-muted-foreground"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
              >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === '/dashboard' && pathname !== '/dashboard/settings');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-accent/10 text-accent' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
