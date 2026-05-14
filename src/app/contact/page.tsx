'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen dot-grid flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* ═══ Nav ═══ */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}>
            <Lock className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            ilusion<span style={{ color: 'var(--accent-primary)' }}>.io</span>
          </span>
        </Link>
        <ThemeToggle />
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gradient">
            Get in touch
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            Have a question, feedback, or need help with your account? 
            We're here to help you secure your data.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-12 w-full animate-fade-in delay-100">
          {/* Info Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="card gradient-border p-6 h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1">Email Support</h3>
                    <p className="text-xs text-muted-foreground mb-1 italic">Direct contact for complex issues</p>
                    <a href="mailto:hello@ilusion.io" className="text-sm font-medium text-accent hover:underline">
                      hello@ilusion.io
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1">Community</h3>
                    <p className="text-xs text-muted-foreground mb-1 italic">Join our security discussions</p>
                    <a href="https://twitter.com/ilusion_io" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline">
                      @ilusion_io
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border/50">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Support is available 24/7 for Pro members. Standard support response time is typically under 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="card p-8 space-y-5 shadow-glow">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input !text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input !text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input !text-sm"
                  placeholder="How can we help?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input !text-sm !py-3 resize-none"
                  placeholder="Describe your inquiry in detail..."
                />
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20 text-success animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">Message sent! We'll get back to you soon.</p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full !py-4 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-6 max-w-6xl mx-auto w-full text-center">
        <p className="text-xs text-muted-foreground">
          Need urgent help? Email us directly at <a href="mailto:hello@ilusion.io" className="text-accent hover:underline font-bold">hello@ilusion.io</a>
        </p>
      </footer>
    </div>
  );
}
