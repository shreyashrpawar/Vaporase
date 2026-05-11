'use client';

import { useState, useRef, useCallback } from 'react';
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
  const [expiryHours, setExpiryHours] = useState(24);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="noise-bg gradient-bg min-h-screen flex flex-col">
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
              <Lock className="w-4.5 h-4.5 text-accent" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              ilusion<span className="text-accent">.io</span>
            </span>
          </Link>
        </nav>

        <main className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg animate-fade-in-up">
            <div className="glass rounded-2xl p-8 glow text-center">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>

              <h2 className="text-2xl font-bold mb-2 text-foreground">Secret Created!</h2>
              <p className="text-muted-foreground mb-6">
                Share this link. It can only be viewed <strong className="text-foreground">once</strong>.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 bg-white/[0.04] rounded-xl px-4 py-3 font-mono text-sm text-accent-light truncate border border-white/[0.08]">
                  {generatedLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="shrink-0 w-11 h-11 rounded-xl bg-accent hover:bg-accent-light flex items-center justify-center transition-all hover:shadow-lg hover:shadow-accent/30 border border-accent/50"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>

              {copied && (
                <p className="text-sm text-success font-medium mb-4 animate-fade-in-up">
                  ✓ Link copied to clipboard
                </p>
              )}

              <div className="flex justify-center mb-6 bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] inline-block mx-auto">
                <QRCodeSVG value={generatedLink} size={150} level="M" includeMargin={true} bgColor="transparent" fgColor="#a1a1aa" />
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
    <div className="noise-bg gradient-bg min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Lock className="w-4.5 h-4.5 text-accent-light" />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent-light mb-4 backdrop-blur-sm">
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

          <div className="glass rounded-2xl p-8 space-y-6 gradient-border">
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
                className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all resize-none font-mono ${
                  !showSecret && secretText ? 'text-security-disc' : ''
                }`}
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
                    isDragging
                      ? 'border-accent bg-accent/10'
                      : 'border-white/[0.08] hover:border-accent/40 hover:bg-accent/5'
                  }`}
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
                <div className="flex items-center gap-4 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
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
                {EXPIRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExpiryHours(option.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      expiryHours === option.value
                        ? 'bg-accent text-white shadow-sm shadow-accent/20 border border-accent/50'
                        : 'bg-white/[0.03] text-zinc-400 border border-white/[0.08] hover:border-accent/30 hover:text-zinc-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password..."
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">Restrict by IP Address</label>
                    <p className="text-xs text-muted-foreground mb-2">Only allow this exact IP address to view the secret.</p>
                    <input
                      type="text"
                      value={allowedIp}
                      onChange={(e) => setAllowedIp(e.target.value)}
                      placeholder="e.g., 192.168.1.1"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 font-mono"
                    />
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
              className="w-full py-4 rounded-2xl bg-accent hover:bg-accent-light text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:translate-y-0 border border-accent/50"
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
          </div>
        </div>
      </main>
    </div>
  );
}
