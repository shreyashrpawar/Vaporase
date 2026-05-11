import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ThemeProvider } from '@/components/ThemeProvider';

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
          colorText: '#fafafa',
          colorTextSecondary: '#a1a1aa',
          borderRadius: '0.75rem',
        },
        elements: {
          userButtonPopoverCard: {
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
            zIndex: 99999,
          },
          userButtonPopoverActionButton: {
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          }
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} min-h-screen antialiased`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
