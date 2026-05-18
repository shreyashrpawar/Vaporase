'use client';

import SendSecretForm from '@/components/SendSecretForm';
import InboxView from '@/components/dashboard-views/InboxView';
import SecretsView from '@/components/dashboard-views/SecretsView';
import RevealView from '@/components/dashboard-views/RevealView';
import { useAuth } from '@clerk/nextjs';
import { Pen, Eye, Inbox } from 'lucide-react';

export default function WorkspacePage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/5 animate-fade-in">
      
      {/* ── Left Column: Compose Secret ── */}
      <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0 flex flex-col bg-white dark:bg-transparent">
        <div className="h-14 flex items-center px-6 border-b border-transparent text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500 gap-2 shrink-0">
          <Pen className="w-3.5 h-3.5" /> Compose Secret
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          <SendSecretForm />
        </div>
      </div>

      {/* ── Middle Column: Reveal & Inbox ── */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-zinc-900/40">
        <div className="flex flex-col border-b border-slate-200 dark:border-white/5 pb-6 pt-2 lg:pt-0">
          <div className="h-14 flex items-center px-6 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500 gap-2 shrink-0">
            <Eye className="w-3.5 h-3.5" /> Reveal Secret
          </div>
          <div className="px-6">
            <RevealView />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 pt-2 lg:pt-0">
          <div className="h-14 flex items-center px-6 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-500 gap-2 shrink-0">
            <Inbox className="w-3.5 h-3.5" /> Secure Inbox
          </div>
          <div className="px-6 flex-1 overflow-y-auto pb-6">
            <InboxView />
          </div>
        </div>
      </div>

      {/* ── Right Column: Active Secrets ── */}
      <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0 flex flex-col bg-white dark:bg-transparent pt-2 lg:pt-0">
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <SecretsView />
        </div>
      </div>
      
    </div>
  );
}
