import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reveal a Secure Secret',
  description: 'Enter your secure ID or alias to decrypt and view a secret. One-time access only. Secrets are permanently deleted after being read.',
  keywords: ['reveal secret', 'decrypt message', 'secure link access', 'one-time view'],
  openGraph: {
    title: 'Reveal a Secure Secret | Ilusion',
    description: 'Securely access and decrypt your shared message or file.',
  }
};

export default function ViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
