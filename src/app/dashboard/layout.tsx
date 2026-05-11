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
  BookOpen
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
    { name: 'My Secrets', href: '/dashboard/secrets', icon: Shield },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  ];

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 border-r border-slate-200 bg-white">
        <div className="px-6 py-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              ilusion<span className="text-accent">.io</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-accent/5 text-accent border border-accent/10 shadow-sm shadow-accent/5' 
                    : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 ${isActive ? 'text-accent' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-indigo-50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Developer</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Programmatic access with our powerful API.
            </p>
            <Link 
              href="/dashboard/api-keys" 
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-white border border-accent/10 rounded-lg text-[11px] font-bold text-accent hover:shadow-md transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              API Docs
            </Link>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <UserButton />
              <div className="text-xs">
                <p className="font-bold text-foreground">My Account</p>
                <p className="text-muted-foreground">Premium Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold">ilusion.io</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-slate-50">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20 px-6 animate-fade-in">
          <nav className="space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold ${
                  pathname === item.href ? 'bg-accent text-white' : 'bg-slate-50 text-foreground'
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
