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
          const keyFragment = data.dropKey || window.location.hash.replace('#key=', '');
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

  const FileIcon = secretData?.fileType ? getFileIcon(secretData.fileType) : FileText;

  return (
    <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
          </span>
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Error State */}
          {error && (
            <div className="card gradient-border p-8 text-center" style={{ boxShadow: 'var(--shadow-glow)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)' }}>
                <AlertTriangle className="w-8 h-8" style={{ color: 'var(--destructive)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Secret Unavailable</h2>
              <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>{error}</p>
              <Link
                href="/create"
                className="btn-primary"
              >
                Create Your Own Secret
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Pre-reveal State */}
          {!revealed && !error && (
            <div className="card gradient-border p-8 text-center glow" style={{ boxShadow: 'var(--shadow-glow)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--accent-subtle)' }}>
                <Shield className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {requirePassword ? 'Password Required' : 'You have a Secret'}
              </h2>
              <p className="mb-8" style={{ color: 'var(--text-tertiary)' }}>
                {requirePassword 
                  ? 'This secret is protected by an additional password.'
                  : 'Someone has shared a confidential message with you.'
                }
                {!requirePassword && <><br /><strong style={{ color: 'var(--text-primary)' }}>It can only be viewed once.</strong></>}
              </p>

              {!requirePassword && (
                <div className="rounded-xl p-4 mb-8 text-left space-y-2.5" style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)' }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--warning)' }}>
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>This secret will be <strong>permanently destroyed</strong> after you view it</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--warning)' }}>
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>The link will become invalid immediately</span>
                  </div>
                </div>
              )}

              {requirePassword && (
                <div className="mb-8 animate-fade-in-up">
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter the secret password"
                      className="input !pl-10 !py-3"
                      onKeyDown={(e) => e.key === 'Enter' && revealSecret()}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={revealSecret}
                disabled={isLoading || (requirePassword && !password)}
                className="btn-primary w-full !py-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    {requirePassword ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {requirePassword ? 'Unlock Secret' : 'Reveal Secret'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Revealed State */}
          {revealed && secretData && (
            <div className="card gradient-border p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)' }}>
                  <Check className="w-8 h-8" style={{ color: 'var(--success)' }} />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Secret Revealed</h2>
                <p className="text-sm font-medium flex items-center justify-center gap-1" style={{ color: 'var(--destructive)' }}>
                  <AlertTriangle className="w-3 h-3" />
                  This secret has been permanently destroyed
                </p>
              </div>

              {/* Secret Text */}
              {secretData.encryptedContent && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Secret Message</label>
                    <button
                      onClick={copySecret}
                      className="flex items-center gap-1 text-xs font-medium transition-colors"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="rounded-xl px-4 py-3 font-mono text-sm whitespace-pre-wrap break-all" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                    {secretData.encryptedContent}
                  </div>
                </div>
              )}

              {/* File Downloads */}
              {secretData.files && secretData.files.length > 0 && (
                <div className="space-y-4">
                  <label className="text-sm font-semibold block" style={{ color: 'var(--text-primary)' }}>
                    Attached Files ({secretData.files.length})
                  </label>
                  <div className="space-y-3">
                    {secretData.files.map((file: any, idx: number) => {
                      const Icon = getFileIcon(file.fileType);
                      return (
                        <div key={idx} className="space-y-3">
                          <div className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)' }}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-subtle)' }}>
                              <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {file.fileName || 'File'}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {formatBytes(file.fileSize)}
                              </p>
                            </div>
                            <a
                              href={file.fileUrl}
                              download={file.fileName}
                              className="btn-primary !px-4 !py-2 !text-xs !gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          </div>
                          
                          {/* Preview for images */}
                          {file.fileType?.startsWith('image/') && (
                            <div className="rounded-xl overflow-hidden mt-2" style={{ border: '1px solid var(--border-default)' }}>
                              <img
                                src={file.fileUrl}
                                alt={`Preview of ${file.fileName}`}
                                className="w-full h-auto max-h-96 object-contain"
                                style={{ background: 'var(--bg-inset)' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                    ⏳ Download links expire in 15 minutes
                  </p>
                </div>
              )}

              {/* Sender Info (for dropped secrets) */}
              {secretData.recipientId && (
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {secretData.sender ? (
                    <>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
                        Sent by <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{secretData.sender.displayName}</span>
                      </p>
                      <Link
                        href={`/${secretData.sender.subdomain}`}
                        className="btn-primary w-full !py-4 mb-6"
                      >
                        <MessageSquare className="w-4 h-4" />
                        REPLY SECURELY
                      </Link>
                    </>
                  ) : (
                    <p className="text-sm text-center italic mb-4" style={{ color: 'var(--text-tertiary)' }}>
                      Sent by <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Anonymous</span>
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  href="/create"
                  className="btn-primary flex-1 !py-3.5"
                >
                  Create Your Own Secret
                </Link>
                <Link
                  href="/"
                  className="btn-secondary flex-1 !py-3.5"
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
