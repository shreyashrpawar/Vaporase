'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Upload,
  X,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Film,
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Settings,
  ArrowRight,
  User,
  Search,
} from 'lucide-react';
import { generateKey, encryptText, hashPassword, deriveKeyFromPassword } from '@/lib/crypto';
import { useAuth } from '@clerk/nextjs';
import { nanoid } from 'nanoid';

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

const MAX_FILE_SIZE_FREE = 50 * 1024 * 1024;
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

interface SendSecretFormProps {
  profile?: {
    userId: string;
    displayName: string;
    subdomain?: string;
  };
}

export default function SendSecretForm({ profile }: SendSecretFormProps) {
  const { isSignedIn } = useAuth();

  // Recipient state
  const [recipient, setRecipient] = useState<any>(profile || null);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Form state
  const [secretText, setSecretText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [password, setPassword] = useState('');
  const [allowedIp, setAllowedIp] = useState('');
  const [alias, setAlias] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('pro'); // Default to pro for feature access
  const [burnOnRead, setBurnOnRead] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the sender's plan
  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          // Force pro for UI
          setUserPlan('pro');
        })
        .catch(err => console.error('Error fetching profile:', err));
    } else {
      setUserPlan('pro');
    }
  }, [isSignedIn]);

  const maxTotalSize = userPlan === 'pro' ? MAX_FILE_SIZE_PRO : MAX_FILE_SIZE_FREE;
  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);
  const isPro = userPlan === 'pro';

  const handleRecipientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientQuery.trim()) return;
    setIsSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/profile/search?subdomain=${recipientQuery.trim().toLowerCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'User not found');
      setRecipient(data);
      setRecipientQuery('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // File handlers
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

  // Submit
  const handleSubmit = async () => {
    if (!secretText && files.length === 0) {
      setError('Please enter a message or attach at least one file.');
      return;
    }

    if (!burnOnRead && !password) {
      setError('Password is required when "Burn on View" is disabled.');
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload files
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

      // 1. Determine the ID/Salt
      const customId = (alias && userPlan === 'pro') ? alias : nanoid(8);
      const salt = customId;

      // 2. Encryption Strategy
      let encryptionKey: string;
      let includeKeyInHash = false;

      if (password && userPlan === 'pro') {
        // Password-based key derivation for speakable links
        encryptionKey = await deriveKeyFromPassword(password, salt);
        includeKeyInHash = false;
      } else {
        // Standard random key in URL fragment
        encryptionKey = await generateKey();
        includeKeyInHash = true;
      }

      const finalEncryptedContent = await encryptText(secretText, encryptionKey);
      const isE2EE = true;

      // Hash password for server-side auth
      let finalPasswordHash = null;
      if (password && userPlan === 'pro') {
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
          recipientId: recipient?.userId || null,
          dropKey: includeKeyInHash ? encryptionKey : null,
          alias: (alias && userPlan === 'pro') ? alias : null,
          burnOnRead,
          files: uploadedFiles,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to send secret');
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
    setAlias('');
    setGeneratedLink('');
    setError('');
    setCopied(false);
    setUploadProgress(0);
  };

  // ─── Success State ───
  if (generatedLink) {
    return (
      <div className="card p-8 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)' }}>
          <Check className="w-8 h-8" style={{ color: 'var(--success)' }} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{recipient ? 'Secret Delivered' : 'Secret Created'}</h3>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {recipient ? (
              <>Securely dropped into <span style={{ color: 'var(--text-primary)' }}>{recipient.displayName}</span>&apos;s inbox.</>
            ) : (
              <>Your secure self-destructing link is ready.</>
            )}
          </p>
        </div>
        <div className="relative group">
          <input
            readOnly
            value={generatedLink}
            className="input !py-3 !pr-24 !text-xs font-mono !bg-white/[0.02] truncate"
          />
          <button
            onClick={copyToClipboard}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: copied ? 'color-mix(in srgb, var(--success) 10%, transparent)' : 'var(--accent-subtle)',
              color: copied ? 'var(--success)' : 'var(--accent-primary)',
            }}
          >
            {copied ? <><Check className="w-3 h-3" />Done</> : <><Copy className="w-3 h-3" />Copy</>}
          </button>
        </div>
        <button onClick={resetForm} className="btn-primary w-full">
          Send Another
        </button>
      </div>
    );
  }

  // ─── Main Form ───
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6 sm:p-8 space-y-6">
        {/* 0. Recipient (Optional) */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-tertiary)' }}>
            Recipient (Optional)
          </label>
          
          {!recipient ? (
            <form onSubmit={handleRecipientSearch} className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <input
                type="text"
                placeholder="Search user to drop into inbox..."
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                className="input !pl-9 !bg-white/[0.02] border-white/[0.1] focus:border-accent/30"
              />
              {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-accent" />}
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-accent/20 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10">
                  <User className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{recipient.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">@{recipient.subdomain}</p>
                </div>
              </div>
              <button 
                onClick={() => setRecipient(null)}
                className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* 1. Message Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              Message Content
            </label>
            <button onClick={() => setShowSecret(!showSecret)} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>
              {showSecret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            value={secretText}
            onChange={(e) => setSecretText(e.target.value)}
            placeholder="Type or paste your secret message..."
            className={`input min-h-[140px] !py-5 !px-5 !bg-white/[0.02] resize-none font-mono text-sm ${!showSecret && secretText ? 'text-security-disc' : ''}`}
            style={!showSecret && secretText ? { WebkitTextSecurity: 'disc' } as any : undefined}
          />
        </div>

        {/* 2. File Attachments */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-5 transition-all ${
            isDragging
              ? 'border-[var(--accent-primary)] scale-[1.01]'
              : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
          }`}
          style={{ background: isDragging ? 'color-mix(in srgb, var(--accent-primary) 5%, transparent)' : 'var(--surface-overlay)' }}
        >
          <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />

          {files.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                  {files.length} file{files.length !== 1 ? 's' : ''} attached
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {formatBytes(totalFilesSize)} / {formatBytes(maxTotalSize)}
                </span>
              </div>
              {files.map((f, i) => {
                const Icon = getFileIcon(f.type);
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-subtle)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-subtle)' }}>
                      <Icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatBytes(f.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)' }}
                    >
                      <X className="w-3.5 h-3.5" style={{ color: 'var(--destructive)' }} />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="w-full py-2 border-2 border-dashed rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}
              >
                <Upload className="w-3 h-3" /> Add More Files
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
              <Upload className="w-6 h-6" style={{ color: 'var(--accent-muted)' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Attach files</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Up to {formatBytes(maxTotalSize)} total</p>
              </div>
            </div>
          )}
        </div>

        {/* 3. Security Settings */}
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Expiry */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-tertiary)' }}>Self-Destruct</label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="input !py-2.5 !text-xs !bg-white/[0.02]"
              >
                {EXPIRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {/* Password (Pro) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest ml-1 flex items-center justify-between" style={{ color: 'var(--text-tertiary)' }}>
                <span>Password</span>
                {!burnOnRead && <span className="text-[8px] text-accent">Required for persistent links</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={!burnOnRead ? "Required password..." : "Lock with key..."}
                  className={`input !py-2.5 !text-xs !bg-white/[0.02] !pr-10 ${!burnOnRead && !password ? 'border-accent/50' : ''}`}
                />
                {isPro && (
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }}>
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Burn on View Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Burn on View</p>
                {!burnOnRead && <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20 font-bold">Multiple Views Enabled</span>}
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
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
              className={`w-10 h-5 rounded-full transition-all relative ${burnOnRead ? 'bg-accent' : 'bg-slate-200 dark:bg-white/10'}`}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${burnOnRead ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Advanced Controls (Pro) */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ml-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Settings className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            Advanced Controls
          </button>

          {showAdvanced && (
            <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-tertiary)' }}>Custom Alias</label>
                <input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-secret-link"
                  className="input !py-2.5 !text-xs !bg-white/[0.02]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest ml-1" style={{ color: 'var(--text-tertiary)' }}>IP Whitelist</label>
                <input
                  value={allowedIp}
                  onChange={(e) => setAllowedIp(e.target.value)}
                  placeholder="192.168.1.1"
                  className="input !py-2.5 !text-xs !bg-white/[0.02]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold" style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--destructive)', border: '1px solid color-mix(in srgb, var(--destructive) 20%, transparent)' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Upload Progress */}
        {isLoading && uploadProgress > 0 && (
          <div className="space-y-1.5">
            <div className="w-full rounded-full h-1 overflow-hidden" style={{ background: 'var(--surface-overlay)' }}>
              <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress}%`, background: 'var(--accent-primary)' }} />
            </div>
            <p className="text-[10px] text-center" style={{ color: 'var(--text-tertiary)' }}>
              {uploadProgress < 100 ? 'Encrypting & uploading...' : 'Finalizing...'}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!secretText && files.length === 0)}
          className="btn-primary w-full !py-4 group"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
          {isLoading ? 'Sending...' : (recipient ? 'Securely Drop' : 'Create Secret')}
          {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </div>
  );
}
