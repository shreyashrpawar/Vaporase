import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Understand the terms governing your use of Ilusion. Learn about acceptable use, subscription policies, and our zero-knowledge ephemeral service rules.',
  keywords: ['terms of service', 'user agreement', 'acceptable use policy', 'ephemeral service terms'],
  openGraph: {
    title: 'Terms of Service | Ilusion',
    description: 'Read the terms of service for sharing secrets securely using Ilusion.',
  }
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
