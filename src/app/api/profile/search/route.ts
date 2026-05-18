import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get('subdomain');
    const query = searchParams.get('query');

    if (query) {
      const q = query.toLowerCase();
      const results = await db.select()
        .from(userProfiles)
        .where(
          or(
            like(userProfiles.subdomain, `%${q}%`),
            like(userProfiles.displayName, `%${q}%`)
          )
        )
        .limit(5);
      return NextResponse.json(results);
    }

    if (!subdomain) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.subdomain, subdomain.toLowerCase()),
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
