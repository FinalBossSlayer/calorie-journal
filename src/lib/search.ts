/**
 * Food search helpers. The SQL itself lives in src/db/search.ts; this file
 * only turns what the user typed into an FTS5 query.
 */
import { toSearchKey } from './translit';

/** Foods logged within this many days count as "recently used" and rank first. */
export const RECENT_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Epoch ms from which a log entry makes its food "recently used". */
export function recentCutoff(nowMs: number): number {
  return nowMs - RECENT_DAYS * DAY_MS;
}

/** Shorter queries show recent foods instead: one letter matches half the database. */
export const MIN_QUERY_LENGTH = 2;

export interface SearchParams {
  /** FTS5 MATCH expression for the searchKey column. */
  match: string;
  /** LIKE pattern for names that start with the whole query (ranked higher). */
  startsWith: string;
}

/**
 * Turns what the user typed into search parameters: every word must match as
 * a prefix, so "tavc gra" finds "тавче гравче". Returns null when the text is
 * too short or has nothing searchable (empty, only punctuation).
 *
 * toSearchKey leaves only [a-z0-9] and spaces, so the terms can't contain
 * FTS5 syntax or LIKE wildcards.
 */
export function buildSearch(text: string): SearchParams | null {
  const key = toSearchKey(text);
  if (key.length < MIN_QUERY_LENGTH) return null;
  return {
    match: key
      .split(' ')
      .map((term) => `"${term}"*`)
      .join(' '),
    startsWith: `${key}%`,
  };
}
