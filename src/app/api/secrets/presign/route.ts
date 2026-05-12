import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generatePresignedUrl } from '@/lib/s3';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const GUEST_LIMIT = 50 * 1024 * 1024; // 50MB
const PRO_LIMIT = 100 * 1024 * 1024; // 100MB

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
      // Fallback to Clerk Auth
      const authResult = await auth();
      userId = authResult.userId;
    }

    const { fileName, fileSize, fileType } = await req.json();

    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    const limit = userId ? PRO_LIMIT : GUEST_LIMIT;
    if (fileSize > limit) {
      return NextResponse.json(
        { error: `File size exceeds the limit of ${limit / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    const fileExtension = fileName.split('.').pop();
    const fileKey = `${nanoid()}.${fileExtension}`;
    
    const url = await generatePresignedUrl(fileKey, fileType);

    return NextResponse.json({ url, fileKey });
  } catch (error) {
    console.error('Presign Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
