'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock, ArrowLeft, Terminal, Shield, Key, Eye, HelpCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
}

interface SidebarGroup {
  groupName: string;
  items: SidebarItem[];
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationGroups: SidebarGroup[] = [
    {
      groupName: 'Getting Started',
      items: [
        { title: 'Quick Start Guide', href: '/docs/quickstart', icon: HelpCircle },
        { title: 'Developer API', href: '/docs/api', icon: Terminal },
      ],
    },
    {
      groupName: 'Security & Tech',
      items: [
        { title: 'E2EE Cryptography', href: '/docs/zero-knowledge-e2ee', icon: Shield },
      ],
    },
    {
      groupName: 'B2B & Premium',
      items: [
        { title: 'Custom Aliases', href: '/docs/custom-aliases', icon: Key },
        { title: 'Secure Inbox Drops', href: '/docs/inbox-drops', icon: Eye },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href;

  const NavigationList = () => (
    <div className="space-y-8">
      {navigationGroups.map((group) => (
        <div key={group.groupName} className="space-y-3">
          <h4 className="text-xs font-black tracking-wider text-muted-foreground uppercase px-3">
            {group.groupName}
          </h4>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'bg-accent/10 text-accent border border-accent/15'
                        : 'text-[#534d5e] dark:text-[#a5a1ad] hover:text-foreground hover:bg-[#surface-overlay] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="dot-grid min-h-screen flex flex-col transition-colors duration-300" style={{ background: 'var(--bg-primary)' }}>
      {/* ═══ Header/Navbar ═══ */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8.5 h-8.5 rounded-lg flex items-center justify-center bg-accent/10 border border-accent/20 transition-transform group-hover:scale-105">
                <Lock className="w-4.5 h-4.5 text-accent" />
              </div>
              <span className="text-base font-bold text-foreground">
                ilusion<span className="text-accent">.io</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
              Docs & Guides
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              href="/" 
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Link>
            
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Body Layout ═══ */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
          <NavigationList />
        </aside>

        {/* Mobile Navigation Drawer overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            
            {/* Drawer */}
            <div className="relative flex flex-col w-80 max-w-[80vw] h-full bg-background border-r border-border p-6 shadow-2xl animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-black uppercase tracking-wider text-accent">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md text-muted-foreground hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto">
                <NavigationList />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="lg:col-span-9 min-w-0">
          <div className="max-w-3xl">
            {children}
          </div>
        </main>
      </div>

      {/* ═══ Footer ═══ */}
      <footer className="mt-auto border-t border-border/60 py-8 bg-background/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>ilusion.io — Zero-Knowledge Secure Sharing</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-foreground transition-colors font-semibold">Home</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors font-semibold">Pricing</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors font-semibold">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
