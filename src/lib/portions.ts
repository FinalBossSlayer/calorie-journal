/**
 * Turning an edited list of portions into the database changes that save it.
 * UI-free so it can be unit tested. Shared by custom foods and recipes.
 */
import type { Language } from '@/i18n';

/** A portion as stored. Names are per language; either may be missing. */
export interface StoredPortion {
  id: string;
  nameMk: string | null;
  nameEn: string | null;
  grams: number;
}

/** A portion as edited: one name, typed in the UI language. `portionId` is null for new rows. */
export interface EditedPortion {
  portionId: string | null;
  name: string;
  grams: number;
  /** New rows copied from another food ("Make my version"): the names they were copied with. */
  copiedNames?: PortionNames;
}

export interface PortionNames {
  nameMk: string | null;
  nameEn: string | null;
}

export interface PortionChanges {
  insert: (PortionNames & { grams: number })[];
  /** Only portions that actually changed. */
  update: (PortionNames & { id: string; grams: number })[];
  /** Ids to soft-delete. */
  remove: string[];
}

/** The name shown for a portion in `language`, falling back to the other language. */
export function portionDisplayName(p: PortionNames, language: Language): string {
  const [first, second] = language === 'mk' ? [p.nameMk, p.nameEn] : [p.nameEn, p.nameMk];
  return first ?? second ?? '';
}

/**
 * Names to store for a portion typed as `name` in `language`. If the user left
 * the name as shown, both stored names are kept; if they changed it, the other
 * language's name is dropped because it no longer matches.
 */
export function portionNames(name: string, language: Language, original?: PortionNames): PortionNames {
  const trimmed = name.trim();
  if (original && portionDisplayName(original, language) === trimmed) {
    return { nameMk: original.nameMk, nameEn: original.nameEn };
  }
  return language === 'mk' ? { nameMk: trimmed, nameEn: null } : { nameMk: null, nameEn: trimmed };
}

export function planPortionChanges(
  stored: readonly StoredPortion[],
  edited: readonly EditedPortion[],
  language: Language,
): PortionChanges {
  const byId = new Map(stored.map((p) => [p.id, p]));
  const kept = new Set<string>();
  const changes: PortionChanges = { insert: [], update: [], remove: [] };

  for (const e of edited) {
    const original = e.portionId ? byId.get(e.portionId) : undefined;
    if (!original) {
      changes.insert.push({ ...portionNames(e.name, language, e.copiedNames), grams: e.grams });
      continue;
    }
    kept.add(original.id);
    const names = portionNames(e.name, language, original);
    if (names.nameMk !== original.nameMk || names.nameEn !== original.nameEn || e.grams !== original.grams) {
      changes.update.push({ id: original.id, ...names, grams: e.grams });
    }
  }

  for (const p of stored) {
    if (!kept.has(p.id)) changes.remove.push(p.id);
  }
  return changes;
}
