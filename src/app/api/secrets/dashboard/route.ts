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

    // Fetch all secrets created by this user, ordered by creation date descending
    const userSecrets = await db.query.secrets.findMany({
      where: eq(secrets.userId, userId),
      orderBy: [desc(secrets.createdAt)],
    });

    // We don't want to send actual encryptedContent back to the dashboard, just metadata
    const safeSecrets = userSecrets.map((s) => ({
      id: s.id,
      status: s.status,
      fileName: s.fileName,
      fileSize: s.fileSize,
      fileType: s.fileType,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isE2EE: s.isE2EE,
      readAt: s.readAt,
      readByIp: s.readByIp,
      readLocation: s.readLocation,
      hasPassword: !!s.passwordHash,
      hasIpWhitelist: !!s.allowedIp,
    }));

    return NextResponse.json(safeSecrets);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
