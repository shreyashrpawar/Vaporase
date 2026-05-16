'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import {
  Lock,
  Eye,
  Shield,
  AlertTriangle,
  Download,
  FileText,
  Image as ImageIcon,
  Film,
  Loader2,
  Check,
  ArrowRight,
  Key,
  Copy,
  MessageSquare,
  Zap
} from 'lucide-react';
import { decryptText, hashPassword } from '@/lib/crypto';

function formatBytes(bytes: number) {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  if (type?.startsWith('image/')) return ImageIcon;
  if (type?.startsWith('video/')) return Film;
  return FileText;
}

export default function SecretPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [revealed, setRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [secretData, setSecretData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);

  const revealSecret = async () => {
    setIsLoading(true);
    setError('');

    try {
      let hashedPw = null;
      if (password) {
        hashedPw = await hashPassword(password);
      }

      const res = await fetch(`/api/secrets/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resolvedParams.id,
          passwordHash: hashedPw
        })
      });

      if (res.status === 401) {
        const data = await res.json();
        if (data.requirePassword) {
          setRequirePassword(true);
          setIsLoading(false);
          return;
        } else {
          throw new Error(data.error || 'Incorrect password');
        }
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to read secret');
      }

      // E2E Decryption
      if (data.isE2EE && data.encryptedContent) {
        try {
          // Robustly extract the key from either #key=... or just #...
          let keyFragment = data.dropKey;
          if (!keyFragment && typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash;
            if (hash.startsWith('#key=')) {
              keyFragment = hash.substring(5);
            } else if (hash.startsWith('#')) {
              keyFragment = hash.substring(1);
            }
          }

          if (!keyFragment) throw new Error('Missing decryption key in URL link.');
          data.encryptedContent = await decryptText(data.encryptedContent, keyFragment);
        } catch (decErr: any) {
          throw new Error(decErr.message || 'Decryption failed.');
        }
      }

      setSecretData(data);
      setRevealed(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    if (!secretData?.encryptedContent) return;
    try {
      await navigator.clipboard.writeText(secretData.encryptedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = secretData.encryptedContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const FileIcon = secretData?.fileType ? getFileIcon(secretData.fileType) : FileText;

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-white dark:bg-slate-950">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 dot-grid opacity-[0.4] dark:opacity-[0.2]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20 group-hover:scale-110 transition-transform duration-500">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">End-to-End Encrypted</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[520px] animate-fade-in-up">
          {/* Error State */}
          {error && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-[2rem] blur-xl opacity-50" />
              <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-red-500/20 rounded-[2rem] p-8 sm:p-12 text-center shadow-2xl">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-black mb-4 text-foreground tracking-tight">Secret Unavailable</h2>
                <p className="text-muted-foreground mb-10 leading-relaxed text-lg">{error}</p>
                <Link
                  href="/create"
                  className="w-full h-14 bg-foreground text-background rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Create Your Own
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}

          {/* Pre-reveal State */}
          {!revealed && !error && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/5 rounded-[2.5rem] blur-2xl opacity-50 transition-opacity group-hover:opacity-100" />
              <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 sm:p-12 text-center shadow-2xl overflow-hidden">
                {/* Decorative pulse */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl animate-pulse" />
                  <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center bg-accent/10 border border-accent/20 mx-auto transform hover:rotate-3 transition-transform duration-500">
                    <Shield className="w-12 h-12 text-accent" />
                  </div>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground tracking-tight leading-tight">
                  {requirePassword ? 'Protected Vault' : 'Secure Message'}
                </h2>
                <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                  {requirePassword
                    ? 'Enter the authorization key to access the encrypted payload.'
                    : 'A confidential secret has been shared. Once opened, it will be permanently purged from our infrastructure.'
                  }
                </p>

                {!requirePassword && (
                  <div className="flex flex-col gap-4 mb-10 text-left">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 group/item">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/10 shrink-0 transition-transform group-hover/item:scale-110">
                        <Zap className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Self-Destruct Enabled</p>
                        <p className="text-[11px] text-muted-foreground font-medium">Link will be destroyed immediately after viewing.</p>
                      </div>
                    </div>
                  </div>
                )}

                {requirePassword && (
                  <div className="mb-8 space-y-4">
                    <div className="relative group/input">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2">
                        <Key className="w-5 h-5 text-muted-foreground group-focus-within/input:text-accent transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Vault Password"
                        className="w-full h-16 pl-14 pr-6 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-accent/30 rounded-2xl outline-none text-lg font-medium transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && revealSecret()}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={revealSecret}
                  disabled={isLoading || (requirePassword && !password)}
                  className="group relative w-full h-16 bg-accent text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 overflow-hidden shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {requirePassword ? <Lock className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      <span>{requirePassword ? 'Unlock Vault' : 'Reveal Secret'}</span>
                      <ArrowRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Revealed State */}
          {revealed && secretData && (
            <div className="relative animate-fade-in">
              <div className="absolute -inset-1 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-[2.5rem] blur-2xl opacity-30" />
              <div className="relative bg-white dark:bg-slate-900/90 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl space-y-8">

                <div className="text-center pb-2">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Decryption Successful</h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Permanently Purged</span>
                  </div>
                </div>

                {/* Secret Content */}
                {secretData.encryptedContent && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Decrypted Data</span>
                      <button
                        onClick={copySecret}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:opacity-70 transition-opacity"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy Text'}
                      </button>
                    </div>
                    <div className="group relative">
                      <div className="absolute -inset-0.5 bg-accent/5 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative min-h-[120px] max-h-[400px] overflow-y-auto rounded-2xl p-6 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 font-mono text-sm sm:text-base leading-relaxed break-all whitespace-pre-wrap text-foreground selection:bg-accent/30">
                        {secretData.encryptedContent}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {secretData.files && secretData.files.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Attached Files</span>
                      <span className="w-4 h-4 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent">{secretData.files.length}</span>
                    </div>
                    <div className="space-y-3">
                      {secretData.files.map((file: any, idx: number) => {
                        const Icon = getFileIcon(file.fileType);
                        return (
                          <div key={idx} className="group/file">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-accent/30 transition-colors">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent/10 shrink-0 group-hover/file:scale-110 transition-transform">
                                <Icon className="w-6 h-6 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{file.fileName || 'Encrypted File'}</p>
                                <p className="text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase">{formatBytes(file.fileSize)}</p>
                              </div>
                              <button
                                onClick={() => handleDownload(file.fileUrl, file.fileName)}
                                className="h-10 px-4 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                              >
                                Download
                              </button>
                            </div>

                            {file.fileType?.startsWith('image/') && (
                              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40">
                                <img
                                  src={file.fileUrl}
                                  alt="Secure Preview"
                                  className="w-full h-auto max-h-[300px] object-contain"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/create"
                    className="flex-1 h-14 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/10"
                  >
                    Start Sharing
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/"
                    className="h-14 px-8 bg-slate-100 dark:bg-white/5 text-foreground rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Trust Footer */}
      <footer className="relative z-10 py-12 px-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-700">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">AES-256 E2EE</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Zero-Logs Architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Auto-Purge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
