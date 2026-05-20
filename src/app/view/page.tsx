'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, Link as LinkIcon, ArrowLeft, ArrowRight, Shield } from 'lucide-react';

export default function ViewSecretPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'link' | 'alias'>('link');
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');

  const handleReveal = () => {
    if (mode === 'link') {
      const input = url.trim();
      if (!input) return;
      
      if (input.includes('/') || input.includes('localhost') || input.includes('ilusion.io') || input.includes('.')) {
        try {
          let urlString = input;
          if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
            urlString = 'https://' + urlString;
          }
          const parsedUrl = new URL(urlString);
          let path = parsedUrl.pathname + parsedUrl.hash;
          if (path.startsWith('/s/')) {
            path = path.replace('/s/', '/secret/');
          }
          if (path.startsWith('/secret/')) {
            window.location.href = path;
            return;
          }
        } catch (e) {
          console.error('Failed to parse input URL:', e);
        }

        if (input.includes('/secret/') || input.includes('/s/')) {
          let relativePath = input.startsWith('/') ? input : `/${input}`;
          if (relativePath.startsWith('/s/')) {
            relativePath = relativePath.replace('/s/', '/secret/');
          }
          window.location.href = relativePath;
          return;
        }
      }
      
      window.location.href = `/secret/${input}`;
    } else {
      if (!alias) return;
      window.location.href = `/secret/${alias}`;
    }
  };

  return (
    <div className="dot-grid min-h-screen flex flex-col bg-[#faf9f5] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* AEO: SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Ilusion Secret Viewer",
            "operatingSystem": "Web",
            "applicationCategory": "SecurityApplication",
            "description": "Secure utility to decrypt and reveal ephemeral secrets sent via ilusion.io. Data is destroyed immediately after viewing.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />
      
      {/* Navigation Bar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20 transition-all group-hover:scale-105">
            <Lock className="w-4 h-4 text-accent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-extrabold text-[#534d5e] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-accent" />
          Back to Home
        </Link>
      </nav>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Left Column: Brand Hero & Trust Steps */}
        <div className="lg:col-span-5 space-y-8 animate-fade-in text-center lg:text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-accent text-[9px] font-black uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" /> RECIPIENT PORTAL
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
              Decrypt your <span className="text-accent relative inline-block">Secret<span className="absolute bottom-1.5 left-0 w-full h-[6px] bg-accent/15 -z-10 rounded-full"></span></span>
            </h1>
            <p className="text-sm text-[#534d5e] dark:text-zinc-400 max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
              A secure, highly-encrypted portal to safely unlock and view ephemeral files and secret messages sent to you.
            </p>
          </div>

          {/* Secure Step Indicators */}
          <div className="space-y-4 max-w-md mx-auto lg:mx-0 text-left">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/5 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800 transition-all hover:scale-[1.01]">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-accent/25">1</div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Paste Secure Key</h3>
                <p className="text-[11px] text-[#534d5e] dark:text-zinc-400 mt-0.5">Input the complete encrypted URL or custom alias token sent by the author.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/5 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800 transition-all hover:scale-[1.01]">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">2</div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Local Decryption</h3>
                <p className="text-[11px] text-[#534d5e] dark:text-zinc-400 mt-0.5">Decryption triggers securely inside your browser window. Zero trace remains on the server.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/5 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800 transition-all hover:scale-[1.01]">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">3</div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">Auto-Destruct</h3>
                <p className="text-[11px] text-[#534d5e] dark:text-zinc-400 mt-0.5">The secret link decomposes completely immediately after viewing. No third parties can re-access it.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: The Reveal Card & Trust Badges */}
        <div className="lg:col-span-7 w-full max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-md shadow-zinc-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-accent/10" />
            
            <div className="relative z-10 space-y-6">
              {/* Mode Switcher */}
              <div className="relative z-10 flex p-1.5 rounded-2xl bg-[#faf9f5]/80 dark:bg-zinc-900/50 border border-[#e5e3d9] dark:border-zinc-800">
                <button
                  onClick={() => setMode('link')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                    mode === 'link' ? 'bg-accent text-white shadow-md shadow-accent/25' : 'text-[#534d5e] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Secure Link
                </button>
                <button
                  onClick={() => setMode('alias')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                    mode === 'alias' ? 'bg-accent text-white shadow-md shadow-accent/25' : 'text-[#534d5e] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Custom Alias
                </button>
              </div>

              {mode === 'link' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500 ml-1">Secure Link or ID</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://ilusion.io/secret/..."
                    className="w-full bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-4 py-3.5 text-xs text-zinc-900 dark:text-white placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500 ml-1">Alias Name</label>
                  <div className="flex items-center">
                    <div className="px-3 py-3.5 bg-[#f5f5ed] border border-[#e5e3d9] dark:border-zinc-800 border-r-0 rounded-l-xl text-[10px] font-bold text-[#534d5e] dark:text-zinc-400">ilusion.io/s/</div>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="alias-name"
                      className="w-full bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-r-xl px-4 py-3.5 text-xs text-zinc-900 dark:text-white placeholder-[#a5a1ad] dark:placeholder-zinc-650 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm font-bold"
                      onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                    />
                  </div>
                </div>
              )}

              {/* Single View Enforcement Warning */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shrink-0">
                  <Eye className="w-3.5 h-3.5 text-red-500" />
                  <span>Single-View</span>
                </div>
                <p className="text-[11px] text-[#534d5e] dark:text-zinc-400 leading-relaxed font-medium">
                  This secret will be <strong className="text-red-500 font-extrabold">permanently deleted</strong> immediately after decryption.
                </p>
              </div>

              <button
                onClick={handleReveal}
                disabled={mode === 'link' ? !url : !alias}
                className="w-full py-3.5 bg-accent hover:bg-accent-light disabled:opacity-30 disabled:hover:bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-accent/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Reveal Secret Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, title: 'Zero-Trace', desc: 'On-device crypto.' },
              { icon: Eye, title: 'Ephemeral', desc: 'Destructs instantly.' },
              { icon: Lock, title: 'Anonymous', desc: 'No user tracking.' }
            ].map((t) => (
              <div key={t.title} className="text-center p-3.5 rounded-2xl bg-zinc-900/5 dark:bg-zinc-900/40 border border-zinc-250 dark:border-zinc-800 transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-1">
                <t.icon className="w-4 h-4 text-accent mb-0.5" />
                <h3 className="text-[9px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">{t.title}</h3>
                <p className="text-[8px] text-[#534d5e] dark:text-zinc-450 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
