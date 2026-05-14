'use client';

import { useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateKey, encryptText, hashPassword } from '@/lib/crypto';
import { useAuth } from '@clerk/nextjs';

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

export default function DropForm({ profile }: { profile: any }) {
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
  const [alias, setAlias] = useState('');
  const [useAlias, setUseAlias] = useState(false);
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
      let decryptionKey: string | null = null;
      
      // 1. Client-Side Encryption (Skip if using Custom Alias for a clean link)
      const isE2EE = !!secretText && !useAlias;
      
      if (isE2EE) {
        decryptionKey = await generateKey();
        finalEncryptedContent = await encryptText(secretText, decryptionKey);
      } else {
        finalEncryptedContent = secretText || null;
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
          isE2EE, // True if we encrypted text
          recipientId: profile.userId, // Send to the profile owner
          dropKey: decryptionKey, // Store key on server for recipient (null if not E2EE)
          alias: useAlias && alias ? alias : null,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to drop secret');
      }

      const { id } = await createRes.json();
      setUploadProgress(100);
      
      let link = `${window.location.origin}/s/${(useAlias && alias) ? alias : id}`;
      if (decryptionKey && !useAlias) {
        link = `${window.location.origin}/secret/${id}#key=${decryptionKey}`;
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

              <h2 className="text-2xl font-bold mb-2 text-foreground">Secret Dropped!</h2>
              <p className="text-muted-foreground mb-6">
                Your message has been securely deposited in <strong className="text-foreground">{profile.displayName}</strong>'s inbox.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 font-mono text-sm text-accent truncate border border-border">
                  {generatedLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="shrink-0 w-11 h-11 rounded-xl bg-accent hover:bg-accent-light flex items-center justify-center transition-all hover:shadow-lg hover:shadow-accent/20"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>

              {copied && (
                <p className="text-sm text-success font-medium mb-4 animate-fade-in-up">
                  ✓ Link copied to clipboard
                </p>
              )}

              <div className="flex justify-center mb-6 bg-white p-4 rounded-xl border border-border inline-block mx-auto">
                <QRCodeSVG value={generatedLink} size={150} level="M" includeMargin={true} />
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
                Drop another secret →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/10 text-xs font-medium text-accent mb-4 uppercase tracking-wider">
              Secure Drop
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-foreground">
              Drop a secret for {profile.displayName}
            </h1>
            <p className="text-muted-foreground">
              Your message will be E2E encrypted and delivered directly to their private inbox.
            </p>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6">
            {/* Secret Text Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">Secret Message</label>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                  {showSecret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder="Paste your password, API key, or sensitive message here..."
                rows={5}
                className={`w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all resize-none font-mono ${
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
                      ? 'border-accent bg-accent/5'
                      : 'border-slate-200 hover:border-accent/40 hover:bg-indigo-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5 text-accent" />
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
                <div className="flex items-center gap-4 bg-slate-50 border border-border rounded-xl px-4 py-3">
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
                    className="shrink-0 w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Custom Alias (Free & Always Visible) */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div>
                  <label className="text-sm font-semibold text-foreground">Use Custom Alias</label>
                  <p className="text-[11px] text-muted-foreground">Creates a clean link without a key fragment.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseAlias(!useAlias)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${useAlias ? 'bg-accent' : 'bg-slate-200 border border-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${useAlias ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {useAlias && (
                <div className="p-4 pt-0 border-t border-slate-100">
                  <div className="mt-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Custom URL Alias</label>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="e.g. for-shreyash"
                      className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
                    />
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Link: {typeof window !== 'undefined' ? window.location.origin : ''}/s/<span className="text-accent font-medium">{alias || 'your-alias'}</span>
                    </p>
                  </div>
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
                        ? 'bg-accent text-white shadow-sm shadow-accent/20'
                        : 'bg-slate-50 text-muted-foreground border border-border hover:border-accent/30 hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="border-t border-border pt-4">
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
                      className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40"
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
                      className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-destructive animate-fade-in-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Upload Progress */}
            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
              className="w-full py-4 rounded-2xl bg-accent hover:bg-accent-light text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Encrypt & Drop
                </>
              )}
            </button>
            
            {/* Info */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              🔒 Encrypted with AES-GCM. {profile.displayName} will be the only one who can decrypt it.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
