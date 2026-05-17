'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
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
  Settings,
  ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateKey, encryptText, hashPassword, deriveKeyFromPassword } from '@/lib/crypto';
import { useAuth } from '@clerk/nextjs';
import { nanoid } from 'nanoid';

const EXPIRY_OPTIONS = [
  { label: '5m', value: 5 / 60 },
  { label: '1h', value: 1 },
  { label: '12h', value: 12 },
  { label: '1d', value: 24 },
  { label: '7d', value: 168 },
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

export default function DropForm({ profile, isEmbedded = false }: { profile: any, isEmbedded?: boolean }) {
  const { isSignedIn } = useAuth();
  const [secretText, setSecretText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [password, setPassword] = useState('');
  const [allowedIp, setAllowedIp] = useState('');
  const [alias, setAlias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('pro'); // Default to pro for feature parity
  const [burnOnRead, setBurnOnRead] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.plan) setUserPlan(data.plan);
        })
        .catch(err => console.error('Error fetching profile:', err));
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
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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

        const presignRes = await fetch('/api/secrets/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream',
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
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error('Network error during upload.'));
          xhr.send(file);
        });

        uploadedFiles.push({ fileKey: key, fileName: file.name, fileSize: file.size, fileType: file.type });
      }
      setUploadProgress(70);

      const fileKey = uploadedFiles[0]?.fileKey || null;
      const fileName = uploadedFiles[0]?.fileName || null;
      const fileSize = uploadedFiles[0]?.fileSize || null;
      const fileType = uploadedFiles[0]?.fileType || null;

      // 1. Determine the ID/Salt
      const customId = (alias && userPlan === 'pro') ? alias : nanoid(8);
      const salt = customId;

      // 2. Encryption Strategy
      let encryptionKey: string;
      let includeKeyInHash = false;

      if (password) {
        // Password-based key derivation for speakable links
        encryptionKey = await deriveKeyFromPassword(password, salt);
        includeKeyInHash = false;
      } else {
        // Standard random key in URL fragment
        encryptionKey = await generateKey();
        includeKeyInHash = true;
      }

      const finalEncryptedContent = await encryptText(secretText || 'Encrypted Payload', encryptionKey);
      const isE2EE = true;

      // Hash password for server-side auth
      let finalPasswordHash = null;
      if (password) {
        finalPasswordHash = await hashPassword(password);
      }

      setUploadProgress(85);

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
          isE2EE,
          recipientId: profile.userId,
          dropKey: includeKeyInHash ? encryptionKey : null,
          alias: (alias && userPlan === 'pro') ? alias : null,
          burnOnRead,
          files: uploadedFiles,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to drop secret');
      }

      const { id } = await createRes.json();
      setUploadProgress(100);
      
      let link = `${window.location.origin}/secret/${(alias && userPlan === 'pro') ? alias : id}`;
      if (includeKeyInHash) {
        link += `#${encryptionKey}`;
      }
      setGeneratedLink(link);
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
    setExpiryHours(24);
    setPassword('');
    setAllowedIp('');
    setGeneratedLink('');
    setError('');
    setCopied(false);
    setUploadProgress(0);
  };


  if (generatedLink) {
    if (isEmbedded) {
      return (
        <div className="bg-elevated border border-white/[0.05] rounded-[2rem] p-8 shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Secret Dropped</h3>
            <p className="text-sm text-muted-foreground">Successfully sent to <span className="text-foreground">{profile.displayName}</span></p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 font-mono text-xs break-all">
            {generatedLink}
          </div>
          <button onClick={resetForm} className="btn-primary w-full">Drop Another</button>
        </div>
      );
    }

    return (
      <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
              <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              ilusion<span className="text-accent">.io</span>
            </span>
          </Link>
        </nav>

        <main className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-xl animate-fade-in-up">
            <div className="bg-elevated border border-white/[0.05] rounded-[2.5rem] p-10 shadow-2xl space-y-10 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-success/5 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-success/10" />
              
              <div className="relative z-10 space-y-8">
                <div className="w-20 h-20 bg-success/10 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-transform">
                  <Check className="w-10 h-10 text-success" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white">Secret <span className="text-success">Dropped</span></h2>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Securely deposited in <strong className="text-slate-900 dark:text-white">{profile.displayName}</strong>'s workspace.
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Access Link</label>
                  <div className="relative group/link">
                    <input
                      readOnly
                      value={generatedLink}
                      className="input !py-4.5 !pr-32 !text-sm font-mono !bg-white/[0.03] border-white/[0.1] truncate text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-2 bottom-2 px-6 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-all flex items-center gap-2"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 p-8 bg-white/[0.02] rounded-3xl border border-white/[0.05]">
                  <QRCodeSVG value={generatedLink} size={160} bgColor="transparent" fgColor="var(--text-primary)" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Key Encrypted</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button onClick={resetForm} className="btn-secondary !py-4 font-bold rounded-2xl">
                    Drop Another
                  </button>
                  <Link href="/" className="btn-primary !py-4 font-bold rounded-2xl">
                    Back Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isEmbedded) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-elevated border border-white/[0.05] rounded-[2rem] p-6 sm:p-10 shadow-xl space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message Content</label>
              <button onClick={() => setShowSecret(!showSecret)} className="text-muted-foreground hover:text-foreground">
                {showSecret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Paste sensitive data..."
              className={`input min-h-[160px] !py-6 !px-6 !bg-white/[0.02] border-white/[0.1] resize-none ${!showSecret && secretText ? 'text-security-disc' : ''}`}
              style={!showSecret && secretText ? { WebkitTextSecurity: 'disc' } as any : undefined}
            />
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 transition-all flex flex-col items-center gap-4 ${
              isDragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-white/[0.1] bg-white/[0.01]'
            }`}
          >
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
            
            {files.length > 0 ? (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{files.length} attached</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{formatBytes(files.reduce((a, b) => a + b.size, 0))} / {formatBytes(maxTotalSize)}</p>
                </div>
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-white/[0.03] border border-white/[0.05] rounded-xl group/file">
                    <FileText className="w-4 h-4 text-accent/50" />
                    <p className="text-xs font-bold truncate flex-1">{f.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1 hover:bg-white/10 rounded transition-colors">
                      <X className="w-3.5 h-3.5 text-muted-foreground group-hover/file:text-destructive" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="w-full py-2 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-xl text-[10px] font-bold text-muted-foreground hover:text-accent transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-3 h-3" /> Add More
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                  <Upload className="w-6 h-6 text-accent/50" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Attach multiple files</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Limit: {formatBytes(maxTotalSize)} total</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">Self-Destruct</label>
              <select value={expiryHours} onChange={(e) => setExpiryHours(Number(e.target.value))} className="input !py-3 !text-xs !bg-white/[0.02]">
                {EXPIRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">Password (Pro)</label>
              <input disabled placeholder="Unlock with Pro" className="input !py-3 !text-xs !bg-white/[0.02] opacity-50 cursor-not-allowed" />
            </div>
          </div>

          {error && <div className="text-xs text-destructive font-bold px-2">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={isLoading || (!secretText && files.length === 0)}
            className="btn-primary w-full !py-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {isLoading ? 'Sending...' : 'Securely Drop'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>
        <Link href="/" className="text-xs font-bold text-muted-foreground hover:text-accent transition-colors flex items-center gap-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12 max-w-6xl mx-auto w-full">
        <div className="w-full lg:w-3/5 space-y-10 animate-fade-in-up">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest">
              <Shield className="w-3 h-3" /> Secure Drop Portal
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
              Dropping for <span className="text-accent">{profile.displayName}</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-lg">
              Messages are E2E encrypted in your browser and instantly purged upon being revealed.
            </p>
          </header>

          <div className="bg-elevated border border-white/[0.05] rounded-[2.5rem] p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl -mr-24 -mt-24 transition-all group-hover:bg-accent/10" />
            
            <div className="relative z-10 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Message Content</label>
                  <button onClick={() => setShowSecret(!showSecret)} className="text-muted-foreground hover:text-foreground">
                    {showSecret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <textarea
                  value={secretText}
                  onChange={(e) => setSecretText(e.target.value)}
                  placeholder="Paste sensitive data, passwords, or keys..."
                  className={`input min-h-[160px] !py-6 !px-6 !text-lg !font-mono !bg-white/[0.02] border-white/[0.1] focus:border-accent/50 transition-all resize-none ${!showSecret && secretText ? 'text-security-disc' : ''}`}
                  style={!showSecret && secretText ? { WebkitTextSecurity: 'disc' } as any : undefined}
                />
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-3xl p-6 transition-all flex flex-col items-center gap-4 ${
                  isDragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-white/[0.1] hover:border-white/[0.2] bg-white/[0.01]'
                }`}
              >
                <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                
                {files.length > 0 ? (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{files.length} attached</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{formatBytes(files.reduce((a, b) => a + b.size, 0))} / {formatBytes(maxTotalSize)}</p>
                    </div>
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl group/file">
                        <FileText className="w-4 h-4 text-accent/50" />
                        <p className="text-sm font-bold truncate flex-1">{f.name}</p>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-1 hover:bg-white/10 rounded transition-colors">
                          <X className="w-4 h-4 text-muted-foreground group-hover/file:text-destructive" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="w-full py-2 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-xl text-[10px] font-bold text-muted-foreground hover:text-accent transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" /> Add More Files
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                      <Upload className="w-8 h-8 text-accent/50" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Attach multiple files</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Limit: {formatBytes(maxTotalSize)} total</p>
                    </div>
                  </div>
                )}
              </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-2">Self-Destruct In</label>
                    <select
                      value={expiryHours}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!burnOnRead && val > 24) return;
                        setExpiryHours(val);
                      }}
                      className="input !py-3.5 !text-xs !bg-white/[0.02] border-white/[0.1] text-slate-900 dark:text-white"
                    >
                      {EXPIRY_OPTIONS.filter(o => burnOnRead || o.value <= 24).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase ml-2 flex items-center justify-between">
                      <span>Password</span>
                      {!burnOnRead && <span className="text-[8px] text-accent">Required</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={!burnOnRead ? "Required password..." : "Lock with key..."}
                        className={`input !py-3.5 !text-xs !bg-white/[0.02] border-white/[0.1] text-slate-900 dark:text-white ${!burnOnRead && !password ? 'border-accent/50' : ''}`}
                      />
                      {userPlan === 'pro' && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Burn on View Toggle */}
                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Burn on View</p>
                      {!burnOnRead && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20 font-bold">Multiple Views Enabled</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {burnOnRead 
                        ? 'The secret will be deleted immediately after it is viewed once.' 
                        : 'Allows multiple views. Maximum 24-hour expiry and password required.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !burnOnRead;
                      setBurnOnRead(newValue);
                      if (!newValue) {
                        if (expiryHours > 24) setExpiryHours(24);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative ${burnOnRead ? 'bg-accent' : 'bg-slate-200 dark:bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${burnOnRead ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

          <div className="pt-4 border-t border-white/[0.05] space-y-4">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors ml-2"
            >
              <Settings className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
              Advanced Controls
            </button>

            {showAdvanced && (
              <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">Custom Alias</label>
                  <input
                    value={alias}
                    onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder={userPlan === 'pro' ? 'my-secret-link' : 'Pro only'}
                    disabled={userPlan !== 'pro'}
                    className="input !py-3.5 !text-xs !bg-white/[0.02] border-white/[0.1] disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">IP Whitelist</label>
                  <input
                    value={allowedIp}
                    onChange={(e) => setAllowedIp(e.target.value)}
                    placeholder={userPlan === 'pro' ? 'Allow specific IP...' : 'Pro only'}
                    disabled={userPlan !== 'pro'}
                    className="input !py-3.5 !text-xs !bg-white/[0.02] border-white/[0.1] disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-[11px] text-destructive animate-fade-in-up font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {isLoading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
                    <div className="bg-accent h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading || (!secretText && files.length === 0)}
                className="w-full !py-5 bg-accent text-white rounded-2xl font-bold text-lg shadow-2xl shadow-accent/40 hover:bg-accent/90 transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                {isLoading ? 'Encrypting...' : 'Securely Drop Message'}
              </button>
            </div>
          </div>
        </div>

        <aside className="hidden lg:flex flex-col gap-6 w-full lg:w-2/5">
          <div className="bg-elevated border border-white/[0.05] rounded-[2rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mb-16" />
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Drop Security</h3>
            <div className="space-y-6">
              {[
                { title: 'Zero-Knowledge', desc: 'Even we can\'t read your message. It\'s encrypted before it leaves your device.', icon: Lock },
                { title: 'Auto-Purge', desc: 'Once revealed, the secret is wiped from our RAM and database instantly.', icon: Timer },
                { title: 'No Identity Needed', desc: 'You can drop secrets anonymously. We don\'t track your session or IP.', icon: User }
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/5 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10">
            <h4 className="text-xs font-bold text-accent mb-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Workspace Native
            </h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium italic">
              "Ilusion handles over 10,000 secure drops daily. All encryption follows the OpenPGP standard for browser-based security."
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

// Add User icon to imports
import { User, Zap } from 'lucide-react';
