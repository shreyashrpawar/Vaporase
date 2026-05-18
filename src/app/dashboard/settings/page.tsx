'use client';

import { useState } from 'react';
import { Settings as SettingsIcon, Key } from 'lucide-react';
import SettingsView from '@/components/dashboard-views/SettingsView';
import ApiKeysView from '@/components/dashboard-views/ApiKeysView';
import { useAuth } from '@clerk/nextjs';

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');

  if (!isLoaded || !isSignedIn) return null;

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: SettingsIcon },
    { id: 'api', label: 'API Keys', icon: Key },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Settings & API
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Manage your developer integration and workspace preferences.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar pb-2 mb-2">
        <div className="flex gap-2 p-1.5 bg-[#faf9f5]/80 dark:bg-zinc-900/50 border border-[#e5e3d9] dark:border-zinc-800 rounded-2xl w-full sm:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-1 sm:flex-none cursor-pointer ${
                  isActive
                    ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.01]'
                    : 'text-[#534d5e] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-zinc-900/40'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#534d5e] dark:text-zinc-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in-up mt-6">
        {activeTab === 'profile' && <SettingsView />}
        {activeTab === 'api' && <ApiKeysView />}
      </div>
    </div>
  );
}
