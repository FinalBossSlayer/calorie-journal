import { eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';

import { getDb } from '../client';
import { profile } from '../schema';
import { syncTargetHistory } from './targets';

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
  await syncActiveProfileTargets();
}

export async function updateProfile(id: string, fields: Partial<ProfileFields>): Promise<void> {
  await getDb().update(profile).set(fields).where(eq(profile.id, id));
  await syncActiveProfileTargets();
}

/** Keeps target history in step with the profile. Also run on launch (app/_layout.tsx). */
export async function syncActiveProfileTargets(): Promise<void> {
  const [current] = await activeProfileQuery();
  if (current) await syncTargetHistory(current);
}

/** Soft-deletes the profile, which sends the app back to onboarding (dev tool). */
export async function softDeleteProfile(id: string): Promise<void> {
  await getDb().update(profile).set({ deletedAt: new Date() }).where(eq(profile.id, id));
}
