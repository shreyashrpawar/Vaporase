'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { 
  LayoutDashboard, 
  Key, 
  Shield, 
  Plus, 
  Menu, 
  X, 
  Lock,
  ExternalLink,
  BookOpen,
  Inbox,
  Settings,
  Send
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
    { name: 'Send Secret', href: '/dashboard/send', icon: Send },
    { name: 'My Secrets', href: '/dashboard/secrets', icon: Shield },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 border-r border-white/[0.06] bg-[#0c0c0f]">
        <div className="px-6 py-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/10">
              <Lock className="w-5 h-5 text-accent-light" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              ilusion<span className="text-accent">.io</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-accent/10 text-accent-light border border-accent/15 shadow-sm shadow-accent/5' 
                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-accent-light' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-accent-light uppercase tracking-wider mb-1">Developer</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
              Programmatic access with our powerful API.
            </p>
            <Link 
              href="/dashboard/api-keys" 
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[11px] font-bold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              API Docs
            </Link>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <UserButton />
              <div className="text-xs">
                <p className="font-bold text-zinc-200">My Account</p>
                <p className="text-zinc-500">Premium Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-[#0c0c0f]/90 backdrop-blur-lg border-b border-white/[0.06] z-50 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold text-zinc-100">ilusion.io</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08]">
          {isMobileMenuOpen ? <X className="w-5 h-5 text-zinc-300" /> : <Menu className="w-5 h-5 text-zinc-300" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#09090b] pt-20 px-6 animate-fade-in">
          <nav className="space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${
                  pathname === item.href ? 'bg-accent text-white' : 'bg-white/[0.03] text-zinc-300 border border-white/[0.06]'
                }`}
              >
                <item.icon className="w-6 h-6" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-screen flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
