'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Key,
  Shield,
  Lock,
  Inbox,
  Settings,
  Send,
  Plus,
  Eye,
  Smartphone,
} from 'lucide-react';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!isLoaded) return null;

  const groupedNav = [
    {
      group: 'Security',
      items: [
        { name: 'Create Secret', href: '/dashboard/send', icon: Plus },
        { name: 'My Secrets', href: '/dashboard/secrets', icon: Shield },
        { name: 'Reveal', href: '/dashboard/reveal', icon: Eye },
      ]
    },
    {
      group: 'Collaboration',
      items: [
        { name: 'Secure Inbox', href: '/dashboard/inbox', icon: Inbox },
      ]
    },
    {
      group: 'Developer',
      items: [
        { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
        { name: 'Documentation', href: '/docs/api', icon: Lock },
      ]
    },
    {
      group: 'Preferences',
      items: [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* ═══ Desktop Sidebar ═══ */}
      <aside 
        className="fixed inset-y-0 left-0 z-50 w-64 hidden lg:flex flex-col border-r border-white/[0.05]"
        style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(20px)' }}
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/[0.05]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
              <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {groupedNav.map((group) => (
            <div key={group.group} className="space-y-2">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                        isActive 
                          ? 'bg-accent/10 text-accent border border-accent/20' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                      }`}
                    >
                      <item.icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      {item.name}
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.05] space-y-4">
          <a
            href="https://github.com/shreyashrpawar/ilusion_android/releases/download/v1/Ilusion.apk"
            download="Ilusion.apk"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all group"
          >
            <Smartphone className="w-4 h-4 group-hover:text-accent" />
            Android App
            <div className="ml-auto badge badge-accent !py-0.5 !px-1.5 !text-[8px]">New</div>
          </a>
          <div className="flex items-center justify-between px-3 pt-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </aside>

      {/* ═══ Mobile Top Bar ═══ */}
      <header 
        className="fixed top-0 left-0 right-0 h-16 z-40 flex lg:hidden items-center justify-between px-4 border-b border-white/[0.05]"
        style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(20px)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-base font-bold">ilusion.io</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      {/* ═══ Main Workspace ═══ */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64 pt-16 lg:pt-0">
        <div className="flex-1 p-4 lg:p-10 w-full max-w-7xl mx-auto">
          {/* Breadcrumbs / Page Header */}
          <div className="mb-8 hidden lg:block animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">Workspace</Link>
              <span className="opacity-30">/</span>
              <span className="text-foreground">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
            </h1>
          </div>

          <div className="animate-fade-in-up">
            {children}
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Link 
            href="/create"
            className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-2xl shadow-accent/40 text-white"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>

        {/* Bottom Nav — Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 lg:hidden flex items-center justify-around border-t border-white/[0.05] z-40" style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(20px)' }}>
          {[
            { href: '/dashboard/secrets', icon: Shield, label: 'Secrets' },
            { href: '/dashboard/inbox', icon: Inbox, label: 'Inbox' },
            { href: '/dashboard/send', icon: Send, label: 'Send' },
            { href: '/dashboard/api-keys', icon: Key, label: 'API' },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
