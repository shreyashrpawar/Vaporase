'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Upload,
  X,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Film,
  Timer,
  Shield,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Settings,
  Clock,
  Zap,
  ArrowRight,
  Inbox
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { generateKey, encryptText, hashPassword, deriveKeyFromPassword } from '@/lib/crypto';
import { nanoid } from 'nanoid';
import { saveLocalSecret, getLocalSecrets, LocalSecret, updateLocalSecret, removeLocalSecret } from '@/lib/local-history';

const EXPIRY_OPTIONS = [
  { label: '5 min', value: 5 / 60 },
  { label: '30 min', value: 0.5 },
  { label: '1 hour', value: 1 },
  { label: '4 hours', value: 4 },
  { label: '12 hours', value: 12 },
  { label: '1 day', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
];

const MAX_FILE_SIZE_GUEST = 50 * 1024 * 1024;
const MAX_FILE_SIZE_PRO = 100 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Film;
  return FileText;
}

function RevealPanel() {
  const [revealId, setRevealId] = useState('');
  const router = useRouter();

  const handleReveal = () => {
    const id = revealId.trim();
    if (!id) return;
    router.push(`/secret/${id}`);
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/10 to-accent/10 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-5 bg-white dark:bg-slate-900/60 border border-border/50 dark:border-white/[0.07] rounded-2xl">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Reveal a Secret</p>
            <p className="text-[10px] text-muted-foreground">Enter ID or alias to decrypt</p>
          </div>
        </div>
        <div className="flex flex-1 gap-2">
          <input
            value={revealId}
            onChange={e => setRevealId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReveal()}
            placeholder="Secret ID or custom alias..."
            className="flex-1 bg-slate-50 dark:bg-black/20 border border-border/50 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-foreground placeholder:text-muted-foreground/50 focus:border-accent/50 outline-none transition-all"
          />
          <button
            onClick={handleReveal}
            disabled={!revealId.trim()}
            className="px-5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-xl text-xs font-bold transition-all disabled:opacity-30 whitespace-nowrap"
          >
            Open →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateSecretPage() {
  const { isSignedIn } = useAuth();
  const [secretText, setSecretText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [expiryHours, setExpiryHours] = useState(5 / 60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [password, setPassword] = useState('');
  const [allowedIp, setAllowedIp] = useState('');
  const [alias, setAlias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [burnOnRead, setBurnOnRead] = useState(true);
  const [localHistory, setLocalHistory] = useState<LocalSecret[]>([]);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('pro');
  const [contentType, setContentType] = useState<'text' | 'file'>('text');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isSignedIn, router]);

  // Load initial local history on mount
  useEffect(() => {
    setLocalHistory(getLocalSecrets());
  }, []);

  // Derived: total size of all attached files
  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);

  // Sync Local History Statuses
  useEffect(() => {
    if (localHistory.length === 0) return;

    const syncStatus = async () => {
      const current = getLocalSecrets();
      let hasChanges = false;

      for (const secret of current) {
        if (secret.status === 'active' && (!secret.lastCheckedAt || Date.now() - secret.lastCheckedAt > 30000)) {
          try {
            const res = await fetch(`/api/secrets/status?id=${secret.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.status !== secret.status || data.viewCount !== secret.viewCount) {
                updateLocalSecret(secret.id, { status: data.status, viewCount: data.viewCount });
                hasChanges = true;
              }
            } else if (res.status === 404) {
              updateLocalSecret(secret.id, { status: 'burned' });
              hasChanges = true;
            }
          } catch (err) {
            console.error('Failed to sync secret status:', err);
          }
        }
      }

      if (hasChanges) {
        setLocalHistory(getLocalSecrets());
      }
    };

    const timer = setTimeout(syncStatus, 500);
    return () => clearTimeout(timer);
  }, [localHistory]);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          // We still fetch, but we force 'pro' for the UI
          setUserPlan('pro');
        })
        .catch(err => console.error('Error fetching profile:', err));
    } else {
      setUserPlan('pro'); // Even for guests
    }
  }, [isSignedIn]);

  const maxTotalSize = userPlan === 'pro' ? MAX_FILE_SIZE_PRO : MAX_FILE_SIZE_GUEST;

  const addFiles = (incoming: File[]) => {
    const combined = [...files, ...incoming];
    const newTotal = combined.reduce((acc, f) => acc + f.size, 0);
    if (newTotal > maxTotalSize) {
      setError(`Total file size exceeds the ${formatBytes(maxTotalSize)} limit.`);
      return;
    }
    setFiles(combined);
    setContentType('file');
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setContentType('text');
      return next;
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) addFiles(droppedFiles);
    },
    [files, maxTotalSize]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) addFiles(selected);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!secretText && files.length === 0) {
      setError('Please enter a secret message or attach at least one file.');
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload all files and collect their keys
      const uploadedFiles: { fileKey: string; fileName: string; fileSize: number; fileType: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(Math.round((i / files.length) * 60) + 5);

        const actualFileType = file.type || 'application/octet-stream';

        const presignRes = await fetch('/api/secrets/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: actualFileType,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error || 'Failed to get upload URL');
        }

        const { url, fileKey: key } = await presignRes.json();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', actualFileType);
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error('Network error during upload.'));
          xhr.send(file);
        });

        uploadedFiles.push({ fileKey: key, fileName: file.name, fileSize: file.size, fileType: actualFileType });
      }
      setUploadProgress(70);

      // Use first file's metadata as primary (API schema compatibility)
      const fileKey = uploadedFiles[0]?.fileKey || null;
      const fileName = uploadedFiles[0]?.fileName || null;
      const fileSize = uploadedFiles[0]?.fileSize || null;
      const fileType = uploadedFiles[0]?.fileType || null;

      // 1. Determine the ID/Salt
      // Use custom alias if provided, otherwise generate a random ID on client 
      // so we have the salt before encryption.
      const customId = (alias && userPlan === 'pro') ? alias : nanoid(8);
      const salt = customId;

      // 2. Encryption Strategy
      let encryptionKey: string;
      let includeKeyInHash = false;

      if (password) {
        // If password is provided, derive key from it (Zero-Knowledge)
        // This makes the link speakable over a call.
        encryptionKey = await deriveKeyFromPassword(password, salt);
        includeKeyInHash = false;
      } else {
        // Default: Random key in the URL hash
        encryptionKey = await generateKey();
        includeKeyInHash = true;
      }

      const finalEncryptedContent = await encryptText(secretText, encryptionKey);
      const isE2EE = true;

      // Hash Password for server-side authorization
      let finalPasswordHash = null;
      if (password) {
        finalPasswordHash = await hashPassword(password);
      }

      const createRes = await fetch('/api/secrets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customId,
          encryptedContent: finalEncryptedContent,
          fileKey,
          fileName,
          fileSize,
          fileType,
          expiresInHours: expiryHours,
          passwordHash: finalPasswordHash,
          allowedIp: (allowedIp && userPlan === 'pro') ? allowedIp : null,
          alias: (alias && userPlan === 'pro') ? alias : null,
          burnOnRead,
          isE2EE,
          files: uploadedFiles,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to create secret');
      }

      const { id } = await createRes.json();
      setUploadProgress(100);

      // Generate the link
      const linkBase = `${window.location.origin}/s/${id}`;
      const finalLink = includeKeyInHash ? `${linkBase}#${encryptionKey}` : linkBase;
      setGeneratedLink(finalLink);

      // Save to local history
      const label = files.length > 0
        ? `${files.length} file(s): ${files.map(f => f.name).join(', ').slice(0, 40)}`
        : secretText.slice(0, 30) + (secretText.length > 30 ? '...' : '');
      saveLocalSecret({
        id,
        link: finalLink,
        createdAt: Date.now(),
        expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
        label,
      });
      setLocalHistory(getLocalSecrets());
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setSecretText('');
    setFiles([]);
    setExpiryHours(5 / 60);
    setBurnOnRead(true);
    setPassword('');
    setAllowedIp('');
    setGeneratedLink('');
    setContentType('text');
    setError('');
    setCopied(false);
    setUploadProgress(0);
  };
  return (
    <div className="dot-grid min-h-screen flex flex-col items-center" style={{ background: 'var(--bg-primary)' }}>
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: 'var(--mesh-1)' }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: 'var(--mesh-2)' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(20px)', background: 'rgba(var(--bg-primary-rgb, 255,255,255), 0.8)' }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
              <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-xs font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>Pricing</Link>
            <Link href="/docs/api" className="text-xs font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>API</Link>
            <ThemeToggle />
            {isSignedIn ? (
              <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--accent-muted)' }}>
                Dashboard <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <Link href="/sign-up" className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90" style={{ background: 'var(--accent-primary)' }}>Get Free Inbox</Link>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full max-w-5xl relative z-10 px-4 sm:px-6 pt-28 pb-10">
        {!generatedLink ? (
          <div className="space-y-6 animate-fade-in-up">

            {/* Hero */}
            <div className="text-center space-y-3 mb-8">
              <div className="badge badge-accent mx-auto mb-1">
                <Sparkles className="w-3 h-3" /> Community Pro — Free Beta
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                Share anything. <span className="text-gradient">Secretly.</span>
              </h1>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                AES-256 client-side encryption. Self-destructs after reading. Zero knowledge — we never see your data.
              </p>
              {/* Trust strip */}
              <div className="flex items-center justify-center gap-6 pt-1">
                {[['Shield', 'Zero-logs'], ['Lock', 'AES-256'], ['Timer', 'Auto-burn'], ['Eye', 'E2EE']].map(([, label]) => (
                  <span key={label} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                ))}
              </div>
            </div>

            {/* Composer Card */}
            <div className="card gradient-border overflow-hidden" style={{ padding: 0 }}>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Secure Composer</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: 'var(--accent-primary)' }}>
                  <Shield className="w-3 h-3" /> AES-256 GCM
                </div>
              </div>

              {/* Main Input Area */}
              <div
                className={`relative transition-all duration-500 ${isDragging ? 'bg-accent/5' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <textarea
                  value={secretText}
                  onChange={(e) => setSecretText(e.target.value)}
                  placeholder="Type or paste your confidential message here..."
                  className="w-full min-h-[250px] sm:min-h-[300px] bg-transparent p-6 sm:p-10 text-lg sm:text-xl font-medium text-zinc-900 dark:text-foreground placeholder:text-gray-300 dark:placeholder:text-muted-foreground/50 border-none focus:ring-0 resize-none custom-scrollbar"
                />

                {/* Attachment Overlay if files exist */}
                {files.length > 0 && (
                  <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {files.map((f, i) => {
                      const FileIcon = getFileIcon(f.type);
                      return (
                        <div key={i} className="flex items-center gap-4 p-4 bg-muted/40 border border-border rounded-2xl group/file hover:border-accent/30 transition-all">
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                            <FileIcon className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{f.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{formatBytes(f.size)}</p>
                          </div>
                          <button
                            onClick={() => removeFile(i)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover/file:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Drag and Drop Feedback */}
                {isDragging && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-accent/5 dark:bg-accent/10 backdrop-blur-sm pointer-events-none border-4 border-dashed border-accent/30 rounded-3xl sm:rounded-[2.5rem]">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 dark:bg-accent/20 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-foreground">Drop to Attach Files</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Up to {formatBytes(maxTotalSize)}</p>
                  </div>
                )}
              </div>

              {/* Settings & Footer Bar */}
              <div className="p-6 bg-slate-50/80 dark:bg-black/20 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
                  {/* Expiry Selector */}
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-muted-foreground ml-1">Auto Destruct</label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(Number(e.target.value))}
                      className="w-full sm:w-auto bg-white dark:bg-background border border-border/50 rounded-xl px-4 py-2 text-xs font-bold text-zinc-900 dark:text-foreground focus:border-accent/50 outline-none transition-all cursor-pointer hover:bg-slate-50"
                    >
                      {EXPIRY_OPTIONS.filter(opt => !(!burnOnRead && opt.value > 24)).map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-background text-zinc-900 dark:text-foreground">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px h-10 bg-border/50 hidden md:block" />
                  {/* Quick Access Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-background hover:bg-slate-50 dark:hover:bg-muted border border-border/50 rounded-xl text-xs font-bold transition-all text-muted-foreground hover:text-foreground"
                    >
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      <span className="whitespace-nowrap">Attach</span>
                    </button>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${showAdvanced ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white dark:bg-background text-muted-foreground hover:text-foreground border border-border/50'
                        }`}
                    >
                      <Settings className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                      <span className="whitespace-nowrap">Settings</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => {
                      setBurnOnRead(!burnOnRead);
                      if (burnOnRead) {
                        // Switching to multi-view: ensure expiry is valid and show advanced for password
                        if (expiryHours > 24) setExpiryHours(24);
                        setShowAdvanced(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${!burnOnRead
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-transparent hover:border-slate-300 dark:hover:border-zinc-500/20'
                      }`}
                  >
                    {burnOnRead ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {burnOnRead ? 'Burn on View' : 'Multi-View Active'}
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || (!secretText && files.length === 0) || (!burnOnRead && !password)}
                    className="w-full md:w-auto px-6 sm:px-10 py-3.5 sm:py-4 bg-accent hover:bg-accent/90 disabled:opacity-30 disabled:grayscale text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-accent/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Shield className="w-4 h-4 sm:w-5 sm:h-5" />}
                    {isLoading ? 'Finalizing...' : 'Create Secret'}
                  </button>
                </div>
              </div>

              {/* Advanced Security Drawer */}
              {showAdvanced && (
                <div className="p-8 bg-slate-50/50 dark:bg-black/20 border-t border-border/50 animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Password Access
                        {!burnOnRead && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">Required</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Optional Key..."
                          className="w-full bg-white dark:bg-background border border-border/50 rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-muted-foreground/50 focus:border-accent/50 transition-all outline-none"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                        <Shield className="w-3 h-3" /> IP Restriction
                      </label>
                      <input
                        type="text"
                        value={allowedIp}
                        onChange={(e) => setAllowedIp(e.target.value)}
                        placeholder="e.g. 192.168.1.1"
                        className="w-full bg-white dark:bg-background border border-border rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-muted-foreground/30 focus:border-accent/50 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Custom Alias
                      </label>
                      <div className="flex items-center">
                        <div className="px-3 py-3 bg-muted border border-border border-r-0 rounded-l-xl text-[10px] font-bold text-muted-foreground">ilusion.io/s/</div>
                        <input
                          type="text"
                          value={alias}
                          onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="my-secret"
                          className="w-full bg-white dark:bg-background border border-border rounded-r-xl px-4 py-3 text-xs text-zinc-900 dark:text-foreground placeholder:text-zinc-400 dark:placeholder:text-muted-foreground/30 focus:border-accent/50 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Hidden Inputs */}
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
            </div>

            {/* Error / Progress */}
            {error && (
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--destructive)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="w-full rounded-full h-1 overflow-hidden" style={{ background: 'var(--border-default)' }}>
                  <div className="h-full transition-all duration-500" style={{ width: `${uploadProgress}%`, background: 'var(--accent-primary)' }} />
                </div>
                <p className="text-[10px] text-center font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                  {uploadProgress < 100 ? 'Encrypting & uploading...' : 'Finalizing secure link...'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Check className="w-7 h-7" style={{ color: 'var(--success)' }} />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Secret is <span style={{ color: 'var(--success)' }}>Live</span></h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This link self-destructs after the first view.</p>
            </div>

            <div className="card gradient-border p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Secure Link</label>
                <div className="relative">
                  <input
                    readOnly
                    value={generatedLink}
                    className="w-full rounded-xl px-4 py-3 pr-24 text-xs font-mono outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-1.5 bottom-1.5 px-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 text-white"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
                <div className="p-2 bg-white rounded-lg shrink-0">
                  <QRCodeSVG value={generatedLink} size={88} bgColor="#fff" fgColor="#000" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-sm font-bold flex items-center justify-center sm:justify-start gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Zap className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} /> Scan to View
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Share this QR for instant mobile access.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button onClick={resetForm} className="btn-secondary w-full !py-2.5 flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" /> Create New
                </button>
                <Link href="/sign-up" className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2">
                  <Inbox className="w-3.5 h-3.5" /> Get Free Inbox
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Reveal a Secret ── */}
      {!generatedLink && (
        <div className="w-full max-w-4xl px-6 pb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <RevealPanel />
        </div>
      )}

      {/* Sign-Up Nudge */}
      {!generatedLink && !isSignedIn && (
        <div className="w-full max-w-5xl px-4 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl" style={{ border: '1px solid var(--accent-muted)', background: 'var(--accent-subtle)' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Track secrets & get your own secure inbox</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Free forever during beta. No credit card.</p>
            </div>
            <Link href="/sign-up" className="btn-primary !text-xs !py-2 shrink-0 whitespace-nowrap">
              Claim Free Inbox →
            </Link>
          </div>
        </div>
      )}

      {/* History */}
      {!generatedLink && localHistory.length > 0 && (
        <div className="w-full max-w-5xl px-4 sm:px-6 pb-24 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Inbox className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              Recent Activity
              <span className="badge badge-accent !py-0 !text-[9px]">Local Only</span>
            </h2>
            <button
              onClick={() => { if (confirm('Clear local history?')) { localStorage.removeItem('ilusion_recent_secrets'); setLocalHistory([]); } }}
              className="text-[10px] font-bold uppercase tracking-widest transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {localHistory.map((secret) => (
              <div key={secret.id} className="card gradient-border p-4 hover:scale-[1.01] transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                      {secret.label || 'Secure Message'}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(secret.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${secret.status === 'burned' ? 'bg-red-500/10 text-red-500'
                      : secret.status === 'expired' ? 'bg-zinc-500/10 text-zinc-400'
                        : 'bg-emerald-500/10 text-emerald-500'
                    }`}>{secret.status}</span>
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Views</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{secret.viewCount}</span>
                    </div>
                    <div className="w-px h-5" style={{ background: 'var(--border-default)' }} />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Expires</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {(() => {
                          const msLeft = secret.expiresAt - Date.now();
                          if (msLeft <= 0) return 'Expired';
                          const minsLeft = Math.ceil(msLeft / 60000);
                          if (minsLeft < 60) return `${minsLeft}m`;
                          return `${Math.ceil(minsLeft / 60)}h`;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(secret.link);
                        alert('Link copied!');
                      }}
                      className="p-2 bg-muted hover:bg-accent/10 hover:text-accent rounded-lg transition-colors"
                      title="Copy Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        removeLocalSecret(secret.id);
                        setLocalHistory(getLocalSecrets());
                      }}
                      className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-muted-foreground"
                      title="Remove from history"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center mt-6 font-medium" style={{ color: 'var(--text-tertiary)' }}>
            History purges automatically after 24 hours.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-5xl px-4 sm:px-6 py-8 mt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {[['Shield', 'Zero-logs'], ['Lock', 'AES-256 GCM'], ['Timer', 'Auto-burn']].map(([, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Privacy</Link>
            <Link href="/terms" className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Terms</Link>
            <Link href="/docs/api" className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
