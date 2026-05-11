import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    return NextResponse.json(profile || null);
  } catch (error) {
    console.error('Profile API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { subdomain, displayName } = body;

    if (!subdomain || !displayName) {
      return NextResponse.json({ error: 'Subdomain and Display Name are required' }, { status: 400 });
    }

    // Basic validation
    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanSubdomain.length < 3) {
      return NextResponse.json({ error: 'Subdomain must be at least 3 characters' }, { status: 400 });
    }

    // Check if subdomain is taken by someone else
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.subdomain, cleanSubdomain),
    });

    if (existingProfile && existingProfile.userId !== userId) {
      return NextResponse.json({ error: 'Subdomain is already taken' }, { status: 409 });
    }

    // Upsert profile
    const currentProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (currentProfile) {
      await db.update(userProfiles).set({
        subdomain: cleanSubdomain,
        displayName,
        updatedAt: new Date(),
      }).where(eq(userProfiles.userId, userId));
    } else {
      await db.insert(userProfiles).values({
        id: nanoid(),
        userId,
        subdomain: cleanSubdomain,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const updatedProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Profile API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
