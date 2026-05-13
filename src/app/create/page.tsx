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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localHistory, setLocalHistory] = useState<LocalSecret[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalHistory(getLocalSecrets());
  }, []);

  const maxFileSize = isSignedIn ? MAX_FILE_SIZE_PRO : MAX_FILE_SIZE_GUEST;

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

        const presignRes = await fetch('/api/secrets/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error || 'Failed to get upload URL');
        }

        const { url, fileKey: key } = await presignRes.json();
        setUploadProgress(30);

        const uploadRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload file');
        }

        fileKey = key;
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        setUploadProgress(70);
      }

      let finalEncryptedContent = secretText || null;
      let finalPasswordHash = null;
      let decryptionKey = null;

      // 1. Client-Side Encryption
      if (secretText) {
        decryptionKey = await generateKey();
        finalEncryptedContent = await encryptText(secretText, decryptionKey);
      }

      // 2. Hash Password if provided
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
          isE2EE: !!secretText, // True if we encrypted text
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to create secret');
      }

      const { id } = await createRes.json();
      setUploadProgress(100);
      let link = `${window.location.origin}/secret/${id}`;
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

  // Success state
  if (generatedLink) {
    return (
      <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
              <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              ilusion<span className="text-accent">.io</span>
            </span>
          </Link>
        </nav>

        <main className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg animate-fade-in-up">
            <div className="card gradient-border p-8 text-center" style={{ boxShadow: 'var(--shadow-glow)' }}>
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>

              <h2 className="text-2xl font-bold mb-2 text-foreground">Secret Created!</h2>
              <p className="text-muted-foreground mb-6">
                Share this link. It can only be viewed <strong className="text-foreground">once</strong>.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 rounded-xl px-4 py-3 font-mono text-sm truncate" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--accent-primary)' }}>
                  {generatedLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="btn-primary !w-11 !h-11 !p-0 !rounded-xl"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>

              {copied && (
                <p className="text-sm text-success font-medium mb-4 animate-fade-in-up">
                  ✓ Link copied to clipboard
                </p>
              )}

              <div className="flex justify-center mb-6 p-4 rounded-xl inline-block mx-auto" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)' }}>
                <QRCodeSVG value={generatedLink} size={150} level="M" includeMargin={true} bgColor="transparent" fgColor="var(--text-secondary)" />
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mb-6">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Expires in {EXPIRY_OPTIONS.find((o) => o.value === expiryHours)?.label || `${expiryHours}h`}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Burns on read
                </span>
              </div>

              <button
                onClick={resetForm}
                className="text-sm font-medium text-accent hover:text-accent-light transition-colors"
              >
                Create another secret →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dot-grid min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ilusion<span className="text-accent">.io</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </nav>

      {/* Main Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="badge badge-accent !py-1.5 !px-3 !text-[11px] mb-4 inline-flex">
              <Sparkles className="w-3.5 h-3.5" />
              Encrypted & Ephemeral
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-foreground">
              Create a Secret
            </h1>
            <p className="text-muted-foreground">
              Your message will self-destruct after being viewed.
              {!isSignedIn && (
                <span className="block text-sm mt-1">
                  <Link href="/sign-in" className="text-accent-light font-medium hover:underline">Sign in</Link> to upload files up to 100MB.
                </span>
              )}
            </p>
          </div>

          <div className="card gradient-border p-8 space-y-6">
            {/* Secret Text Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">Secret Message</label>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/[0.05]"
                >
                  {showSecret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder="Paste your password, API key, or sensitive message here..."
                rows={5}
                className={`input textarea ${!showSecret && secretText ? 'text-security-disc' : ''}`}
                style={
                  !showSecret && secretText
                    ? ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)
                    : undefined
                }
              />
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Attach File <span className="text-muted-foreground font-normal">(optional)</span>
              </label>

              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging ? 'drop-active' : ''
                  }`}
                  style={{ borderColor: isDragging ? undefined : 'var(--border-default)' }}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5 text-accent-light" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="text-foreground font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images, videos, documents up to {formatBytes(maxFileSize)}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.txt,.doc,.docx,.zip,.rar,.json,.csv,.xml"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-xl px-4 py-3" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)' }}>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FileIcon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="shrink-0 w-8 h-8 rounded-lg hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Expiration Selector */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">
                <Timer className="w-4 h-4 inline mr-1.5 -mt-0.5 text-accent" />
                Expires After
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EXPIRY_OPTIONS.map((option) => {
                  const isDisabled = !isSignedIn && option.value !== 5 / 60;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setExpiryHours(option.value)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        expiryHours === option.value
                          ? 'btn-primary !py-2.5 !px-3 !text-xs'
                          : isDisabled 
                            ? 'opacity-40 cursor-not-allowed filter grayscale'
                            : ''
                      }`}
                      style={expiryHours !== option.value ? { background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' } : {}}
                    >
                      {option.label}
                      {isDisabled && <Lock className="w-2.5 h-2.5 ml-1 inline-block opacity-60" />}
                    </button>
                  );
                })}
              </div>
              {!isSignedIn && (
                <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <Link href="/sign-up" className="text-accent hover:underline">Sign up</Link> to unlock flexible expiration times.
                </p>
              )}
            </div>

            {/* Advanced Options Toggle */}
            <div className="border-t border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 animate-fade-in-up">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Optional Password</label>
                    <p className="text-xs text-muted-foreground mb-2">Require a password to unlock the secret.</p>
                    {isSignedIn ? (
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a secure password..."
                        className="input"
                      />
                    ) : (
                      <div className="relative group">
                        <input
                          disabled
                          type="password"
                          placeholder="Sign in to add password protection"
                          className="input opacity-50 cursor-not-allowed pr-10"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Restrict by IP Address</label>
                    <p className="text-xs text-muted-foreground mb-2">Only allow this exact IP address to view the secret.</p>
                    {isSignedIn ? (
                      <input
                        type="text"
                        value={allowedIp}
                        onChange={(e) => setAllowedIp(e.target.value)}
                        placeholder="e.g., 192.168.1.1"
                        className="input !font-mono"
                      />
                    ) : (
                      <div className="relative group">
                        <input
                          disabled
                          type="text"
                          placeholder="Sign in to restrict by IP"
                          className="input !font-mono opacity-50 cursor-not-allowed pr-10"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 animate-fade-in-up">
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
                  {uploadProgress < 30
                    ? 'Preparing upload...'
                    : uploadProgress < 70
                    ? 'Uploading file...'
                    : uploadProgress < 100
                    ? 'Creating secret...'
                    : 'Done!'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!secretText && !file)}
              className="btn-primary w-full !py-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Generate Secret Link
                </>
              )}
            </button>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              🔒 Your secret is encrypted and stored securely. It will be permanently destroyed after being read once.
            </p>

            {/* Local History for Guests */}
            {localHistory.length > 0 && !isSignedIn && (
              <div className="mt-8 pt-6 border-t border-white/[0.06] animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Local Secrets</h3>
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {localHistory.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Created {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-accent transition-all" />
                    </Link>
                  ))}
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-4">
                  These links are only stored in your browser and will disappear when they expire.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
