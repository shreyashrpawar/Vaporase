import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ilusion | Secure & Ephemeral Secret Sharing',
  description: 'Share passwords, files, and keys securely with self-destructing links.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen selection:bg-indigo-500/30`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
