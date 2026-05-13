import 'dotenv/config';
import { db } from '../src/db';
import { userProfiles } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, 'user_3Da31S2nywGqHJ6wzdtbJomkXPo'),
  });
  console.log('Profile Plan:', profile?.plan);
}

check();
