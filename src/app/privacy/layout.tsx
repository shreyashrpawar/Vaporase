import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Ilusion Privacy Policy. Discover how we protect your security through zero-knowledge encryption, zero logging, and ephemeral data policies.',
  keywords: ['privacy policy', 'data security policy', 'zero-knowledge privacy', 'ephemeral storage terms'],
  openGraph: {
    title: 'Privacy Policy | Ilusion',
    description: 'Learn about our strict commitment to zero-knowledge privacy and data minimization.',
  }
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
