import { NextResponse } from 'next/server';
import { db } from '@/db';
import { secrets } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Try finding by ID first
    let secret = await db.query.secrets.findFirst({
      where: eq(secrets.id, id)
    });

    // If not found, try finding by alias
    if (!secret) {
      secret = await db.query.secrets.findFirst({
        where: eq(secrets.alias, id)
      });
    }

    if (!secret) {
      return NextResponse.json({ error: 'Secret not found or expired' }, { status: 404 });
    }

    const now = new Date();
    const isExpired = secret.expiresAt < now;
    
    // Calculate view count
    // Note: In our schema, we track readAt and readByIp for burned secrets.
    // For multi-view secrets, we might need a separate views table or just increment a counter.
    // Currently, our schema doesn't have a viewCount column. 
    // I should probably add one to the schema.

    return NextResponse.json({
      id: secret.id,
      status: isExpired ? 'expired' : secret.status,
      burnOnRead: secret.burnOnRead,
      createdAt: secret.createdAt,
      expiresAt: secret.expiresAt,
      viewCount: secret.viewCount || 0,
    });
  } catch (error) {
    console.error('Status Check Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
