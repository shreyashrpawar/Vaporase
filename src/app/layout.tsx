import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ClerkThemeWrapper } from '@/components/ClerkThemeWrapper';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://ilusion.io'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Ilusion | Secure & Ephemeral Secret Sharing',
    template: '%s | Ilusion'
  },
  description: 'Share passwords, files, and sensitive keys securely with self-destructing links. End-to-end encrypted. Zero trace left behind.',
  keywords: ['secure sharing', 'ephemeral', 'self-destructing links', 'encrypted file sharing', 'send passwords securely', 'privacy tool'],
  authors: [{ name: 'Ilusion' }],
  creator: 'Ilusion',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ilusion.io',
    siteName: 'Ilusion',
    title: 'Ilusion | Secure & Ephemeral Secret Sharing',
    description: 'Share sensitive data with links that vanish after being read.',
    images: [
      {
        url: 'https://ilusion.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ilusion - Secure Sharing'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ilusion | Secure & Ephemeral Secret Sharing',
    description: 'Share sensitive data with links that vanish after being read.',
    images: ['https://ilusion.io/og-image.png'],
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider>
          <ClerkThemeWrapper>
            {children}
            <Analytics />
          </ClerkThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
