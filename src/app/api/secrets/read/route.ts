import { NextResponse } from 'next/server';
import { db } from '@/db';
import { secrets, userProfiles } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { s3, BUCKET_NAME } from '@/lib/s3';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sendSecretBurnedEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { id, passwordHash } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing secret ID' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';

    // 1. Fetch the secret and sender profile
    // We prioritize 'active' secrets to allow alias reuse.
    let secretRecord = await db.query.secrets.findFirst({
      where: and(
        or(eq(secrets.id, id), eq(secrets.alias, id)),
        eq(secrets.status, 'active')
      )
    });

    // If no active secret found, look for the most recent one (could be burned/expired)
    if (!secretRecord) {
      secretRecord = await db.query.secrets.findFirst({
        where: or(eq(secrets.id, id), eq(secrets.alias, id)),
        orderBy: (secrets, { desc }) => [desc(secrets.createdAt)]
      });
    }

    let senderProfile = null;
    if (secretRecord && secretRecord.userId) {
      senderProfile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, secretRecord.userId),
      });
    }

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
      }).where(eq(secrets.id, secretRecord.id));
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
      dropKey: secretRecord.dropKey,
      sender: senderProfile ? {
        subdomain: senderProfile.subdomain,
        displayName: senderProfile.displayName,
      } : null,
      recipientId: secretRecord.recipientId,
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
        // Note: we keep fileKey here so the generated presigned URL remains valid 
        // for this specific session, but we mark the status as burned.
        status: 'burned',
        readAt: new Date(),
      }).where(eq(secrets.id, secretRecord.id));

      // Send email notification
      // Note: Using hardcoded email for Mailtrap sandbox as requested. 
      // In production, fetch the user's email via clerkClient().users.getUser(secretRecord.userId)
      await sendSecretBurnedEmail("shreyashrpawar28@gmail.com", id, clientIp);
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Read Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
