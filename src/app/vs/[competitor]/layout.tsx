import type { Metadata } from 'next';

const COMPETITORS: Record<string, { name: string; headline: string; description: string }> = {
  '1password-send': {
    name: '1Password Send',
    headline: '1Password Send Alternative',
    description: 'Looking for a more lightweight, ephemeral way to share secrets without the enterprise overhead? Discover why Ilusion is the best free alternative.'
  },
  'firefox-send': {
    name: 'Firefox Send',
    headline: 'Firefox Send Successor',
    description: 'Since Firefox Send was discontinued, users have been searching for a secure alternative. Discover why Ilusion is the ultimate modern successor.'
  },
  'bitwarden-send': {
    name: 'Bitwarden Send',
    headline: 'Bitwarden Send Alternative',
    description: 'Bitwarden is great for passwords, but Ilusion is built specifically for ephemeral sharing, zero-knowledge security, and secure guest drops.'
  }
};

type Props = {
  params: Promise<{ competitor: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const comp = COMPETITORS[resolvedParams.competitor] || COMPETITORS['1password-send'];
  
  return {
    title: `${comp.headline} | Secure E2EE Sharing`,
    description: comp.description,
    openGraph: {
      title: `${comp.headline} | Ilusion`,
      description: comp.description,
    }
  };
}

export default function CompetitorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
