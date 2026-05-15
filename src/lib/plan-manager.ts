import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type UserPlan = 'free' | 'pro';

export async function getUserPlan(userId: string): Promise<UserPlan> {
  // Force Pro for everyone for now
  return 'pro';
}

export async function isPro(userId: string): Promise<boolean> {
  return true;
}
