'use client';

import { useState } from 'react';
import SendSecretForm from '@/components/SendSecretForm';
import InboxView from '@/components/dashboard-views/InboxView';
import SecretsView from '@/components/dashboard-views/SecretsView';
import RevealView from '@/components/dashboard-views/RevealView';
import { useAuth } from '@clerk/nextjs';
import { Pen, Eye, Inbox, Shield } from 'lucide-react';

type MobileTab = 'compose' | 'reveal' | 'secrets';

const mobileTabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: 'compose', label: 'Compose', icon: Pen },
  { id: 'reveal', label: 'Reveal', icon: Eye },
  { id: 'secrets', label: 'Secrets', icon: Shield },
];

export default function WorkspacePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<MobileTab>('compose');

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">

      {/* ── Mobile Tab Bar (hidden on lg+) ── */}
      <div className="lg:hidden shrink-0 flex items-center border-b border-[var(--border-default)] dark:border-white/5 bg-[var(--bg-secondary)] dark:bg-zinc-900/60">
        {mobileTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === id
                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] dark:text-zinc-500 border-b-2 border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Mobile Content Panels (hidden on lg+) ── */}
      <div className="lg:hidden flex-1 overflow-y-auto animate-fade-in">
        {activeTab === 'compose' && (
          <div className="px-4 py-4 pb-8">
            <SendSecretForm />
          </div>
        )}
        {activeTab === 'reveal' && (
          <div className="px-4 py-4 pb-8">
            <div className="mb-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] dark:text-zinc-500 mb-4">
                <Eye className="w-3.5 h-3.5" /> Reveal Secret
              </div>
              <RevealView />
            </div>
            <div className="mt-6 border-t border-[var(--border-default)] dark:border-white/5 pt-6">
              <InboxView />
            </div>
          </div>
        )}
        {activeTab === 'secrets' && (
          <div className="px-4 py-4 pb-8">
            <SecretsView />
          </div>
        )}
      </div>

      {/* ── Desktop 3-Column Layout (hidden below lg) ── */}
      <div className="hidden lg:flex flex-1 flex-row h-full divide-x divide-[var(--border-default)] dark:divide-white/5 overflow-hidden animate-fade-in">

        {/* ── Left Column: Compose Secret ── */}
        <div className="w-[390px] xl:w-[420px] shrink-0 flex flex-col bg-[var(--bg-secondary)] dark:bg-transparent">
          <div className="h-14 flex items-center px-6 border-b border-transparent text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] dark:text-zinc-500 gap-2 shrink-0">
            <Pen className="w-3.5 h-3.5" /> Compose Secret
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
            <SendSecretForm />
          </div>
        </div>

        {/* ── Middle Column: Reveal & Inbox ── */}
        <div className="flex-1 flex flex-col bg-[var(--bg-primary)] dark:bg-zinc-900/40 overflow-y-auto">
          <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
            <div className="flex flex-col border-b border-[var(--border-default)] dark:border-white/5 py-6">
              <div className="h-14 flex items-center px-6 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] dark:text-zinc-500 gap-2 shrink-0">
                <Eye className="w-3.5 h-3.5" /> Reveal Secret
              </div>
              <div className="px-6">
                <RevealView />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 py-6">
              <div className="px-6 flex-1 overflow-y-auto pb-6">
                <InboxView />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Active Secrets ── */}
        <div className="w-[390px] xl:w-[420px] shrink-0 flex flex-col bg-[var(--bg-primary)] dark:bg-transparent pt-2">
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <SecretsView />
          </div>
        </div>

      </div>
    </div>
  );
}
