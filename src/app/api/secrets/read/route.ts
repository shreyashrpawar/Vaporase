import { NextResponse } from 'next/server';
import { db } from '@/db';
import { secrets, userProfiles } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { s3, BUCKET_NAME } from '@/lib/s3';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sendSecretBurnedEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { id, passwordHash, checkOnly } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing secret ID' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';

    // 1. Fetch the secret
    // We prioritize 'active' secrets to allow alias reuse.
    const columns = {
      id: secrets.id,
      userId: secrets.userId,
      encryptedContent: secrets.encryptedContent,
      fileKey: secrets.fileKey,
      fileName: secrets.fileName,
      fileSize: secrets.fileSize,
      fileType: secrets.fileType,
      expiresAt: secrets.expiresAt,
      burnOnRead: secrets.burnOnRead,
      status: secrets.status,
      passwordHash: secrets.passwordHash,
      allowedIp: secrets.allowedIp,
      isE2EE: secrets.isE2EE,
      recipientId: secrets.recipientId,
      dropKey: secrets.dropKey,
      filesJson: secrets.filesJson,
      viewCount: secrets.viewCount,
    };

    let secretsFound = await db.select(columns).from(secrets).where(
      and(
        or(eq(secrets.id, id), eq(secrets.alias, id)),
        eq(secrets.status, 'active')
      )
    ).limit(1);

    // If no active secret found, look for the most recent one (could be burned/expired)
    if (secretsFound.length === 0) {
      secretsFound = await db.select(columns).from(secrets).where(
        or(eq(secrets.id, id), eq(secrets.alias, id))
      ).orderBy(desc(secrets.createdAt)).limit(1);
    }

    const secretRecord: any = secretsFound[0];

    let senderProfile = null;
    if (secretRecord && secretRecord.userId) {
      senderProfile = (await db.select({
        subdomain: userProfiles.subdomain,
        displayName: userProfiles.displayName,
      }).from(userProfiles).where(eq(userProfiles.userId, secretRecord.userId)).limit(1))[0];
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

    // 3.5 Return Metadata for Pre-flight checks
    if (checkOnly) {
      return NextResponse.json({
        success: true,
        isE2EE: secretRecord.isE2EE,
        requirePassword: !!secretRecord.passwordHash,
        status: secretRecord.status,
        hasDropKey: !!secretRecord.dropKey,
        alias: secretRecord.alias
      });
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

    // 6. Generate download URLs for all files
    const attachedFiles: any[] = [];
    let sourceFiles: any[] = [];
    
    if (secretRecord.filesJson) {
      try {
        const parsed = JSON.parse(secretRecord.filesJson);
        if (Array.isArray(parsed)) sourceFiles = parsed;
      } catch (e) {
        console.error('Error parsing filesJson:', e);
      }
    }
    
    // Fallback for single file if not already in sourceFiles
    if (secretRecord.fileKey && !sourceFiles.some(f => f.fileKey === secretRecord.fileKey)) {
      sourceFiles.unshift({
        fileKey: secretRecord.fileKey,
        fileName: secretRecord.fileName,
        fileSize: secretRecord.fileSize,
        fileType: secretRecord.fileType,
      });
    }

    for (const f of sourceFiles) {
      if (!f.fileKey) continue;
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: f.fileKey,
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(f.fileName).replace(/"/g, '\\"')}"`,
        });
        const fileUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
        attachedFiles.push({ ...f, fileUrl });
      } catch (err) {
        console.error('S3 sign error:', err);
      }
    }
    payload.files = attachedFiles;
    
    // Backward compatibility
    if (attachedFiles.length > 0) {
      payload.fileUrl = attachedFiles[0].fileUrl;
      payload.fileName = attachedFiles[0].fileName;
      payload.fileSize = attachedFiles[0].fileSize;
      payload.fileType = attachedFiles[0].fileType;
    }

    // 7. BURN ON READ or MULTI-VIEW
    const updateData: any = {
      readAt: new Date(),
      readByIp: clientIp,
      viewCount: (secretRecord.viewCount || 0) + 1,
    };

    if (secretRecord.burnOnRead) {
      updateData.encryptedContent = null;
      updateData.status = 'burned';
      
      // Send email notification
      await sendSecretBurnedEmail("shreyashrpawar28@gmail.com", id, clientIp);
    }

    await db.update(secrets).set(updateData).where(eq(secrets.id, secretRecord.id));

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Read Secret Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
