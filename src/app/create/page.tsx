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
      router.replace('/dashboard/send');
    }
  }, [isSignedIn, router]);

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
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-accent-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 dark:bg-accent/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header / Brand */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-8 flex items-center justify-between pointer-events-none">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group pointer-events-auto">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-muted border border-border flex items-center justify-center backdrop-blur-xl transition-all group-hover:scale-110 group-hover:bg-muted/80 group-hover:border-accent/50 group-hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">ilusion<span className="text-accent">.io</span></span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6 pointer-events-auto">
          <Link href="/contact" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors hidden md:block">Contact</Link>
          <ThemeToggle />
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <Link href="/dashboard" className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-muted border border-border hover:bg-muted/80">
                <span className="hidden sm:inline">Workspace</span> <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </Link>
            ) : (
              <Link href="/sign-up" className="text-xs font-bold px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">Get Free Inbox →</Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Composer Area */}
      <main className="w-full max-w-4xl relative z-10 py-20">
        {!generatedLink ? (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-widest mb-2 animate-bounce-slow">
                <Sparkles className="w-3 h-3" /> Now Unlocked: Community Pro
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Securely share <br />
                <span className="text-gradient">anything</span> to anyone.
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-lg max-w-xl mx-auto font-medium px-4">
                Military-grade encryption for your most sensitive notes and files.
                Self-destructs automatically after reading.
              </p>
            </div>

            <div className="relative group">
              {/* Glassmorphic Card Container */}
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-3xl sm:rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />

              <div className="relative bg-white dark:bg-slate-900/80 border border-border/50 dark:border-white/10 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Editor Toolbar */}
                <div className="flex items-center justify-between p-6 border-b border-border/50 bg-slate-50 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 px-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 dark:bg-red-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500/50" />
                    </div>
                    <div className="h-4 w-px bg-border/50 mx-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-muted-foreground">Secure Composer</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-accent" />
                      AES-256 GCM
                    </div>
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
              </div>

              {/* Hidden Inputs */}
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
            </div>

            {/* Success/Error Toast Area */}
            <div className="flex flex-col items-center gap-4">
              {error && (
                <div className="flex items-center gap-3 px-6 py-4 bg-destructive/10 border border-destructive/20 rounded-[2rem] text-sm text-destructive font-bold animate-shake">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}
              {isLoading && uploadProgress > 0 && (
                <div className="w-full max-w-md space-y-3">
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-center font-black uppercase tracking-widest text-muted-foreground">
                    {uploadProgress < 100 ? 'Syncing with secure nodes...' : 'Finalizing ephemeral link...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Result Screen Redesign */
          <div className="max-w-2xl mx-auto space-y-12 animate-fade-in-up">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-success/10 rounded-[2rem] border border-success/20 flex items-center justify-center mx-auto relative group">
                <div className="absolute inset-0 bg-success/20 blur-2xl group-hover:bg-success/30 transition-all" />
                <Check className="w-12 h-12 text-success relative z-10" />
              </div>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Your secret is <span className="text-success">Live</span>.</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">The link below will self-destruct after the first view.</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-success/20 rounded-[2.5rem] blur opacity-25" />
              <div className="relative bg-background/80 dark:bg-slate-900/60 backdrop-blur-3xl border border-border p-10 rounded-[2.5rem] space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Link</label>
                  <div className="relative group/link">
                    <input
                      readOnly
                      value={generatedLink}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 pr-14 sm:pr-40 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:border-accent/50 outline-none transition-all"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-2 bottom-2 px-3 sm:px-8 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10 p-6 sm:p-8 bg-inset/40 rounded-3xl sm:rounded-[2rem] border border-border">
                  <div className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shrink-0">
                    <QRCodeSVG value={generatedLink} size={120} className="sm:w-[140px] sm:h-[140px]" bgColor="#fff" fgColor="#000" />
                  </div>
                  <div className="space-y-2 sm:space-y-4 text-center md:text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent" /> Scan to View
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto md:mx-0">
                      Share this QR code with your recipient for instant, secure access on mobile devices.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={resetForm}
                className="w-full py-4 sm:py-5 bg-muted border border-border rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all text-foreground flex items-center justify-center gap-3"
              >
                <span className="w-3.5 h-3.5 sm:w-4 sm:h-4"><Sparkles className="w-full h-full text-accent" /></span>
                Create New
              </button>
              <Link
                href="/dashboard/secrets"
                className="w-full py-4 sm:py-5 bg-accent hover:bg-accent/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all text-white flex items-center justify-center gap-3 shadow-xl shadow-accent/20"
              >
                <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                My Secrets
              </Link>
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

      {/* ── Sign-Up Nudge ── */}
      {!generatedLink && !isSignedIn && (
        <div className="w-full max-w-4xl px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-accent/20 bg-accent/5">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Want to track your secrets & get a custom inbox?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Free forever during beta. No credit card needed.</p>
            </div>
            <Link href="/sign-up" className="shrink-0 px-5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all whitespace-nowrap">
              Claim Free Inbox →
            </Link>
          </div>
        </div>
      )}

      {/* Local History Section (Anonymous Workspace) */}
      {!generatedLink && localHistory.length > 0 && (
        <div className="w-full max-w-4xl px-6 pb-32 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-accent" /> Recent Activity
              <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">Local Only</span>
            </h2>
            <button
              onClick={() => {
                if (confirm('Clear local history?')) {
                  localStorage.removeItem('ilusion_recent_secrets');
                  setLocalHistory([]);
                }
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localHistory.map((secret) => (
              <div key={secret.id} className="group relative bg-white dark:bg-slate-900/50 border border-border/50 hover:border-accent/30 rounded-2xl p-5 transition-all hover:shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {secret.label || 'Secure Message'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Created {new Date(secret.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${secret.status === 'burned'
                    ? 'bg-red-500/10 text-red-500'
                    : secret.status === 'expired'
                      ? 'bg-zinc-500/10 text-zinc-500'
                      : 'bg-emerald-500/10 text-emerald-500 animate-pulse'
                    }`}>
                    {secret.status}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/10">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Views</span>
                      <span className="text-xs font-bold text-foreground">{secret.viewCount}</span>
                    </div>
                    <div className="w-px h-6 bg-border/20" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Expires</span>
                      <span className="text-xs font-bold text-foreground">
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

          <p className="text-[10px] text-center mt-8 text-muted-foreground/50 font-medium">
            History is automatically purged after 24 hours for your privacy.
          </p>
        </div>
      )}

      {/* Trust Badges / Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 sm:p-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Zero-Logs
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> AES-256
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <Timer className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Auto-Burn
        </div>
      </footer>
    </div>
  );
}
