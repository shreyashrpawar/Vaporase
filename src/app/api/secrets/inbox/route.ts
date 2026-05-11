import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch secrets dropped into this user's inbox
    const inboxSecrets = await db.query.secrets.findMany({
      where: eq(secrets.recipientId, userId),
      orderBy: [desc(secrets.createdAt)],
    });

    const safeSecrets = inboxSecrets.map((s) => ({
      id: s.id,
      status: s.status,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isE2EE: s.isE2EE,
      readAt: s.readAt,
      hasPassword: !!s.passwordHash,
      // We don't need fileName or size for simple text drops right now, but keeping for future
      fileName: s.fileName,
      fileSize: s.fileSize,
    }));

    return NextResponse.json(safeSecrets);
  } catch (error) {
    console.error('Inbox API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
