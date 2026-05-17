import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reveal Secure Secret',
  description: 'Decrypt and view a secure, end-to-end encrypted ephemeral message or file shared via Ilusion.',
  robots: {
    index: false,
    follow: false,
  }
};

export default function SecretViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
