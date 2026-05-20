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
    default: 'Ilusion | Secure E2EE Secret Sharing & Ephemeral Links',
    template: '%s | Ilusion'
  },
  description: 'Share passwords, credentials, and sensitive files securely using self-destructing, E2EE links. Zero-knowledge architecture with AES-256 encryption. Perfect for teams needing to send sensitive data without leaving a trace.',
  keywords: [
    'secure secret sharing', 
    'self-destructing links', 
    'one-time secret link',
    'one time password link',
    'Privnote alternative',
    'secure link generator',
    'share dotenv securely',
    'end-to-end encrypted file sharing', 
    'send passwords securely', 
    'zero-knowledge encryption', 
    'ephemeral message links', 
    'burn on read secrets',
    'privacy tools for teams',
    'AES-256 file transfer'
  ],
  authors: [{ name: 'Ilusion Security' }],
  creator: 'Ilusion',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ilusion.io',
    siteName: 'Ilusion',
    title: 'Ilusion | Secure E2EE Secret Sharing & Ephemeral Links',
    description: 'Share sensitive data with E2EE links that vanish forever after being read. No-trace, zero-knowledge security.',
    images: [
      {
        url: 'https://ilusion.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ilusion - Secure E2EE Sharing'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ilusion | Secure E2EE Secret Sharing',
    description: 'The safest way to share passwords and files. Self-destructing E2EE links with zero trace.',
    images: ['https://ilusion.io/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'security',
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
