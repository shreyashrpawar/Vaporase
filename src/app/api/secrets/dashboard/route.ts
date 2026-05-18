import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets, userProfiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all secrets created by this user with recipient info
    const userSecrets = await db.select({
      id: secrets.id,
      status: secrets.status,
      fileName: secrets.fileName,
      fileSize: secrets.fileSize,
      fileType: secrets.fileType,
      createdAt: secrets.createdAt,
      expiresAt: secrets.expiresAt,
      isE2EE: secrets.isE2EE,
      readAt: secrets.readAt,
      readByIp: secrets.readByIp,
      readLocation: secrets.readLocation,
      passwordHash: secrets.passwordHash,
      allowedIp: secrets.allowedIp,
      alias: secrets.alias,
      filesJson: secrets.filesJson,
      burnOnRead: secrets.burnOnRead,
      viewCount: secrets.viewCount,
      recipientDisplayName: userProfiles.displayName,
      recipientSubdomain: userProfiles.subdomain,
    })
    .from(secrets)
    .leftJoin(userProfiles, eq(secrets.recipientId, userProfiles.userId))
    .where(eq(secrets.userId, userId))
    .orderBy(desc(secrets.createdAt));

    // Map to safe metadata
    const safeSecrets = userSecrets.map((s) => ({
      ...s,
      hasPassword: !!s.passwordHash,
      hasIpWhitelist: !!s.allowedIp,
      recipient: s.recipientDisplayName ? {
        displayName: s.recipientDisplayName,
        subdomain: s.recipientSubdomain,
      } : null,
    }));

    return NextResponse.json(safeSecrets);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
