import { NextResponse } from 'next/server';
import { db } from '@/db';
import { secrets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { s3, BUCKET_NAME } from '@/lib/s3';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: Request) {
  try {
    const { id, passwordHash } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing secret ID' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';

    // 1. Fetch the secret
    const secretRecord = await db.query.secrets.findFirst({
      where: eq(secrets.id, id)
    });

    // 2. Check if exists and not expired/burned
    if (!secretRecord || secretRecord.status !== 'active') {
      return NextResponse.json({ error: 'Secret not found or already destroyed' }, { status: 404 });
    }

    if (secretRecord.expiresAt < new Date()) {
      // Clean up expired secret
      await db.update(secrets).set({
        encryptedContent: null,
        fileKey: null,
        status: 'burned',
      }).where(eq(secrets.id, id));
      return NextResponse.json({ error: 'Secret has expired and been destroyed' }, { status: 404 });
    }

    // 3. Check IP Whitelist
    if (secretRecord.allowedIp && secretRecord.allowedIp.trim() !== '') {
      // Very basic exact IP match. (In production, might need CIDR support).
      // IP headers can contain multiple comma-separated IPs.
      const ips = clientIp.split(',').map(ip => ip.trim());
      const isAllowed = ips.some(ip => ip === secretRecord.allowedIp);
      
      if (!isAllowed) {
        return NextResponse.json({ error: 'Access denied from this IP address.' }, { status: 403 });
      }
    }

    // 4. Check Password
    if (secretRecord.passwordHash) {
      if (!passwordHash) {
        // Signal to the client that a password is required
        return NextResponse.json({ requirePassword: true }, { status: 401 });
      }
      if (passwordHash !== secretRecord.passwordHash) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }
    }

    // 5. Prepare response payload
    const payload: any = {
      encryptedContent: secretRecord.encryptedContent,
      fileName: secretRecord.fileName,
      fileSize: secretRecord.fileSize,
      fileType: secretRecord.fileType,
      isE2EE: secretRecord.isE2EE,
    };

    // 6. Generate download URL if there is a file
    if (secretRecord.fileKey) {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: secretRecord.fileKey,
      });
      // URL expires in 15 minutes, enough time to download
      payload.fileUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    }

    // 7. BURN ON READ: Nullify content but keep metadata
    if (secretRecord.burnOnRead) {
      await db.update(secrets).set({
        encryptedContent: null,
        fileKey: null,
        status: 'burned',
        readAt: new Date(),
        readByIp: clientIp,
      }).where(eq(secrets.id, id));
      
      // Immediately delete the file from R2
      if (secretRecord.fileKey) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: secretRecord.fileKey,
          }));
        } catch (s3Err) {
          console.error('Failed to delete file from R2 on burn:', s3Err);
          // We don't throw here so the user still gets their secret
        }
      }
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Read Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
