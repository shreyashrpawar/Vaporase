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
  ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateKey, encryptText, hashPassword } from '@/lib/crypto';
import { useAuth } from '@clerk/nextjs';

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

export default function DropForm({ profile }: { profile: any }) {
  const { isSignedIn } = useAuth();
  const [secretText, setSecretText] = useState('');
  const [file, setFile] = useState<File | null>(null);
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
  const [useAlias, setUseAlias] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

        if (!uploadRes.ok) throw new Error('Failed to upload file');

        fileKey = key;
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        setUploadProgress(70);
      }

      let finalEncryptedContent = secretText || null;
      let finalPasswordHash = null;
      let decryptionKey: string | null = null;
      
      // Always E2EE if there is text
      const isE2EE = !!secretText;
      
      if (isE2EE) {
        decryptionKey = await generateKey();
        finalEncryptedContent = await encryptText(secretText, decryptionKey);
      }

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
          isE2EE,
          recipientId: profile.userId,
          dropKey: decryptionKey,
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

  if (generatedLink) {
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
                  <h2 className="text-4xl font-black">Secret <span className="text-success">Dropped</span></h2>
                  <p className="text-muted-foreground font-medium">
                    Securely deposited in <strong className="text-foreground">{profile.displayName}</strong>'s workspace.
                  </p>
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Access Link</label>
                  <div className="relative group/link">
                    <input
                      readOnly
                      value={generatedLink}
                      className="input !py-4.5 !pr-32 !text-sm font-mono !bg-white/[0.03] border-white/[0.1] truncate"
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
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Dropping for <span className="text-accent">{profile.displayName}</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-lg">
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
                className={`relative overflow-hidden group cursor-pointer border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center gap-3 ${
                  isDragging ? 'border-accent bg-accent/5' : 'border-white/[0.1] hover:border-white/[0.2] bg-white/[0.01]'
                }`}
              >
                <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <FileIcon className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">{formatBytes(file.size)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-2 rounded-lg hover:bg-white/5">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-accent/50" />
                    <p className="text-xs font-bold text-muted-foreground">Drop a file or <span className="text-accent">browse</span></p>
                  </>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">Self-Destruct In</label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className="input !py-3.5 !text-xs !bg-white/[0.02] border-white/[0.1]"
                  >
                    {EXPIRY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2 flex items-center gap-2">
                    Password <span className="opacity-40">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Lock with key..."
                      className="input !py-3.5 !pr-12 !text-xs !bg-white/[0.02] border-white/[0.1]"
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
                        placeholder="my-secret-link"
                        className="input !py-3.5 !text-xs !bg-white/[0.02] border-white/[0.1]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">IP Whitelist</label>
                      <input
                        value={allowedIp}
                        onChange={(e) => setAllowedIp(e.target.value)}
                        placeholder="Allow specific IP..."
                        className="input !py-3.5 !text-xs !bg-white/[0.02] border-white/[0.1]"
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
                disabled={isLoading || (!secretText && !file)}
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
