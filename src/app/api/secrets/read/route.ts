import { NextResponse } from 'next/server';
import { db } from '@/db';
import { secrets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { s3, BUCKET_NAME } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing secret ID' }, { status: 400 });
  }

  try {
    // 1. Fetch the secret
    const secretRecord = await db.query.secrets.findFirst({
      where: eq(secrets.id, id)
    });

    // 2. Check if exists and not expired
    if (!secretRecord) {
      return NextResponse.json({ error: 'Secret not found or already destroyed' }, { status: 404 });
    }

    if (secretRecord.expiresAt < new Date()) {
      // Clean up expired secret
      await db.delete(secrets).where(eq(secrets.id, id));
      return NextResponse.json({ error: 'Secret has expired and been destroyed' }, { status: 404 });
    }

    // 3. Prepare response payload
    const payload: any = {
      encryptedContent: secretRecord.encryptedContent,
      fileName: secretRecord.fileName,
      fileSize: secretRecord.fileSize,
      fileType: secretRecord.fileType,
    };

    // 4. Generate download URL if there is a file
    if (secretRecord.fileKey) {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: secretRecord.fileKey,
      });
      // URL expires in 15 minutes, enough time to download
      payload.fileUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    }

    // 5. BURN ON READ: Delete the record from the database
    if (secretRecord.burnOnRead) {
      await db.delete(secrets).where(eq(secrets.id, id));
      
      // Note: We do not delete the file from S3 immediately here because the client 
      // needs time to download it using the presigned URL. 
      // The file in S3 should be cleaned up via an S3 Bucket Lifecycle Rule (e.g. 1 day expiry)
      // or a separate cron job. Since the DB record is gone, the file is orphaned and secure.
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Read Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
