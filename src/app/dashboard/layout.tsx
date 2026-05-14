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
} from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reveal', href: '/view', icon: Eye },
  { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
  { name: 'Send', href: '/dashboard/send', icon: Send },
  { name: 'Secrets', href: '/dashboard/secrets', icon: Shield },
  { name: 'API', href: '/dashboard/api-keys', icon: Key },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded } = useAuth();

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ═══ Top Bar ═══ */}
      <header
        className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-5 lg:pl-[80px]"
        style={{
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-default)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
              <Lock className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/" className="hover:underline" style={{ color: 'var(--text-tertiary)' }}>ilusion.io</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {navItems.find(item => pathname === item.href)?.name || 'Dashboard'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="btn-primary !py-2 !px-4 !text-xs !rounded-lg !gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Secret</span>
          </Link>
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      {/* ═══ Icon Rail — Desktop ═══ */}
      <aside className="icon-rail fixed top-14 bottom-0 left-0 z-30 hidden lg:flex">
        {/* Logo */}
        <Link
          href="/"
          className="rail-item mb-4"
          style={{ width: 40, height: 40 }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}
          >
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
        </Link>

        {/* Divider */}
        <div className="w-6 h-px mb-2" style={{ background: 'var(--border-default)' }} />

        {/* Nav Items */}
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rail-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="tooltip">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* ═══ Bottom Tab Bar — Mobile ═══ */}
      <div className="bottom-bar lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`bottom-bar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* ═══ Main Content ═══ */}
      <main className="pt-14 lg:pl-16 pb-20 lg:pb-0 min-h-screen">
        <div className="p-5 lg:p-8 max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
