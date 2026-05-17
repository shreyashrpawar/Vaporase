import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us & Support',
  description: 'Have questions, feedback, or need support with your encrypted secrets? Reach out to the Ilusion team for secure data sharing assistance.',
  keywords: ['contact support', 'customer help desk', 'secure messaging assistance', 'Ilusion support'],
  openGraph: {
    title: 'Contact Us & Support | Ilusion',
    description: 'Get in touch with the Ilusion team. We are here to help you secure and share your data.',
  }
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
