import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets, apiKeys, userProfiles } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    let userId: string | null = null;
    let isApiRequest = false;
    
    // Check for API Key first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      isApiRequest = true;
      const apiKey = authHeader.split(' ')[1];
      const keyRecord = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.key, apiKey)
      });
      
      if (keyRecord) {
        userId = keyRecord.userId;
      } else {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
      }
    }

    if (!userId) {
      // Fallback to Clerk Auth (handles cookie or Authorization header)
      const authResult = await auth();
      userId = authResult.userId;
    }

    const { 
      id: suggestedId,
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
      burnOnRead = true,
      files
    } = await req.json();

    if (!encryptedContent && !fileKey) {
      return NextResponse.json({ error: 'Secret must contain text or a file' }, { status: 400 });
    }

    // Constraints for non-burning secrets
    if (burnOnRead === false) {
      if (!passwordHash) {
        return NextResponse.json({ error: 'Password protection is required for multi-view secrets' }, { status: 400 });
      }
      if (expiresInHours > 24) {
        return NextResponse.json({ error: 'Multi-view secrets cannot exceed a 24-hour expiration' }, { status: 400 });
      }
    }

    // Server-side Pro enforcement
    let userPlan = 'free';
    if (userId) {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId)
      });
      if (profile && profile.plan === 'pro') {
        userPlan = 'pro';
      }
    }

    if (isApiRequest && userPlan === 'free') {
      return NextResponse.json({ error: 'API access is a Pro feature. Please upgrade to use API keys.' }, { status: 403 });
    }

    if (userPlan === 'free') {
      if (passwordHash) return NextResponse.json({ error: 'Password protection is a Pro feature.' }, { status: 403 });
      if (burnOnRead === false) return NextResponse.json({ error: 'Multi-view (disabling Burn-on-Read) is a Pro feature.' }, { status: 403 });
      if (allowedIp) return NextResponse.json({ error: 'IP Restriction is a Pro feature.' }, { status: 403 });
      
      const MAX_FREE_SIZE = 50 * 1024 * 1024;
      const totalSize = files ? files.reduce((acc: number, f: any) => acc + f.fileSize, 0) : (fileSize || 0);
      if (totalSize > MAX_FREE_SIZE) return NextResponse.json({ error: 'File size exceeds 50MB free tier limit.' }, { status: 413 });
    }

    let finalPasswordHash = userPlan === 'pro' ? passwordHash : null;
    let finalAllowedIp = userPlan === 'pro' ? allowedIp : null;
    let finalAlias = alias;

    const id = suggestedId || nanoid(8); // Use suggested ID or generate a random one
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
      burnOnRead,
      status: 'active',
      passwordHash: finalPasswordHash || null,
      allowedIp: finalAllowedIp || null,
      isE2EE,
      recipientId: recipientId || null,
      dropKey: dropKey || null,
      alias: finalAlias || null,
      senderIp: senderIp,
      viewCount: 0,
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
