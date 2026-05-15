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
        id: secrets.id,
        status: secrets.status,
        createdAt: secrets.createdAt,
        expiresAt: secrets.expiresAt,
        isE2EE: secrets.isE2EE,
        readAt: secrets.readAt,
        passwordHash: secrets.passwordHash,
        fileName: secrets.fileName,
        fileSize: secrets.fileSize,
        senderSubdomain: userProfiles.subdomain,
        senderDisplayName: userProfiles.displayName,
      })
      .from(secrets)
      .leftJoin(userProfiles, eq(secrets.userId, userProfiles.userId))
      .where(eq(secrets.recipientId, userId))
      .orderBy(desc(secrets.createdAt));

    const safeSecrets = inboxSecrets.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      isE2EE: row.isE2EE,
      readAt: row.readAt,
      hasPassword: !!row.passwordHash,
      fileName: row.fileName,
      fileSize: row.fileSize,
      sender: {
        subdomain: row.senderSubdomain,
        displayName: row.senderDisplayName,
      },
    }));

    return NextResponse.json(safeSecrets);
  } catch (error) {
    console.error('Inbox API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
