import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Developer API Reference & Integration Guide',
  description: 'Learn how to integrate the Ilusion developer API to programmatically generate self-destructing, encrypted secrets and secure link sharing within your own workflows.',
  keywords: ['developer api', 'secret sharing api', 'ephemeral link api', 'E2EE api integration'],
  openGraph: {
    title: 'Developer API Reference & Integration Guide | Ilusion',
    description: 'Programmatically create and manage encrypted ephemeral secrets with the Ilusion API.',
  }
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
