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
} from 'lucide-react';

const EXPIRY_OPTIONS = [
  { label: '5 minutes', value: 5 / 60 },
  { label: '30 minutes', value: 0.5 },
  { label: '1 hour', value: 1 },
  { label: '4 hours', value: 4 },
  { label: '12 hours', value: 12 },
  { label: '1 day', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
];

const MAX_FILE_SIZE_GUEST = 50 * 1024 * 1024; // 50MB
const MAX_FILE_SIZE_PRO = 100 * 1024 * 1024; // 100MB

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

      // Step 1: If file exists, get presigned URL and upload
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

        // Upload to R2 directly
        const uploadRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
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

      // Step 2: Create the secret record
      const createRes = await fetch('/api/secrets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedContent: secretText || null,
          fileKey,
          fileName,
          fileSize,
          fileType,
          expiresInHours: expiryHours,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to create secret');
      }

      const { id } = await createRes.json();
      setUploadProgress(100);
      setGeneratedLink(`${window.location.origin}/secret/${id}`);
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
      // Fallback
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
    setGeneratedLink('');
    setError('');
    setCopied(false);
    setUploadProgress(0);
  };

  const FileIcon = file ? getFileIcon(file.type) : FileText;

  // Success state — show the generated link
  if (generatedLink) {
    return (
      <div className="noise-bg gradient-bg min-h-screen flex flex-col">
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Lock className="w-4 h-4 text-accent-light" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              ilusion<span className="text-accent-light">.io</span>
            </span>
          </Link>
        </nav>

        <main className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg animate-fade-in-up">
            <div className="glass rounded-2xl p-8 glow text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-success" />
              </div>

              <h2 className="text-2xl font-bold mb-2">Secret Created!</h2>
              <p className="text-muted-foreground mb-6">
                Share this link. It can only be viewed <strong className="text-foreground">once</strong>.
              </p>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 bg-background/60 rounded-lg px-4 py-3 font-mono text-sm text-accent-light truncate border border-border">
                  {generatedLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="shrink-0 w-11 h-11 rounded-lg bg-accent hover:bg-accent-light flex items-center justify-center transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>

              {copied && (
                <p className="text-sm text-success mb-4 animate-fade-in-up">
                  ✓ Link copied to clipboard
                </p>
              )}

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
                className="text-sm text-accent-light hover:text-accent transition-colors"
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
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <Lock className="w-4 h-4 text-accent-light" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ilusion<span className="text-accent-light">.io</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </nav>

      {/* Main Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Create a Secret
            </h1>
            <p className="text-muted-foreground">
              Your message will self-destruct after being viewed.
              {!isSignedIn && (
                <span className="block text-sm mt-1">
                  <Link href="/sign-in" className="text-accent-light hover:underline">Sign in</Link> to upload files up to 100MB.
                </span>
              )}
            </p>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6">
            {/* Secret Text Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Secret Message</label>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showSecret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <textarea
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                placeholder="Paste your password, API key, or sensitive message here..."
                rows={5}
                className={`w-full bg-background/60 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all resize-none font-mono ${
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
              <label className="text-sm font-medium text-foreground mb-2 block">
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
                      : 'border-border hover:border-muted-foreground/40 hover:bg-muted/10'
                  }`}
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="text-foreground font-medium">Click to upload</span> or drag and drop
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
                <div className="flex items-center gap-4 bg-background/60 border border-border rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <FileIcon className="w-5 h-5 text-accent-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="shrink-0 w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Expiration Selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Timer className="w-4 h-4 inline mr-1 -mt-0.5" />
                Expires After
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EXPIRY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExpiryHours(option.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      expiryHours === option.value
                        ? 'bg-accent text-white'
                        : 'bg-background/60 text-muted-foreground border border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-fade-in-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Upload Progress */}
            {isLoading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
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
              className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-light text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent/25"
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
            <p className="text-xs text-muted-foreground text-center">
              🔒 Your secret is encrypted and stored securely. It will be permanently destroyed after being read once.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
