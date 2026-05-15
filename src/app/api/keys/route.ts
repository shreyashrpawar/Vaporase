import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { apiKeys, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// GET all API keys for the current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.userId, userId),
      orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error('Fetch API Keys Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// CREATE a new API key
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 });
    }

    // Check plan — Pro only
    const userProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (userProfile?.plan !== 'pro') {
      return NextResponse.json({ error: 'API Keys are only available on the Pro plan' }, { status: 403 });
    }

    const key = `ilusion_sk_${nanoid(24)}`;
    const now = new Date();

    await db.insert(apiKeys).values({
      key,
      userId,
      name,
      createdAt: now,
    });

    return NextResponse.json({ key, name, createdAt: now });
  } catch (error) {
    console.error('Create API Key Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE an API key
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Ensure the key belongs to the user
    const keyRecord = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.key, key)
    });

    if (!keyRecord || keyRecord.userId !== userId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await db.delete(apiKeys).where(eq(apiKeys.key, key));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API Key Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
