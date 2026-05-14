import { redirect } from 'next/navigation';

export default async function AliasRedirectPage({ params }: { params: Promise<{ alias: string }> }) {
  const resolvedParams = await params;
  redirect(`/secret/${resolvedParams.alias}`);
}
