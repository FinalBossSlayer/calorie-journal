import { createHash } from 'node:crypto';

// Fixed namespace for this app's seed data. Never change it: seed food IDs
// must stay identical across builds so logs and recipes keep pointing at them.
const SEED_NAMESPACE = '6b1f7d4e-2c3a-4f5b-9e8d-1a2b3c4d5e6f';

/** Deterministic RFC 4122 version-5 UUID for `name` in the seed namespace. */
export function seedUuid(name: string): string {
  const ns = Buffer.from(SEED_NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(ns).update(name, 'utf8').digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const usdaFoodId = (fdcId: string) => seedUuid(`usda:${fdcId}`);
export const usdaPortionId = (portionId: string) => seedUuid(`usda-portion:${portionId}`);
export const dishFoodId = (slug: string) => seedUuid(`dish:${slug}`);
export const dishPortionId = (slug: string, index: number) => seedUuid(`dish-portion:${slug}:${index}`);
export const dishIngredientId = (slug: string, index: number) => seedUuid(`dish-ingredient:${slug}:${index}`);
