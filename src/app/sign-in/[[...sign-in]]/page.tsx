import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="dark dot-grid min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: '#09090b' }}>
      <Link href="/" className="flex items-center gap-2 mb-8 group transition-transform hover:scale-105">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20">
          <Lock className="w-5 h-5 text-accent" />
        </div>
        <span className="text-xl font-bold text-white">
          ilusion<span className="text-accent">.io</span>
        </span>
      </Link>
      
      <div className="w-full max-w-md">
        <SignIn 
          appearance={{ 
            baseTheme: dark,
            variables: {
              colorPrimary: '#818cf8',
              colorBackground: '#141416',
            },
            elements: {
              card: 'border border-white/5 shadow-2xl',
              headerTitle: 'text-2xl font-bold tracking-tight',
              headerSubtitle: 'text-zinc-400',
              socialButtonsBlockButton: 'border-white/10 hover:bg-white/5 transition-colors',
              formButtonPrimary: 'bg-indigo-500 hover:bg-indigo-600 border-none h-11',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300',
              dividerLine: 'bg-white/10',
              dividerText: 'text-zinc-500',
              formFieldLabel: 'text-zinc-300',
              formFieldInput: 'bg-zinc-900 border-white/10 focus:border-indigo-500/50',
            }
          }} 
        />
      </div>
    </div>
  );
}
