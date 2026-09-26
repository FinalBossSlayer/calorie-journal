import { eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';

import { getDb } from '../client';
import { profile } from '../schema';

export type Profile = typeof profile.$inferSelect;
export type ProfileFields = Omit<typeof profile.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

function activeProfileQuery() {
  return getDb().select().from(profile).where(isNull(profile.deletedAt)).limit(1);
}

/**
 * The single profile row, live: re-renders when it changes.
 * `loaded` is false until the first read finishes (then `profile` may still be null).
 */
export function useProfile(): { profile: Profile | null; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(activeProfileQuery());
  return { profile: data[0] ?? null, loaded: updatedAt !== undefined };
}

/** Creates the profile on first run, updates it afterwards. */
export async function saveProfile(fields: ProfileFields): Promise<void> {
  const [existing] = await activeProfileQuery();
  if (existing) {
    await getDb().update(profile).set(fields).where(eq(profile.id, existing.id));
  } else {
    await getDb().insert(profile).values({ id: randomUUID(), ...fields });
  }
}

export async function updateProfile(id: string, fields: Partial<ProfileFields>): Promise<void> {
  await getDb().update(profile).set(fields).where(eq(profile.id, id));
}

/** Soft-deletes the profile, which sends the app back to onboarding (dev tool). */
export async function softDeleteProfile(id: string): Promise<void> {
  await getDb().update(profile).set({ deletedAt: new Date() }).where(eq(profile.id, id));
}
