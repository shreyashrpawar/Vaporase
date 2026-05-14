import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets, apiKeys } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    let userId: string | null = null;
    
    // Check for API Key first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.split(' ')[1];
      const keyRecord = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.key, apiKey)
      });
      
      if (keyRecord) {
        userId = keyRecord.userId;
      }
    }

    if (!userId) {
      // Fallback to Clerk Auth (handles cookie or Authorization header)
      const authResult = await auth();
      userId = authResult.userId;
    }

    const { 
      encryptedContent, 
      fileKey, 
      fileName, 
      fileSize, 
      fileType, 
      expiresInHours = 24,
      passwordHash,
      allowedIp,
      isE2EE = false,
      recipientId,
      dropKey,
      alias
    } = await req.json();

    if (!encryptedContent && !fileKey) {
      return NextResponse.json({ error: 'Secret must contain text or a file' }, { status: 400 });
    }

    const id = nanoid(8); // 8 char random string for the URL
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    if (alias) {
      if (!/^[a-zA-Z0-9-]+$/.test(alias)) {
        return NextResponse.json({ error: 'Alias can only contain letters, numbers, and hyphens' }, { status: 400 });
      }
      if (alias.length < 3 || alias.length > 30) {
        return NextResponse.json({ error: 'Alias must be between 3 and 30 characters' }, { status: 400 });
      }

      // Check for alias uniqueness against active secrets
      const existingSecret = await db.query.secrets.findFirst({
        where: and(
          eq(secrets.alias, alias),
          eq(secrets.status, 'active'),
          gt(secrets.expiresAt, now)
        )
      });

      if (existingSecret) {
        return NextResponse.json({ error: 'This alias is currently in use. Please choose another.' }, { status: 400 });
      }
    }

    await db.insert(secrets).values({
      id,
      userId: userId || null,
      encryptedContent: encryptedContent || null,
      fileKey: fileKey || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      fileType: fileType || null,
      createdAt: now,
      expiresAt: expiresAt,
      burnOnRead: true, // Currently hardcoded to true, can be made dynamic
      status: 'active',
      passwordHash: passwordHash || null,
      allowedIp: allowedIp || null,
      isE2EE,
      recipientId: recipientId || null,
      dropKey: dropKey || null,
      alias: alias || null,
    });

    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || 'www.ilusion.io';
    const link = alias 
      ? `${protocol}://${host}/s/${alias}` 
      : `${protocol}://${host}/secret/${id}`;

    return NextResponse.json({ id, alias, expiresAt, link });
  } catch (error) {
    console.error('Create Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
