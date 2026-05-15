'use client';

import { useState } from 'react';
import { Search, User, Send, Loader2, AlertCircle } from 'lucide-react';
import SendSecretForm from '@/components/SendSecretForm';

export default function DirectSendPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Create Secret</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Generate a secure, self-destructing link or drop into an inbox.</p>
      </div>

      <div className="animate-fade-in-up">
        <SendSecretForm />
      </div>
    </div>
  );
}
