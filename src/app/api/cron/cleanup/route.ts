import { NextResponse } from 'next/server';
import { db } from '@/db';
import { secrets } from '@/db/schema';
import { lt, and, eq, or } from 'drizzle-orm';
import { s3, BUCKET_NAME } from '@/lib/s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function GET(req: Request) {
  try {
    // 1. Verify Authorization
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 2. Find secrets to wipe
    // Criteria:
    // (status = 'burned' AND readAt < 24 hours ago) 
    // OR (status = 'expired' AND expiresAt < 24 hours ago)
    const secretsToWipe = await db.query.secrets.findMany({
      where: or(
        and(eq(secrets.status, 'burned'), lt(secrets.readAt, twentyFourHoursAgo)),
        and(eq(secrets.status, 'expired'), lt(secrets.expiresAt, twentyFourHoursAgo)),
        // Also catch active secrets that expired > 24h ago but weren't updated in DB
        and(eq(secrets.status, 'active'), lt(secrets.expiresAt, twentyFourHoursAgo))
      )
    });

    if (secretsToWipe.length === 0) {
      return NextResponse.json({ message: 'No secrets to wipe.' });
    }

    let wipedCount = 0;
    let filesDeleted = 0;

    // 3. Process deletions
    for (const secret of secretsToWipe) {
      // Delete file from S3 if it exists
      if (secret.fileKey) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: secret.fileKey,
          });
          await s3.send(deleteCommand);
          filesDeleted++;
        } catch (e) {
          console.error(`Failed to delete file ${secret.fileKey} from S3:`, e);
          // Continue to delete the DB record even if S3 delete fails 
          // (or should we keep it? Better to delete DB record to ensure privacy)
        }
      }

      // Hard delete from database
      await db.delete(secrets).where(eq(secrets.id, secret.id));
      wipedCount++;
    }

    return NextResponse.json({
      message: 'Cleanup successful',
      wipedCount,
      filesDeleted
    });

  } catch (error) {
    console.error('Cron Cleanup Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
