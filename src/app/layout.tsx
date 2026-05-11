import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ilusion | Secure & Ephemeral Secret Sharing',
  description: 'Share passwords, files, and keys securely with self-destructing links. End-to-end encrypted. Zero trace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#18181b',
          colorInputBackground: '#27272a',
          colorInputText: '#fafafa',
          borderRadius: '0.75rem',
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.className} bg-[#09090b] text-zinc-100 min-h-screen selection:bg-indigo-500/30 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
