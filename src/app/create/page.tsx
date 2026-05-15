'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
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
  const [file, setFile] = useState<File | null>(null);
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
  const [useAlias, setUseAlias] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localHistory, setLocalHistory] = useState<LocalSecret[]>([]);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [contentType, setContentType] = useState<'text' | 'file'>('text');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const maxFileSize = userPlan === 'pro' ? 100 * 1024 * 1024 : MAX_FILE_SIZE_GUEST;

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        if (droppedFile.size > maxFileSize) {
          setError(`File exceeds the ${formatBytes(maxFileSize)} limit.`);
          return;
        }
        setFile(droppedFile);
        setError('');
      }
    },
    [maxFileSize]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > maxFileSize) {
        setError(`File exceeds the ${formatBytes(maxFileSize)} limit.`);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!secretText && !file) {
      setError('Please enter a secret message or upload a file.');
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      let fileKey = null;
      let fileName = null;
      let fileSize = null;
      let fileType = null;

      if (file) {
        setUploadProgress(10);

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
        setUploadProgress(35);

        // Use XMLHttpRequest to track progress
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', actualFileType);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 40; // 40% of the total progress bar (from 30% to 70%)
              setUploadProgress(30 + percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload. This might be a CORS issue or connection drop.'));
          xhr.send(file);
        });

        fileKey = key;
        fileName = file.name;
        fileSize = file.size;
        fileType = actualFileType;
        setUploadProgress(70);
      }

      // 1. Client-Side Encryption (Skip if using Custom Alias)
      const isE2EE = !!secretText && !useAlias;
      let finalEncryptedContent = null;
      let decryptionKey: string | null = null;

      if (isE2EE) {
        decryptionKey = await generateKey();
        finalEncryptedContent = await encryptText(secretText, decryptionKey);
      } else {
        finalEncryptedContent = secretText || null;
      }

      // 2. Hash Password if provided
      let finalPasswordHash = null;
      if (password) {
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
          allowedIp: allowedIp || null,
          alias: useAlias && alias ? alias : null,
          isE2EE, // True if we encrypted text
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to create secret');
      }

      const { id } = await createRes.json();
      setUploadProgress(100);
      let link = `${window.location.origin}/s/${(useAlias && alias) ? alias : id}`;
      if (decryptionKey) {
        link += `#key=${decryptionKey}`;
      }
      setGeneratedLink(link);

      // Save to local history
      saveLocalSecret({
        id,
        link,
        createdAt: Date.now(),
        expiresAt: Date.now() + expiryHours * 60 * 60 * 1000,
        label: fileName || (secretText ? secretText.slice(0, 30) + (secretText.length > 30 ? '...' : '') : 'Secret'),
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
    setFile(null);
    setExpiryHours(24);
    setPassword('');
    setAllowedIp('');
    setGeneratedLink('');
    setError('');
    setCopied(false);
    setUploadProgress(0);
  };

  const FileIcon = file ? getFileIcon(file.type) : FileText;



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
              Use a <strong>Custom Alias</strong> to create branded links like <code className="text-accent">ilusion.io/s/finance-report</code>.
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

                  <div className="flex p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl mb-6">
                    <button
                      onClick={() => setContentType('text')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                        contentType === 'text' ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <FileText className="w-4 h-4" /> Text Message
                    </button>
                    <button
                      onClick={() => setContentType('file')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                        contentType === 'file' ? 'bg-accent text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Upload className="w-4 h-4" /> Secure File
                    </button>
                  </div>

                  {contentType === 'text' ? (
                    <div className="relative group">
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="badge badge-accent !text-[9px]">E2EE Active</div>
                      </div>
                      <textarea
                        value={secretText}
                        onChange={(e) => setSecretText(e.target.value)}
                        placeholder="Paste your sensitive data here..."
                        className="input min-h-[200px] !py-6 !px-6 !text-lg !font-mono !bg-white/[0.02] border-white/[0.1] focus:border-accent/50 transition-all resize-none"
                      />
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                      className={`relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center gap-4 ${
                        isDragging ? 'border-accent bg-accent/5' : 'border-white/[0.1] hover:border-white/[0.2] bg-white/[0.01]'
                      }`}
                    >
                      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-accent" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">
                          {file ? file.name : 'Drop your file here'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Max size: 100MB'}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. Security Options */}
                <section className="space-y-6 pt-6 border-t border-white/[0.05]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">2</div>
                    <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Security Settings</h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
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

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Password (Optional)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Add extra layer..."
                          className="input !bg-white/[0.02] border-white/[0.1] !pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pro Features */}
                  <div className="p-6 rounded-3xl bg-accent/5 border border-accent/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-accent" />
                        <h3 className="text-xs font-bold">Advanced Controls</h3>
                      </div>
                      {userPlan === 'free' && <Link href="/pricing" className="badge badge-accent">Unlock Pro</Link>}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Custom Alias</label>
                        <input
                          value={alias}
                          onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="ilusion.io/s/..."
                          className="input !py-2 !text-xs !bg-white/[0.02]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">IP Whitelist</label>
                        <input
                          value={allowedIp}
                          onChange={(e) => setAllowedIp(e.target.value)}
                          placeholder="Allow specific IP..."
                          className="input !py-2 !text-xs !bg-white/[0.02]"
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
                  disabled={isLoading || (contentType === 'text' ? !secretText : !file)}
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
