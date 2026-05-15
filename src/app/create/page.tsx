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
import { generateKey, encryptText, hashPassword } from '@/lib/crypto';
import { saveLocalSecret, getLocalSecrets, LocalSecret } from '@/lib/local-history';

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
  const [localHistory, setLocalHistory] = useState<LocalSecret[]>([]);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
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

  useEffect(() => {
    setLocalHistory(getLocalSecrets());
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data.plan) {
            setUserPlan(data.plan);
          }
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

      // E2EE — always encrypt text
      const isE2EE = !!secretText;
      let finalEncryptedContent = null;
      let decryptionKey: string | null = null;

      if (isE2EE) {
        decryptionKey = await generateKey();
        finalEncryptedContent = await encryptText(secretText, decryptionKey);
      } else {
        finalEncryptedContent = null;
      }

      // Hash Password if provided (Pro only — enforced client & server)
      let finalPasswordHash = null;
      if (password && userPlan === 'pro') {
        finalPasswordHash = await hashPassword(password);
      }

      const createRes = await fetch('/api/secrets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedContent: finalEncryptedContent,
          fileKey,
          fileName,
          fileSize,
          fileType,
          expiresInHours: expiryHours,
          passwordHash: finalPasswordHash,
          allowedIp: (allowedIp && userPlan === 'pro') ? allowedIp : null,
          alias: (alias && userPlan === 'pro') ? alias : null,
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
      let link = `${window.location.origin}/secret/${(alias && userPlan === 'pro') ? alias : id}`;
      if (decryptionKey) {
        link += `#key=${decryptionKey}`;
      }
      setGeneratedLink(link);

      // Save to local history
      const label = files.length > 0
        ? `${files.length} file(s): ${files.map(f => f.name).join(', ').slice(0, 40)}`
        : secretText.slice(0, 30) + (secretText.length > 30 ? '...' : '');
      saveLocalSecret({
        id,
        link,
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
    setExpiryHours(24);
    setPassword('');
    setAllowedIp('');
    setGeneratedLink('');
    setContentType('text');
    setError('');
    setCopied(false);
    setUploadProgress(0);
  };




  return (
    <div className="dot-grid min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* AEO: HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Send a Secure Secret with Ilusion",
            "description": "Step-by-step guide to encrypting and sharing ephemeral secrets safely.",
            "step": [
              { "@type": "HowToStep", "text": "Enter your secret text or upload a file." },
              { "@type": "HowToStep", "text": "Set security options like password protection and expiry." },
              { "@type": "HowToStep", "text": "Generate a unique, encrypted link to share." }
            ]
          })
        }}
      />

      {/* ═══ Left Sidebar: Guidance & Trust ═══ */}
      <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-r border-white/[0.05] p-8 space-y-12" style={{ background: 'var(--bg-elevated)' }}>
        <Link href="/" className="flex items-center gap-3 group mb-8">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-lg font-bold tracking-tight">ilusion<span className="text-accent">.io</span></span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-accent mb-4">Security Guide</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-accent shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Zero-Knowledge:</strong> We never see your unencrypted data. Encryption happens entirely in your browser.
                </p>
              </div>
              <div className="flex gap-3">
                <Zap className="w-5 h-5 text-accent shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Burn-on-Read:</strong> Secrets are automatically purged from our database the moment they are revealed.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold">Pro Tip</h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Use a <strong>Custom Alias</strong> to create branded links like <code className="text-accent">ilusion.io/secret/finance-report</code>.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-white/[0.05]">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace
          </Link>
        </div>
      </aside>

      {/* ═══ Main Creation Area ═══ */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto custom-scrollbar">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-white/[0.05] flex items-center justify-between">
          <Link href="/" className="font-bold">ilusion.io</Link>
          <Link href="/dashboard" className="text-xs font-bold text-accent">Dashboard</Link>
        </div>

        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 lg:py-24">
          {!generatedLink ? (
            <div className="space-y-12 animate-fade-in-up">
              <header className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-foreground lg:text-5xl">
                  Create a <span className="text-accent">Secret</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium">
                  Securely share encrypted text or files with anyone.
                </p>
              </header>

              <div className="space-y-10">
                {/* 1. Content Type */}
                <section className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">1</div>
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Define Content</h2>
                  </div>

                  <div 
                    className={`relative rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 ${
                      isDragging ? 'border-accent bg-accent/5 scale-[1.01] shadow-2xl shadow-accent/20' : 'border-white/[0.05] bg-white/[0.01]'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      const dropped = Array.from(e.dataTransfer.files);
                      if (dropped.length) addFiles(dropped);
                    }}
                  >
                    {files.length === 0 && contentType === 'text' ? (
                      /* Text mode */
                      <div className="relative group">
                        <textarea
                          value={secretText}
                          onChange={(e) => setSecretText(e.target.value)}
                          placeholder="Type or paste your secret message..."
                          className="input min-h-[240px] !py-8 !px-8 !text-lg !font-mono !bg-transparent !border-none focus:ring-0 transition-all resize-none"
                        />
                        <div className="absolute bottom-6 right-6 flex items-center gap-4">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-all"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Attach File
                          </button>
                          <div className="badge badge-accent !text-[9px] opacity-50">E2EE Active</div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      /* File mode — multi-file list */
                      <div className="p-6 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            {files.length} file{files.length !== 1 ? 's' : ''} attached
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatBytes(totalFilesSize)} / {formatBytes(maxTotalSize)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {files.map((f, i) => {
                            const FileIcon = getFileIcon(f.type);
                            return (
                              <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
                                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                  <FileIcon className="w-4 h-4 text-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate">{f.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</p>
                                </div>
                                <button
                                  onClick={() => removeFile(i)}
                                  className="w-7 h-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                                >
                                  <X className="w-3.5 h-3.5 text-destructive" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-3 border-2 border-dashed border-white/[0.1] hover:border-accent/50 rounded-2xl text-xs font-bold text-muted-foreground hover:text-accent transition-all flex items-center justify-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5" /> Add More Files
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* 2. Security Options */}
                <section className="space-y-6 pt-6 border-t border-white/[0.05]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">2</div>
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Security Settings</h2>
                  </div>

                  {/* Expiry — free for everyone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Expires After</label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(Number(e.target.value))}
                      className="input !bg-white/[0.02] border-white/[0.1]"
                    >
                      {EXPIRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  {/* Pro-only controls */}
                  <div className="p-6 rounded-3xl bg-accent/5 border border-accent/10 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" />
                        <h3 className="text-xs font-bold tracking-tight text-foreground">Pro Security Controls</h3>
                      </div>
                      {userPlan !== 'pro' && (
                        <Link href="/pricing" className="badge badge-accent text-[9px] px-3 py-1">Unlock Pro</Link>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Password */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={userPlan === 'pro' ? 'Lock with key...' : 'Pro only'}
                            disabled={userPlan !== 'pro'}
                            className="input !py-2 !text-xs !bg-white/[0.02] !pr-10 disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                          {userPlan === 'pro' && (
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* IP Whitelist */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">IP Whitelist</label>
                        <input
                          value={allowedIp}
                          onChange={(e) => setAllowedIp(e.target.value)}
                          placeholder={userPlan === 'pro' ? 'e.g. 192.168.1.1' : 'Pro only'}
                          disabled={userPlan !== 'pro'}
                          className="input !py-2 !text-xs !bg-white/[0.02] disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Custom Alias */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Custom Alias</label>
                        <input
                          value={alias}
                          onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder={userPlan === 'pro' ? 'my-secret' : 'Pro only'}
                          disabled={userPlan !== 'pro'}
                          className="input !py-2 !text-xs !bg-white/[0.02] disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-fade-in-up">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Upload Progress */}
                {isLoading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {uploadProgress < 100 ? 'Encrypting & Uploading...' : 'Finalizing...'}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || (!secretText && files.length === 0)}
                  className="w-full !py-5 bg-accent text-white rounded-2xl font-bold text-lg shadow-2xl shadow-accent/40 hover:bg-accent/90 transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                  {isLoading ? 'Encrypting & Uploading...' : 'Generate Secure Link'}
                </button>

              </div>
            </div>
          ) : (
            /* Result Screen */
            <div className="max-w-xl mx-auto space-y-10 animate-fade-in">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-4xl font-black">Secret <span className="text-success">Live</span></h2>
                <p className="text-muted-foreground font-medium">Your ephemeral link is ready to be shared.</p>
              </div>

              <div className="card gradient-border p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Encrypted Link</label>
                  <div className="relative group">
                    <input
                      readOnly
                      value={generatedLink}
                      className="input !py-4 !pr-32 !text-sm font-mono !bg-white/[0.03] border-white/[0.1] truncate"
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

                <div className="flex flex-col items-center gap-6 p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                  <QRCodeSVG value={generatedLink} size={160} bgColor="transparent" fgColor="var(--text-primary)" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Scan to view on mobile</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={resetForm} className="btn-secondary !py-4 font-bold rounded-2xl">
                  Create Another
                </button>
                <Link href="/dashboard/secrets" className="btn-primary !py-4 font-bold rounded-2xl">
                  Manage Secrets
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══ Right Sidebar: Secure Inbox Upsell (Guest Focused) ═══ */}
      {!isSignedIn && (
        <aside className="hidden xl:flex w-80 flex-col border-l border-white/[0.05] p-8" style={{ background: 'var(--bg-elevated)' }}>
          <div className="mt-24 space-y-8">
            <div className="p-6 rounded-3xl bg-accent/5 border border-accent/10 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Inbox className="w-6 h-6 text-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold">Want a Permanent Inbox?</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Create a free account to get your own <strong>Secure Drop Link</strong>. People can send you secrets directly without you asking.
                </p>
              </div>
              <Link href="/sign-up" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-white/90 transition-all">
                Get Your Inbox
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-2">Recent Innovations</h4>
              <div className="space-y-3">
                {[
                  { title: 'AES-256 GCM', desc: 'Military-grade encryption standard.' },
                  { title: 'Zero-Trace', desc: 'No logs, no cookies, no tracking.' }
                ].map(item => (
                  <div key={item.title} className="p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/[0.05]">
                    <h5 className="text-[11px] font-bold mb-1">{item.title}</h5>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
