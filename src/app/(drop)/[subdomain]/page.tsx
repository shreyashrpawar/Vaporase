import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import DropForm from './DropForm';

interface DropPageProps {
  params: Promise<{
    subdomain: string;
  }>;
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
