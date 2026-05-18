'use client';

import { useState } from 'react';
import { Plus, Inbox as InboxIcon, Shield, Eye } from 'lucide-react';
import SendSecretForm from '@/components/SendSecretForm';
import InboxView from '@/components/dashboard-views/InboxView';
import SecretsView from '@/components/dashboard-views/SecretsView';
import RevealView from '@/components/dashboard-views/RevealView';
import { useAuth } from '@clerk/nextjs';

export default function WorkspacePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'inbox' | 'secrets' | 'reveal'>('create');

  if (!isLoaded || !isSignedIn) return null;

  const tabs = [
    { id: 'create', label: 'Create Secret', icon: Plus },
    { id: 'inbox', label: 'Secure Inbox', icon: InboxIcon },
    { id: 'secrets', label: 'My Secrets', icon: Shield },
    { id: 'reveal', label: 'Reveal', icon: Eye },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Security Workspace
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Encrypt, share, and manage your ephemeral data in one place.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar pb-2 mb-2">
        <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-full sm:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  isActive
                    ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up mt-6">
        {activeTab === 'create' && (
          <div className="max-w-3xl">
            <SendSecretForm />
          </div>
        )}
        {activeTab === 'inbox' && <InboxView />}
        {activeTab === 'secrets' && <SecretsView />}
        {activeTab === 'reveal' && <RevealView />}
      </div>
    </div>
  );
}
