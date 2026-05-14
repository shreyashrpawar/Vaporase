import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type UserPlan = 'free' | 'pro';

export async function getUserPlan(userId: string): Promise<UserPlan> {
  if (!userId) return 'free';

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!profile) return 'free';

  // If plan is 'pro' but it has expired, treat as 'free'
  if (profile.plan === 'pro' && profile.planExpiresAt) {
    const now = new Date();
    if (now > profile.planExpiresAt) {
      // Optional: Update the DB to reflect expiration
      // This is done lazily when checked to avoid cron jobs
      await db.update(userProfiles)
        .set({ plan: 'free', updatedAt: now })
        .where(eq(userProfiles.userId, userId));
      
      return 'free';
    }
  }

  return profile.plan as UserPlan;
}

export async function isPro(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === 'pro';
}
