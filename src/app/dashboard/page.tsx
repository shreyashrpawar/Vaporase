'use client';

import { useState } from 'react';
import SendSecretForm from '@/components/SendSecretForm';
import InboxView from '@/components/dashboard-views/InboxView';
import SecretsView from '@/components/dashboard-views/SecretsView';
import RevealView from '@/components/dashboard-views/RevealView';
import { useAuth } from '@clerk/nextjs';
import { Pen, Eye, Shield, Inbox, Send, KeyRound } from 'lucide-react';

type MobileTab = 'compose' | 'reveal' | 'secrets';

const mobileTabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: 'compose', label: 'Compose', icon: Send },
  { id: 'reveal', label: 'Reveal', icon: KeyRound },
  { id: 'secrets', label: 'Secrets', icon: Shield },
];

export default function WorkspacePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<MobileTab>('compose');

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* ── Mobile Skeleton ── */}
        <div className="lg:hidden flex-1 p-5 space-y-5 bg-[var(--bg-primary)]">
          <div className="h-12 w-full bg-[var(--border-default)] rounded-2xl animate-pulse" />
          <div className="h-48 w-full bg-[var(--border-default)] rounded-2xl animate-pulse" />
          <div className="h-12 w-full bg-[var(--border-default)] rounded-2xl animate-pulse" />
          <div className="h-12 w-3/4 bg-[var(--border-default)] rounded-2xl animate-pulse" />
        </div>

        {/* ── Desktop Skeleton ── */}
        <div className="hidden lg:flex flex-1 h-full overflow-hidden">
          <div className="w-[380px] xl:w-[400px] shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 space-y-5">
            <div className="h-4 w-28 bg-[var(--border-default)] rounded-full animate-pulse" />
            <div className="h-12 w-full bg-[var(--border-default)] rounded-xl animate-pulse" />
            <div className="h-36 w-full bg-[var(--border-default)] rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-[var(--border-default)] rounded-xl animate-pulse" />
          </div>
          <div className="flex-1 p-6 space-y-6">
            <div className="h-4 w-24 bg-[var(--border-default)] rounded-full animate-pulse" />
            <div className="h-28 w-full bg-[var(--border-default)] rounded-2xl animate-pulse" />
            <div className="h-4 w-20 bg-[var(--border-default)] rounded-full animate-pulse" />
            <div className="h-44 w-full bg-[var(--border-default)] rounded-2xl animate-pulse" />
          </div>
          <div className="w-[380px] xl:w-[400px] shrink-0 border-l border-[var(--border-default)] p-6 space-y-4">
            <div className="h-4 w-28 bg-[var(--border-default)] rounded-full animate-pulse" />
            <div className="h-24 w-full bg-[var(--border-default)] rounded-xl animate-pulse" />
            <div className="h-24 w-full bg-[var(--border-default)] rounded-xl animate-pulse" />
            <div className="h-24 w-full bg-[var(--border-default)] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Mobile Layout (hidden on lg+) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'compose' && (
            <div className="px-4 py-5 pb-24">
              <SendSecretForm />
            </div>
          )}
          {activeTab === 'reveal' && (
            <div className="px-4 py-5 pb-24 space-y-5">
              {/* Reveal Card */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-default)]">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <KeyRound className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Reveal Secret</span>
                </div>
                <div className="p-4">
                  <RevealView />
                </div>
              </div>

              {/* Inbox Card */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-default)]">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Inbox className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Inbox Drops</span>
                </div>
                <div className="p-4">
                  <InboxView />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'secrets' && (
            <div className="px-4 py-5 pb-24">
              <SecretsView />
            </div>
          )}
        </div>

        {/* ── Fixed Bottom Tab Bar ── */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl border-t safe-area-bottom transition-colors"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--dashboard-nav-bg) 92%, transparent)',
            borderColor: 'var(--dashboard-nav-border)',
          }}
        >
          <div className="flex items-stretch">
            {mobileTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-all ${
                  activeTab === id
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-tertiary)]'
                }`}
              >
                {activeTab === id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--accent-primary)]" />
                )}
                <Icon className={`w-5 h-5 transition-transform ${activeTab === id ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-bold tracking-wide">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Desktop 3-Column Layout (hidden below lg) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 h-full overflow-hidden">

        {/* ── Left Column: Compose ── */}
        <div className="w-[380px] xl:w-[400px] shrink-0 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="h-10 shrink-0 flex items-center gap-2.5 px-5 border-b border-[var(--border-default)]">
            <div className="w-5 h-5 rounded-md bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <Pen className="w-2.5 h-2.5 text-[var(--accent-primary)]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Compose</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-3">
            <SendSecretForm />
          </div>
        </div>

        {/* ── Middle Column: Reveal + Inbox ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Reveal Section */}
          <div className="shrink-0 border-b border-[var(--border-default)]">
            <div className="h-10 flex items-center gap-2.5 px-5">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Eye className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Reveal Secret</span>
            </div>
            <div className="px-5 pb-4">
              <RevealView />
            </div>
          </div>

          {/* Inbox Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="h-10 shrink-0 flex items-center gap-2.5 px-5">
              <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Inbox className="w-2.5 h-2.5 text-blue-500 dark:text-blue-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Inbox Drops</span>
            </div>
            <div className="px-5 flex-1 overflow-y-auto pb-6">
              <InboxView />
            </div>
          </div>
        </div>

        {/* ── Right Column: Active Secrets ── */}
        <div className="w-[380px] xl:w-[400px] shrink-0 flex flex-col border-l border-[var(--border-default)]">
          <div className="h-10 shrink-0 flex items-center gap-2.5 px-5 border-b border-[var(--border-default)]">
            <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Active Secrets</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2">
            <SecretsView />
          </div>
        </div>

      </div>
    </div>
  );
}
