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
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

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

  const revealSecret = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/secrets/read?id=${resolvedParams.id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to read secret');
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

  const FileIcon = secretData?.fileType ? getFileIcon(secretData.fileType) : FileText;

  return (
    <div className="noise-bg gradient-bg min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <Lock className="w-4 h-4 text-accent-light" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ilusion<span className="text-accent-light">.io</span>
          </span>
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Error State */}
          {error && (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Secret Unavailable</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link
                href="/create"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-all"
              >
                Create Your Own Secret
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Pre-reveal State */}
          {!revealed && !error && (
            <div className="glass rounded-2xl p-8 text-center glow">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 animate-pulse-ring">
                <Shield className="w-8 h-8 text-accent-light" />
              </div>

              <h2 className="text-2xl font-bold mb-2">You have a Secret</h2>
              <p className="text-muted-foreground mb-8">
                Someone has shared a confidential message with you.
                <br />
                <strong className="text-foreground">It can only be viewed once.</strong>
              </p>

              <div className="glass rounded-xl p-4 mb-8 text-left space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>This secret will be <strong className="text-foreground">permanently destroyed</strong> after you view it</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>The link will become invalid immediately</span>
                </div>
              </div>

              <button
                onClick={revealSecret}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Reveal Secret
                  </>
                )}
              </button>
            </div>
          )}

          {/* Revealed State */}
          {revealed && secretData && (
            <div className="glass rounded-2xl p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Secret Revealed</h2>
                <p className="text-sm text-destructive flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  This secret has been permanently destroyed
                </p>
              </div>

              {/* Secret Text */}
              {secretData.encryptedContent && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Secret Message</label>
                    <button
                      onClick={copySecret}
                      className="flex items-center gap-1 text-xs text-accent-light hover:text-accent transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="bg-background/60 border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground whitespace-pre-wrap break-all">
                    {secretData.encryptedContent}
                  </div>
                </div>
              )}

              {/* File Download */}
              {secretData.fileUrl && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Attached File</label>
                  <div className="flex items-center gap-4 bg-background/60 border border-border rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <FileIcon className="w-5 h-5 text-accent-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {secretData.fileName || 'File'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(secretData.fileSize)}
                      </p>
                    </div>
                    <a
                      href={secretData.fileUrl}
                      download={secretData.fileName}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-sm font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⏳ Download link expires in 15 minutes
                  </p>
                </div>
              )}

              {/* Preview for images */}
              {secretData.fileUrl && secretData.fileType?.startsWith('image/') && (
                <div className="rounded-xl overflow-hidden border border-border">
                  <img
                    src={secretData.fileUrl}
                    alt="Secret image"
                    className="w-full h-auto max-h-96 object-contain bg-background/60"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  href="/create"
                  className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-all text-center text-sm"
                >
                  Create Your Own Secret
                </Link>
                <Link
                  href="/"
                  className="flex-1 py-3 rounded-xl glass hover:bg-muted/80 text-foreground font-medium transition-all text-center text-sm"
                >
                  Go Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
