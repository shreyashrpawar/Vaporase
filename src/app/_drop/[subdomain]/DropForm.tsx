'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, Loader2, AlertCircle, Shield, Check, Copy } from 'lucide-react';
import { encryptText, generateKey } from '@/lib/crypto';
import { QRCodeSVG } from 'qrcode.react';

export default function DropForm({ profile }: { profile: any }) {
  const [secretText, setSecretText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successLink, setSuccessLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!secretText.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Basic Text Drop for V1
      const secretKey = await generateKey();
      const encryptedContent = await encryptText(secretText, secretKey);

      const res = await fetch('/api/secrets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedContent,
          isE2EE: true,
          expiresInHours: 24, // Standard 24h for inbox drops
          recipientId: profile.userId, // THIS IS THE KEY!
          dropKey: secretKey, // We store this on the server so the recipient can open it
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to drop secret');

      const fullLink = `${window.location.origin}/secret/${data.id}#key=${secretKey}`;
      setSuccessLink(fullLink);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(successLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (successLink) {
    return (
      <div className="noise-bg gradient-bg min-h-screen flex flex-col">
        <main className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg animate-fade-in-up">
            <div className="glass rounded-2xl p-8 glow text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">Secret Dropped!</h2>
              <p className="text-muted-foreground mb-6">
                Your message has been securely deposited in <strong className="text-foreground">{profile.displayName}</strong>'s inbox.
              </p>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 font-mono text-sm text-accent truncate border border-border">
                  {successLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="shrink-0 w-11 h-11 rounded-xl bg-accent hover:bg-accent-light flex items-center justify-center transition-all hover:shadow-lg hover:shadow-accent/20"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>

              {copied && (
                <p className="text-sm text-success font-medium mb-4 animate-fade-in-up">
                  ✓ Link copied to clipboard
                </p>
              )}

              <button
                onClick={() => {
                  setSuccessLink('');
                  setSecretText('');
                }}
                className="text-sm font-medium text-accent hover:text-accent-light transition-colors"
              >
                Drop another secret →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="noise-bg gradient-bg min-h-screen flex flex-col">
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
            <Lock className="w-4.5 h-4.5 text-accent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10 text-xs font-medium text-accent mb-4 uppercase tracking-wider">
              Secure Drop
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-foreground">
              Drop a secret for {profile.displayName}
            </h1>
            <p className="text-muted-foreground">
              Your message will be E2E encrypted and delivered directly to their private inbox.
            </p>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Secret Message</label>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder="Type your sensitive message here..."
                rows={5}
                className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all resize-none font-mono"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-destructive animate-fade-in-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || !secretText.trim()}
              className="w-full py-4 rounded-2xl bg-accent hover:bg-accent-light text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-accent/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Encrypt & Drop
                </>
              )}
            </button>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              🔒 Encrypted with AES-GCM. {profile.displayName} will be the only one who can decrypt it.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
