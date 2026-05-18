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

  if (profile.plan === 'pro' && profile.planExpiresAt) {
    if (new Date() > profile.planExpiresAt) {
      // Plan expired, downgrade to free
      await db.update(userProfiles)
        .set({ plan: 'free' })
        .where(eq(userProfiles.userId, userId));
      return 'free';
    }
  }

  return (profile.plan as UserPlan) || 'free';
}

export async function isPro(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === 'pro';
}
