import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a Secret',
  description: 'Generate a self-destructing link for your sensitive text or files. No account required.',
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
