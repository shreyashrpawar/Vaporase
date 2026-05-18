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
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-10 lg:py-14 space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="space-y-1.5 px-1">
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Settings & API
          </h1>
          <p className="text-xs text-[#534d5e] dark:text-zinc-400 font-medium">
            Manage your developer integration and secure workspace preferences.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar pb-1">
          <div className="flex gap-2 p-1.5 bg-[#faf9f5]/80 dark:bg-zinc-900/50 border border-[#e5e3d9] dark:border-zinc-800 rounded-2xl w-full sm:w-auto shadow-sm">
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
        <div className="animate-fade-in-up">
          {activeTab === 'profile' && <SettingsView />}
          {activeTab === 'api' && <ApiKeysView />}
        </div>
      </div>
    </div>
  );
}
