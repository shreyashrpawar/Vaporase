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
  Inbox,
  Paperclip,
  Flame
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
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [showBanner, setShowBanner] = useState(true);
  const [contentType, setContentType] = useState<'text' | 'file'>('text');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [revealId, setRevealId] = useState('');

  const handleReveal = () => {
    const input = revealId.trim();
    if (!input) return;

    // Check if the input contains a URL or a full path
    if (input.includes('/') || input.includes('localhost') || input.includes('ilusion.io') || input.includes('.')) {
      try {
        let urlString = input;
        // Prefix protocol if it's missing but looks like a domain
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
          urlString = 'https://' + urlString;
        }
        
        const parsedUrl = new URL(urlString);
        // Extracts /secret/xyz or /s/xyz along with its hash (e.g. #key)
        const path = parsedUrl.pathname + parsedUrl.hash;
        
        // Ensure path routes properly (either to /secret/[id] or /s/[alias])
        if (path.startsWith('/secret/') || path.startsWith('/s/')) {
          router.push(path);
          return;
        }
      } catch (e) {
        console.error('Failed to parse input as URL:', e);
      }
      
      // Fallback: If it's a relative path containing /secret/ or /s/
      if (input.includes('/secret/') || input.includes('/s/')) {
        const relativePath = input.startsWith('/') ? input : `/${input}`;
        router.push(relativePath);
        return;
      }
    }

    // Fallback: Default to just appending to /secret/ if it's a raw ID or alias
    router.push(`/secret/${input}`);
  };

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/dashboard');
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    setLocalHistory(getLocalSecrets());
  }, []);

  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);

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
          setUserPlan(data.plan || 'free');
        })
        .catch(err => console.error('Error fetching profile:', err));
    } else {
      setUserPlan('free');
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

      const fileKey = uploadedFiles[0]?.fileKey || null;
      const fileName = uploadedFiles[0]?.fileName || null;
      const fileSize = uploadedFiles[0]?.fileSize || null;
      const fileType = uploadedFiles[0]?.fileType || null;

      const customId = (alias && userPlan === 'pro') ? alias : nanoid(8);
      const salt = customId;

      let encryptionKey: string;
      let includeKeyInHash = false;

      if (password) {
        encryptionKey = await deriveKeyFromPassword(password, salt);
        includeKeyInHash = false;
      } else {
        encryptionKey = await generateKey();
        includeKeyInHash = true;
      }

      const finalEncryptedContent = await encryptText(secretText, encryptionKey);
      const isE2EE = true;

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

      const linkBase = `${window.location.origin}/s/${id}`;
      const finalLink = includeKeyInHash ? `${linkBase}#${encryptionKey}` : linkBase;
      setGeneratedLink(finalLink);

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

  const handleDeleteRecentSecret = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret forever? Senders/recipients will no longer be able to open it.')) return;
    try {
      // Send a delete/revoke request to the backend
      await fetch('/api/secrets/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Failed to revoke secret on server:', err);
    } finally {
      // Always remove from local history even if server call failed or was already deleted
      removeLocalSecret(id);
      setLocalHistory(getLocalSecrets());
    }
  };

  return (
    <div className="dot-grid min-h-screen flex flex-col bg-[#faf9f5] dark:bg-zinc-950 transition-colors relative">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: 'var(--mesh-1)' }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: 'var(--mesh-2)' }} />
      </div>

      {/* Top Banner Alert */}
      {userPlan !== 'pro' && showBanner && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-full shadow-sm text-[10px] font-black text-[#534d5e] dark:text-zinc-400">
          <span>Free plan</span>
          <span className="w-1 h-1 rounded-full bg-[#e5e3d9] dark:bg-zinc-800" />
          <Link href="/pricing" className="text-zinc-900 dark:text-zinc-100 hover:underline font-extrabold">Upgrade</Link>
          <span className="w-1 h-1 rounded-full bg-[#e5e3d9] dark:bg-zinc-800" />
          <button onClick={() => setShowBanner(false)} className="hover:text-[#1c1917]"><X className="w-2.5 h-2.5" /></button>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#faf9f5]/80 dark:bg-zinc-950/80 border-b border-[#e5e3d9] dark:border-zinc-800 backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-900/5 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 transition-all group-hover:scale-105">
              <Lock className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <span className="text-base font-bold text-zinc-900 dark:text-white">ilusion<span className="text-zinc-400 dark:text-zinc-500">.io</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-xs font-semibold text-[#534d5e] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hidden sm:block transition-colors">Pricing</Link>
            <Link href="/docs/api" className="text-xs font-semibold text-[#534d5e] dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hidden sm:block transition-colors">API</Link>
            <ThemeToggle />
            <Link href="/sign-up" className="px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all bg-accent hover:bg-accent-light">Get Free Inbox</Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-10 flex-1">
        {!generatedLink ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start animate-fade-in-up">
            
            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
              <div className="space-y-5 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/5 text-accent rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-accent/10 shadow-sm">
                  <Sparkles className="w-3 h-3 text-accent" /> Community Pro — Free Beta
                </div>
                
                {/* Title */}
                <h1 className="text-4xl sm:text-[48px] font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
                  Share anything.<br />
                  <span className="text-zinc-800 dark:text-zinc-200 underline decoration-accent/40 dark:decoration-accent/60 decoration-wavy underline-offset-8">Secretly.</span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-xs sm:text-sm font-semibold text-[#534d5e] dark:text-zinc-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                  AES-256 client-side encryption. Self-destructs after reading.<br className="hidden lg:block" />
                  <span className="font-extrabold text-zinc-900 dark:text-white mt-1 block">Zero knowledge — we never see your data. No account needed.</span>
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 max-w-md mx-auto lg:mx-0">
                  {[
                    { label: 'ZERO-LOGS', icon: Shield },
                    { label: 'AES-256-GCM', icon: Lock },
                    { label: 'AUTO-BURN', icon: Flame },
                    { label: 'E2EE', icon: Zap },
                    { label: 'NO ACCOUNT', icon: Inbox }
                  ].map((badge) => {
                    const IconComp = badge.icon;
                    return (
                      <span key={badge.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5ed] dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-full text-[9px] font-black uppercase tracking-wider text-[#534d5e] dark:text-zinc-400 shadow-sm">
                        <IconComp className="w-3 h-3 text-zinc-900 dark:text-zinc-100" />
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Reveal Section (Desktop Only) */}
              <div className="hidden lg:block space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#e5e3d9] dark:bg-zinc-800" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500">REVEAL A SECRET</span>
                  <div className="h-px w-8 bg-[#e5e3d9] dark:bg-zinc-800" />
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-4 flex flex-col items-stretch gap-4 shadow-sm shadow-zinc-900/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center shadow-sm shrink-0">
                      <Eye className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wide text-zinc-900 dark:text-white">Open secret</h4>
                      <p className="text-[9px] text-[#a5a1ad] dark:text-zinc-500">Paste ID or alias</p>
                    </div>
                  </div>
                  <div className="flex flex-1 w-full items-center gap-2">
                    <input
                      value={revealId}
                      onChange={(e) => setRevealId(e.target.value)}
                      placeholder="Secret ID or alias..."
                      className="flex-1 w-full bg-[#faf9f5] dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 shadow-inner font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                    />
                    <button
                      onClick={handleReveal}
                      disabled={!revealId.trim()}
                      className="px-4 py-2.5 bg-accent hover:bg-accent-light disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-accent/10 flex items-center justify-center shrink-0"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Stepper Row */}
              <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-4 py-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-full shadow-sm">
                  <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-black shadow-sm shadow-accent/25">1</span>
                  <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white whitespace-nowrap">Write message</span>
                </div>
                <span className="text-[#a5a1ad] dark:text-zinc-600 font-bold">›</span>

                <div className="flex items-center gap-2 px-3 py-2 opacity-50">
                  <span className="w-5 h-5 rounded-full bg-[#a5a1ad] dark:bg-zinc-700 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span className="text-[11px] font-bold text-[#534d5e] dark:text-zinc-400 whitespace-nowrap">Configure</span>
                </div>
                <span className="text-[#a5a1ad] dark:text-zinc-600 font-bold">›</span>

                <div className="flex items-center gap-2 px-3 py-2 opacity-50">
                  <span className="w-5 h-5 rounded-full bg-[#a5a1ad] dark:bg-zinc-700 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span className="text-[11px] font-bold text-[#534d5e] dark:text-zinc-400 whitespace-nowrap">Share link</span>
                </div>
              </div>

              {/* Secure Composer Card */}
              <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm shadow-zinc-900/5 transition-all">
                {/* Card Header macOS style */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#faf9f5]/50 dark:bg-zinc-900/50 border-b border-[#e5e3d9] dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] opacity-90 shadow-sm" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] opacity-90 shadow-sm" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] opacity-90 shadow-sm" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500 ml-1">SECURE COMPOSER</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/5 text-accent rounded-full text-[9px] font-black uppercase tracking-widest border border-accent/10 shadow-sm">
                    <Shield className="w-3 h-3 text-accent" /> AES-256 GCM
                  </div>
                </div>

                {/* Main Input Area */}
                <div
                  className={`relative transition-all duration-500 ${isDragging ? 'bg-zinc-900/5' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <textarea
                    value={secretText}
                    onChange={(e) => setSecretText(e.target.value)}
                    placeholder="Type or paste your confidential message here..."
                    className="w-full min-h-[160px] bg-transparent p-6 sm:p-8 text-sm font-medium text-zinc-900 dark:text-foreground placeholder-[#a5a1ad] dark:placeholder-zinc-600 border-none focus:ring-0 focus:outline-none resize-none custom-scrollbar"
                  />

                  {/* Attachment Display */}
                  {files.length > 0 && (
                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                      {files.map((f, i) => {
                        const FileIcon = getFileIcon(f.type);
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 bg-[#faf9f5] dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl group/file hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-sm">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900/5 dark:bg-zinc-800/40 flex items-center justify-center shrink-0">
                              <FileIcon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{f.name}</p>
                              <p className="text-[9px] text-[#a5a1ad] dark:text-zinc-500 font-mono uppercase tracking-tighter">{formatBytes(f.size)}</p>
                            </div>
                            <button
                              onClick={() => removeFile(i)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover/file:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Drag and Drop Feedback */}
                  {isDragging && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-accent/5 dark:bg-accent/10 backdrop-blur-sm pointer-events-none border-4 border-dashed border-accent/20 rounded-3xl">
                      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-accent" />
                      </div>
                      <p className="text-base font-bold text-accent">Drop to Attach Files</p>
                      <p className="text-xs text-[#a5a1ad] dark:text-zinc-500">Up to {formatBytes(maxTotalSize)}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Settings & Footer Bar */}
                <div className="p-5 bg-[#faf9f5]/80 dark:bg-zinc-900/50 border-t border-[#e5e3d9] dark:border-zinc-800 flex flex-col md:flex-row md:flex-wrap xl:flex-nowrap items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-4 w-full xl:w-auto">
                    
                    {/* Expiry Selector */}
                    <div className="flex flex-col gap-1 w-full sm:w-auto shrink-0">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500 ml-1">DESTRUCT AFTER</label>
                      <select
                        value={expiryHours}
                        onChange={(e) => setExpiryHours(Number(e.target.value))}
                        className="w-full sm:w-auto bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-bold text-zinc-900 dark:text-foreground focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all cursor-pointer shadow-sm hover:bg-[#faf9f5]"
                      >
                        {EXPIRY_OPTIONS.filter(opt => !(!burnOnRead && opt.value > 24)).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-px h-10 bg-[#e5e3d9] dark:bg-zinc-800 hidden sm:block shrink-0" />

                    {/* Actions (Attach / Settings) */}
                    <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-zinc-950 hover:bg-[#faf9f5] dark:hover:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl text-xs font-bold text-[#534d5e] dark:text-zinc-300 shadow-sm transition-all"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-accent" />
                        <span className="whitespace-nowrap">Attach</span>
                      </button>
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          showAdvanced 
                            ? 'bg-accent/10 text-accent dark:bg-accent/20 border border-accent/20' 
                            : 'bg-white dark:bg-zinc-950 text-[#534d5e] dark:text-zinc-300 border border-[#e5e3d9] dark:border-zinc-800 hover:bg-[#faf9f5]'
                        }`}
                      >
                        <Settings className={`w-3.5 h-3.5 text-accent transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                        <span className="whitespace-nowrap">Settings</span>
                      </button>
                    </div>

                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    
                    {/* Burn toggle */}
                    <button
                      onClick={() => {
                        if (userPlan === 'free') {
                          alert('Disabling Burn on View is a Pro feature. Please upgrade to Pro.');
                          return;
                        }
                        setBurnOnRead(!burnOnRead);
                        if (burnOnRead) {
                          if (expiryHours > 24) setExpiryHours(24);
                          setShowAdvanced(true);
                        }
                      }}
                      className={`relative w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                        burnOnRead
                          ? 'bg-accent/10 text-accent dark:bg-accent/20 border border-accent/20 hover:bg-accent/15'
                          : 'bg-white dark:bg-zinc-950 text-[#534d5e] dark:text-zinc-300 border border-[#e5e3d9] dark:border-zinc-800 hover:bg-[#faf9f5]'
                      } ${userPlan === 'free' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <Flame className="w-3.5 h-3.5 text-accent" />
                      <span>Burn on view</span>
                      {userPlan === 'free' && (
                         <span className="absolute -top-2.5 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider shadow-sm rotate-12">PRO</span>
                      )}
                    </button>

                    {/* Submit button */}
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading || (!secretText && files.length === 0) || (!burnOnRead && !password)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent-light text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-30 disabled:bg-accent/30"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                      <span>{isLoading ? 'Finalizing...' : 'Create Secret'}</span>
                    </button>

                  </div>
                </div>

                {/* Advanced Security Drawer */}
                {showAdvanced && (
                  <div className="p-6 bg-[#faf9f5]/50 dark:bg-zinc-900/50 border-t border-[#e5e3d9] dark:border-zinc-800 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Lock className="w-3 h-3" /> Password Access
                          {userPlan === 'free' && <span className="text-[8px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded font-black tracking-wider">PRO</span>}
                          {!burnOnRead && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">Required</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={userPlan === 'free'}
                            placeholder={userPlan === 'free' ? "Pro feature" : "Optional Key..."}
                            className={`w-full bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-foreground placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm ${userPlan === 'free' ? 'opacity-60 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900' : ''}`}
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={userPlan === 'free'}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a5a1ad] hover:text-zinc-900 dark:hover:text-foreground transition-colors disabled:opacity-50"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {userPlan === 'free' && (
                          <div className="absolute inset-0 z-10" onClick={() => alert('Password Access is a Pro feature. Please upgrade to Pro.')} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> Custom Alias
                        </label>
                        <div className="flex items-center">
                          <div className="px-3 py-2.5 bg-[#f5f5ed] border border-[#e5e3d9] dark:border-zinc-800 border-r-0 rounded-l-xl text-[10px] font-bold text-[#534d5e] dark:text-zinc-400">ilusion.io/s/</div>
                          <input
                            type="text"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="my-secret"
                            className="w-full bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-r-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-foreground placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all outline-none shadow-sm"
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
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/20 text-red-500">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              {isLoading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="w-full rounded-full h-1 overflow-hidden bg-[#e5e3d9] dark:bg-zinc-800">
                    <div className="h-full transition-all duration-500 bg-accent" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-center font-bold uppercase tracking-widest text-[#a5a1ad]">
                    {uploadProgress < 100 ? 'Encrypting & uploading...' : 'Finalizing secure link...'}
                  </p>
                </div>
              )}

              {/* Reveal Section (Mobile Only) */}
              <div className="lg:hidden space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#e5e3d9] dark:bg-zinc-800" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#a5a1ad] dark:text-zinc-500">REVEAL A SECRET</span>
                  <div className="h-px flex-1 bg-[#e5e3d9] dark:bg-zinc-800" />
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm shadow-zinc-900/5">
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center shadow-sm">
                      <Eye className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wide text-zinc-900 dark:text-white">Open secret</h4>
                      <p className="text-[9px] text-[#a5a1ad] dark:text-zinc-500">Paste ID or alias</p>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      value={revealId}
                      onChange={(e) => setRevealId(e.target.value)}
                      placeholder="Secret ID or custom alias..."
                      className="flex-1 bg-[#faf9f5] dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-[#a5a1ad] dark:placeholder-zinc-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 shadow-inner font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                    />
                    <button
                      onClick={handleReveal}
                      disabled={!revealId.trim()}
                      className="px-5 py-2.5 bg-accent hover:bg-accent-light disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-accent/10 flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-green-500/10 border border-green-500/20 shadow-sm">
                <Check className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Secret is <span className="text-green-500">Live</span></h2>
              <p className="text-xs text-[#534d5e] dark:text-zinc-400">This secure encrypted link self-destructs after the first view.</p>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-6 space-y-5 shadow-sm shadow-zinc-900/5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5a1ad]">Secure Link</label>
                <div className="relative">
                  <input
                    readOnly
                    value={generatedLink}
                    className="w-full bg-[#faf9f5] dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800 rounded-xl px-4 py-3 pr-24 text-xs font-mono outline-none text-zinc-900 dark:text-white focus:border-accent"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-1.5 bottom-1.5 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all bg-accent hover:bg-accent-light text-white shadow-sm flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#faf9f5] dark:bg-zinc-900 border border-[#e5e3d9] dark:border-zinc-800">
                <div className="p-2 bg-white rounded-xl shrink-0 shadow-sm border border-slate-100">
                  <QRCodeSVG value={generatedLink} size={88} bgColor="#fff" fgColor="#000" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-sm font-bold flex items-center justify-center sm:justify-start gap-1.5 text-zinc-900 dark:text-white">
                    <Zap className="w-4 h-4 text-accent" /> Scan to View
                  </p>
                  <p className="text-xs text-[#534d5e] dark:text-zinc-400">Share this QR code for instant secure mobile decryption.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button onClick={resetForm} className="px-4 py-2.5 bg-[#f5f5ed] dark:bg-zinc-900 hover:bg-[#faf9f5] border border-[#e5e3d9] dark:border-zinc-800 text-[#534d5e] dark:text-zinc-300 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Create New
                </button>
                <Link href="/sign-up" className="px-4 py-2.5 bg-accent hover:bg-accent-light text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5" /> Get Free Inbox
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sign-Up Nudge */}
      {!generatedLink && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-accent/5 border border-accent/10 shadow-sm">
            <div>
              <p className="text-sm font-extrabold text-zinc-900 dark:text-white">Track secrets & get your own secure inbox</p>
              <p className="text-xs text-[#534d5e] dark:text-zinc-400 mt-0.5">Free forever during beta. No credit card.</p>
            </div>
            <Link href="/sign-up" className="px-4 py-2 bg-accent hover:bg-accent-light text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0">
              Claim Free Inbox →
            </Link>
          </div>
        </div>
      )}

      {/* History */}
      {!generatedLink && localHistory.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24 relative z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-zinc-900 dark:text-white">
              <Inbox className="w-4 h-4 text-accent" />
              Recent Activity
              <span className="px-2 py-0.5 bg-accent/5 text-accent text-[8px] font-black rounded-full border border-accent/10">Local Only</span>
            </h2>
            <button
              onClick={() => { if (confirm('Clear local history?')) { localStorage.removeItem('ilusion_recent_secrets'); setLocalHistory([]); } }}
              className="text-[10px] font-black uppercase tracking-widest text-[#a5a1ad] hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localHistory.map((secret) => (
              <div key={secret.id} className="bg-white dark:bg-zinc-950 border border-[#e5e3d9] dark:border-zinc-800 rounded-3xl p-4 shadow-sm hover:scale-[1.01] transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate max-w-[180px]">
                      {secret.label || 'Secure Message'}
                    </p>
                    <p className="text-[10px] text-[#a5a1ad]">
                      {new Date(secret.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    secret.status === 'burned' 
                      ? 'bg-red-500/10 text-red-500'
                      : secret.status === 'expired' 
                        ? 'bg-zinc-500/10 text-zinc-400'
                        : 'bg-zinc-900/5 text-zinc-900 dark:bg-zinc-800/40 dark:text-zinc-100'
                  }`}>{secret.status}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#e5e3d9] dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#a5a1ad]">Views</span>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-white">{secret.viewCount}</span>
                    </div>
                    <div className="w-px h-5 bg-[#e5e3d9] dark:bg-zinc-800" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#a5a1ad]">Expires</span>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
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
                      className="p-2 bg-[#f5f5ed] hover:bg-zinc-900/5 hover:text-zinc-900 text-[#534d5e] dark:text-zinc-400 dark:bg-zinc-900 rounded-lg transition-colors"
                      title="Copy Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecentSecret(secret.id)}
                      className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-[#a5a1ad] cursor-pointer"
                      title="Delete Secret Forever"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center mt-6 font-medium text-[#a5a1ad]">
            History purges automatically after 24 hours.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 mt-auto relative z-10 border-t border-[#e5e3d9] dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {[['Shield', 'Zero-logs'], ['Lock', 'AES-256 GCM'], ['Timer', 'Auto-burn']].map(([, label]) => (
              <span key={label} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#a5a1ad]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[10px] text-[#a5a1ad] hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-[10px] text-[#a5a1ad] hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
            <Link href="/docs/api" className="text-[10px] text-[#a5a1ad] hover:text-zinc-900 dark:hover:text-white transition-colors">API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
