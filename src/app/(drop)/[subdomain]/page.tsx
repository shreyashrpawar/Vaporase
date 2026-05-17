import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import DropForm from './DropForm';
import type { Metadata } from 'next';

interface DropPageProps {
  params: Promise<{
    subdomain: string;
  }>;
}

export async function generateMetadata({ params }: DropPageProps): Promise<Metadata> {
  const { subdomain } = await params;
  
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.subdomain, subdomain),
  });

  if (!profile) {
    return {
      title: 'Secure Dropbox Not Found',
    };
  }

  const name = profile.displayName || subdomain;
  return {
    title: `Drop a Secure Secret to ${name}`,
    description: `Send encrypted messages and files directly to ${name}'s secure inbox. Zero-knowledge end-to-end encrypted sharing by Ilusion.`,
    openGraph: {
      title: `Drop a Secure Secret to ${name} | Ilusion`,
      description: `Send encrypted secrets to ${name}'s secure, ephemeral inbox. E2EE client-side security.`,
    }
  };
}

export default async function DropPage({ params }: DropPageProps) {
  const { subdomain } = await params;

  // Verify profile exists
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.subdomain, subdomain),
  });

  if (!profile) {
    notFound();
  }

  // Authenticated users are welcome, but guests can drop too
  return <DropForm profile={profile} />;
}
