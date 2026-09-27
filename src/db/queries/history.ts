import { and, asc, between, isNull, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { type DayTotal, toDayTotal } from '@/lib/history';

import { getDb } from '../client';
import { logEntries } from '../schema';

/** incompleteNutrients is stored as a JSON array such as ["kcal","fiber"]. */
const kcalIncomplete = sql`${logEntries.incompleteNutrients} LIKE '%"kcal"%'`;

function dayTotalsQuery(from: string, to: string) {
  return getDb()
    .select({
      date: logEntries.date,
      kcalSum: sql<number | null>`sum(${logEntries.kcal})`,
      entryCount: sql<number>`count(*)`.mapWith(Number),
      knownKcalCount: sql<number>`count(${logEntries.kcal})`.mapWith(Number),
      incompleteKcalCount: sql<number>`sum(CASE WHEN ${kcalIncomplete} THEN 1 ELSE 0 END)`.mapWith(Number),
    })
    .from(logEntries)
    .where(and(between(logEntries.date, from, to), isNull(logEntries.deletedAt)))
    .groupBy(logEntries.date)
    .orderBy(asc(logEntries.date));
}

/**
 * kcal per day for the days from `from` to `to` (inclusive), live. Days with
 * nothing logged are missing from the map.
 */
export function useDayTotals(from: string, to: string): { totals: Map<string, DayTotal>; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(dayTotalsQuery(from, to), [from, to]);
  const totals = useMemo(() => new Map(data.map((row) => [row.date, toDayTotal(row)])), [data]);
  return { totals, loaded: updatedAt !== undefined };
}
