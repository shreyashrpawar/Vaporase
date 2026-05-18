'use client';

import SendSecretForm from '@/components/SendSecretForm';
import InboxView from '@/components/dashboard-views/InboxView';
import SecretsView from '@/components/dashboard-views/SecretsView';
import RevealView from '@/components/dashboard-views/RevealView';
import { useAuth } from '@clerk/nextjs';

export default function WorkspacePage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Security Workspace
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Encrypt, share, and manage your ephemeral data in one place.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Create Secret (Span 6) ── */}
        <div className="lg:col-span-6">
          <SendSecretForm />
        </div>

        {/* ── Middle Column: Inbox & Reveal (Span 3) ── */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="h-[280px]">
            <RevealView />
          </div>
          <div className="h-[420px]">
            <InboxView />
          </div>
        </div>

        {/* ── Right Column: Active Secrets (Span 3) ── */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="h-[724px]">
            <SecretsView />
          </div>
        </div>
      </div>
    </div>
  );
}
