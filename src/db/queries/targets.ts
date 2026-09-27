import { eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';

import { toDateString, todayString } from '@/lib/dates';
import { planTargetHistoryWrite, targetsForDate, type TargetHistoryRow } from '@/lib/targetHistory';
import { computeTargets, type Targets } from '@/lib/targets';

import { getDb } from '../client';
import { targetHistory } from '../schema';
import type { Profile } from './profile';

function liveTargets(profile: Profile, today: string): Targets {
  return computeTargets(profile, today, profile.targetOverrides).targets;
}

function historyQuery() {
  return getDb().select().from(targetHistory).where(isNull(targetHistory.deletedAt));
}

function toHistoryRow(row: typeof targetHistory.$inferSelect): TargetHistoryRow {
  return { id: row.id, effectiveDate: row.effectiveDate, targets: row };
}

/**
 * Records the profile's current targets as the targets from today on, keeping
 * earlier days' targets intact (see planTargetHistoryWrite). Call after every
 * profile save and on launch; writes nothing when the targets didn't change.
 */
export async function syncTargetHistory(profile: Profile): Promise<void> {
  const db = getDb();
  const today = todayString();
  const rows = (await historyQuery()).map(toHistoryRow);
  const writes = planTargetHistoryWrite(rows, today, liveTargets(profile, today), toDateString(profile.createdAt));

  // Sequential, not in a transaction: if the app dies between a redate and the
  // upsert, the next launch sync writes the missing row for today.
  for (const w of writes) {
    if (w.kind === 'redate') {
      await db.update(targetHistory).set({ effectiveDate: w.effectiveDate }).where(eq(targetHistory.id, w.id));
    } else {
      await db
        .insert(targetHistory)
        .values({ id: randomUUID(), effectiveDate: w.effectiveDate, ...w.targets })
        .onConflictDoUpdate({ target: targetHistory.effectiveDate, set: { ...w.targets, deletedAt: null } });
    }
  }
}

/**
 * Targets for a day: live from the profile for today, from history for past
 * days (falling back to the live targets if there is no history yet).
 */
export function useTargetsForDate(profile: Profile, date: string, today: string): Targets {
  return useTargetsLookup(profile, today)(date);
}

/** Like useTargetsForDate, for screens that show many days (History). */
export function useTargetsLookup(profile: Profile, today: string): (date: string) => Targets {
  const { data } = useLiveQuery(historyQuery());
  const live = liveTargets(profile, today);
  const rows = data.map(toHistoryRow);
  return (date) => (date >= today ? live : (targetsForDate(rows, date) ?? live));
}
