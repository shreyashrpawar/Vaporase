import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { secrets } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { s3, BUCKET_NAME } from '@/lib/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing secret ID' }, { status: 400 });
    }

    // Verify ownership and fetch current state (Support UUID or Alias)
    const secretRecord = await db.query.secrets.findFirst({
      where: or(eq(secrets.id, id), eq(secrets.alias, id))
    });

    if (!secretRecord) {
      return NextResponse.json({ error: 'Secret not found or unauthorized' }, { status: 404 });
    }

    // Authorization check:
    // 1. If it is a guest secret (userId is null), anyone presenting the exact ID can revoke it
    // 2. If it is a registered secret, only the creator or the recipient can revoke it
    const isAuthorized =
      !secretRecord.userId ||
      (!!userId && (secretRecord.userId === userId || secretRecord.recipientId === userId));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to delete this secret' }, { status: 401 });
    }

    if (secretRecord.status !== 'active') {
      return NextResponse.json({ error: 'Secret is already burned or revoked' }, { status: 400 });
    }

    // Revoke the secret: nullify content, change status
    await db.update(secrets).set({
      encryptedContent: null,
      fileKey: null,
      status: 'revoked',
      // Note: We don't set readAt/readByIp because it wasn't read, it was revoked.
    }).where(eq(secrets.id, secretRecord.id));

    // Immediately delete the file from R2
    if (secretRecord.fileKey) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: secretRecord.fileKey,
        }));
      } catch (s3Err) {
        console.error('Failed to delete file from R2 on revoke:', s3Err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
