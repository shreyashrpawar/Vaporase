import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets, apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
      
      if (!keyRecord) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      userId = keyRecord.userId;
    } else {
      // Fallback to Clerk Auth
      const authResult = await auth();
      userId = authResult.userId;
    }

    const { 
      encryptedContent, 
      fileKey, 
      fileName, 
      fileSize, 
      fileType, 
      expiresInHours = 24 
    } = await req.json();

    if (!encryptedContent && !fileKey) {
      return NextResponse.json({ error: 'Secret must contain text or a file' }, { status: 400 });
    }

    const id = nanoid(10); // 10 char random string for the URL
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

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
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Create Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
