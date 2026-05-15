import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets, apiKeys, userProfiles } from '@/db/schema';
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
      alias,
      files // Support multiple files
    } = await req.json();

    if (!encryptedContent && !fileKey) {
      return NextResponse.json({ error: 'Secret must contain text or a file' }, { status: 400 });
    }

    // Server-side Pro enforcement — disabled for now (Community Pro mode)
    let finalPasswordHash = passwordHash;
    let finalAllowedIp = allowedIp;
    let finalAlias = alias;

    const id = nanoid(8); // 8 char random string for the URL
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    if (finalAlias) {
      if (!/^[a-zA-Z0-9-]+$/.test(finalAlias)) {
        return NextResponse.json({ error: 'Alias can only contain letters, numbers, and hyphens' }, { status: 400 });
      }
      if (finalAlias.length < 3 || finalAlias.length > 30) {
        return NextResponse.json({ error: 'Alias must be between 3 and 30 characters' }, { status: 400 });
      }

      // Check for alias uniqueness against active secrets
      const existingSecret = await db.query.secrets.findFirst({
        where: and(
          eq(secrets.alias, finalAlias),
          eq(secrets.status, 'active'),
          gt(secrets.expiresAt, now)
        )
      });

      if (existingSecret) {
        return NextResponse.json({ error: 'This alias is currently in use. Please choose another.' }, { status: 400 });
      }
    }

    const senderIp = 
      req.headers.get('x-forwarded-for')?.split(',')[0] || 
      req.headers.get('x-real-ip') || 
      'unknown';

    // Rate limit for Inbox/DropBox (One active drop per IP)
    if (recipientId) {
      const activeDropFromThisIp = await db.query.secrets.findFirst({
        where: and(
          eq(secrets.recipientId, recipientId),
          eq(secrets.senderIp, senderIp),
          eq(secrets.status, 'active'),
          gt(secrets.expiresAt, now)
        )
      });

      if (activeDropFromThisIp) {
        return NextResponse.json({ 
          error: "You already have an active secret in this user's inbox. Please wait for them to read it before sending another." 
        }, { status: 429 });
      }
    }

    await db.insert(secrets).values({
      id,
      userId: userId || null,
      encryptedContent: encryptedContent || null,
      fileKey: (files && files.length > 0) ? files[0].fileKey : (fileKey || null),
      fileName: (files && files.length > 0) ? files[0].fileName : (fileName || null),
      fileSize: (files && files.length > 0) ? files[0].fileSize : (fileSize || null),
      fileType: (files && files.length > 0) ? files[0].fileType : (fileType || null),
      createdAt: now,
      expiresAt: expiresAt,
      burnOnRead: true,
      status: 'active',
      passwordHash: finalPasswordHash || null,
      allowedIp: finalAllowedIp || null,
      isE2EE,
      recipientId: recipientId || null,
      dropKey: dropKey || null,
      alias: finalAlias || null,
      senderIp: senderIp,
      filesJson: files ? JSON.stringify(files) : null,
    });

    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || 'www.ilusion.io';
    const link = finalAlias 
      ? `${protocol}://${host}/secret/${finalAlias}` 
      : `${protocol}://${host}/secret/${id}`;

    return NextResponse.json({ id, alias: finalAlias, expiresAt, link });
  } catch (error) {
    console.error('Create Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
