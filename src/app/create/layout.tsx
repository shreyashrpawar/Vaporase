import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a Secure Secret',
  description: 'Encrypt your passwords, notes, and files with client-side AES-256. Generate a self-destructing link to share sensitive data securely.',
  keywords: ['encrypt passwords', 'secure file upload', 'self-destructing message', 'E2EE sharing'],
  openGraph: {
    title: 'Create a Secure Secret | Ilusion',
    description: 'Encrypt and share sensitive data with links that vanish after being read.',
  }
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
