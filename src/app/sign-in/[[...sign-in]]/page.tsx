'use client';

import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Lock, Shield, Key, Eye, Server, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background transition-colors duration-300">
      
      {/* Immersive Left Brand Panel - Visible on Desktop */}
      <div 
        className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative overflow-hidden border-r border-border"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 0% 0%, #1e1b4b 0%, #09090b 100%)'
            : 'radial-gradient(circle at 0% 0%, #eff6ff 0%, #faf9f5 100%)'
        }}
      >
        {/* Dot grid decoration overlay */}
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20 transition-transform group-hover:scale-105">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">
              ilusion<span className="text-accent">.io</span>
            </span>
          </Link>
        </div>

        {/* Center: Interactive Zero-Knowledge Flow Visualizer */}
        <div className="relative z-10 space-y-8 my-auto">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> ZERO-KNOWLEDGE E2EE
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground leading-tight">
              Privacy by design, <br />not by promise.
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Ilusion uses client-side WebCrypto AES-256 encryption. Decryption keys never touch our servers.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="space-y-4 max-w-md p-6 bg-white/[0.02] border border-border rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Key className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-foreground">Sender Browser</p>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-full">Encrypted</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Secret + Hash Key Generated locally</p>
              </div>
            </div>

            <div className="h-6 w-0.5 bg-border ml-4 border-dashed" />

            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <Server className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">Ilusion Cloud Server</p>
                <p className="text-[10px] text-muted-foreground">Receives ONLY ciphertext (Zero-Knowledge)</p>
              </div>
            </div>

            <div className="h-6 w-0.5 bg-border ml-4 border-dashed" />

            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-foreground">Recipient View</p>
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/5 px-2 py-0.5 rounded-full">Decrypted & Purged</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Decrypted locally in browser via Hash</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Trust Footer */}
        <div className="relative z-10 border-t border-border/60 pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">RAM Only Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Open Source Crypto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card container */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center py-12 px-6 relative overflow-hidden bg-background">
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        
        {/* Mobile-only Logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10 group transition-all relative z-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent/10 border border-accent/20">
            <Lock className="w-4.5 h-4.5 text-accent" />
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            ilusion<span className="text-accent">.io</span>
          </span>
        </div>

        {/* Form Wrap */}
        <div className="w-full max-w-md animate-fade-in-up relative z-10">
          <SignIn 
            appearance={{ 
              baseTheme: isDark ? dark : undefined,
              variables: {
                colorPrimary: '#3b82f6',
                colorBackground: isDark ? '#141416' : '#ffffff',
                colorText: isDark ? '#fafafa' : '#1f152e',
                colorInputBackground: isDark ? '#0c0c0e' : '#f5f5ed',
                colorInputText: isDark ? '#ffffff' : '#1f152e',
                borderRadius: '1rem',
              },
              elements: {
                card: `border ${isDark ? 'border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.25)]' : 'border-black/5 shadow-2xl'}`,
                headerTitle: 'text-2xl font-black tracking-tight text-foreground',
                headerSubtitle: 'text-sm text-muted-foreground font-medium',
                formButtonPrimary: 'bg-accent hover:bg-accent-light text-white font-bold h-11 border-none transition-all duration-200 cursor-pointer',
                socialButtonsBlockButton: `${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} text-sm font-semibold h-11 transition-colors cursor-pointer`,
                footerActionLink: 'text-accent hover:text-accent-light hover:underline font-bold',
                dividerLine: isDark ? 'bg-white/10' : 'bg-black/10',
                formFieldLabel: 'text-xs font-bold text-muted-foreground uppercase tracking-wider',
                formFieldInput: 'input h-10.5 text-sm !bg-background focus:ring-2 focus:ring-accent/15 transition-all outline-none',
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
}
