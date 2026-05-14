'use client';

import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';

export default function SignUpPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div 
      className="dot-grid min-h-screen flex flex-col items-center justify-center px-6 py-12" 
      style={{ 
        background: isDark 
          ? 'radial-gradient(circle at 50% 50%, #1a1a1e 0%, #09090b 100%)' 
          : 'var(--bg-primary)' 
      }}
    >
      <Link href="/" className="flex items-center gap-2.5 mb-8 group transition-all">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20">
          <Lock className="w-5 h-5 text-accent" />
        </div>
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          ilusion<span className="text-accent">.io</span>
        </span>
      </Link>

      <div className="w-full max-w-md animate-fade-in-up">
        <SignUp 
          appearance={{ 
            baseTheme: isDark ? dark : undefined,
            variables: {
              colorPrimary: '#6366f1',
              colorBackground: isDark ? '#1c1c21' : '#ffffff',
              colorText: isDark ? '#f0f0f0' : '#0a0a0b',
              colorInputBackground: isDark ? '#131316' : '#f4f5f7',
              colorInputText: isDark ? '#ffffff' : '#0a0a0b',
              borderRadius: '1rem',
            },
            elements: {
              card: `border ${isDark ? 'border-white/10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]' : 'border-black/5 shadow-2xl'}`,
              headerTitle: 'text-2xl font-bold tracking-tight',
              formButtonPrimary: 'bg-accent hover:bg-accent-hover border-none h-11 transition-all',
              socialButtonsBlockButton: `${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} transition-colors`,
              footerActionLink: 'text-accent hover:underline',
              dividerLine: isDark ? 'bg-white/10' : 'bg-black/10',
            }
          }} 
        />
      </div>
    </div>
  );
}
