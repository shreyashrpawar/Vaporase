import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import DropForm from './DropForm';

interface DropPageProps {
  params: {
    subdomain: string;
  };
}

export default async function DropPage({ params }: DropPageProps) {
  const { subdomain } = params;

  // Verify profile exists
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.subdomain, subdomain),
  });

  if (!profile) {
    notFound();
  }

  // Require auth to drop (no anonymous)
  const { userId } = await auth();
  if (!userId) {
    // We could show a nice sign-in prompt, but redirecting to sign-in is standard
    redirect('/sign-in');
  }

  return <DropForm profile={profile} />;
}
