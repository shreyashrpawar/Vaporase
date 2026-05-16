import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Plans',
  description: 'Choose the right security plan for your needs. From free E2EE sharing to Pro features like password protection, IP restrictions, and API access.',
  keywords: ['secure sharing pricing', 'pro security features', 'API access plans', 'business encryption'],
  openGraph: {
    title: 'Ilusion Pricing | Secure Sharing for Everyone',
    description: 'Affordable security plans for teams and individuals.',
  }
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
