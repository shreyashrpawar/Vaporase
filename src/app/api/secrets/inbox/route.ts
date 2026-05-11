import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets, userProfiles } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch secrets dropped into this user's inbox with sender profile info
    const inboxSecrets = await db
      .select({
        secret: secrets,
        sender: {
          subdomain: userProfiles.subdomain,
          displayName: userProfiles.displayName,
        },
      })
      .from(secrets)
      .leftJoin(userProfiles, eq(secrets.userId, userProfiles.userId))
      .where(eq(secrets.recipientId, userId))
      .orderBy(desc(secrets.createdAt));

    const safeSecrets = inboxSecrets.map((row) => ({
      id: row.secret.id,
      status: row.secret.status,
      createdAt: row.secret.createdAt,
      expiresAt: row.secret.expiresAt,
      isE2EE: row.secret.isE2EE,
      readAt: row.secret.readAt,
      hasPassword: !!row.secret.passwordHash,
      fileName: row.secret.fileName,
      fileSize: row.secret.fileSize,
      sender: row.sender,
    }));

    return NextResponse.json(safeSecrets);
  } catch (error) {
    console.error('Inbox API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
