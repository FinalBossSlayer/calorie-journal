/**
 * Search-key normalisation so that "Тавче", "tavče", "tavche" and "tavce"
 * all produce the same key. Apply to stored names AND to the user's query.
 */

// Macedonian Cyrillic → Latin (lowercase input). ћ/ђ added for Serbian spellings.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ѓ: 'g', е: 'e', ж: 'z', з: 'z', ѕ: 'dz',
  и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', ќ: 'k', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz',
  ш: 's', ћ: 'k', ђ: 'dj',
};

// Latin letters whose accent-stripped form isn't what we want (or that don't decompose).
const LATIN_SPECIAL: Record<string, string> = {
  đ: 'dj',
  ć: 'k',
};

// Order matters: "dzh" must collapse before "zh".
const DIGRAPHS: [RegExp, string][] = [
  [/dzh/g, 'dz'],
  [/zh/g, 'z'],
  [/ch/g, 'c'],
  [/sh/g, 's'],
  [/kj/g, 'k'],
  [/gj/g, 'g'],
];

export function toSearchKey(text: string): string {
  let s = text.toLowerCase();

  s = Array.from(s, (ch) => CYRILLIC_TO_LATIN[ch] ?? LATIN_SPECIAL[ch] ?? ch).join('');

  // NFD splits "č" into "c" + combining caron; then drop the combining marks.
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');

  for (const [pattern, replacement] of DIGRAPHS) {
    s = s.replace(pattern, replacement);
  }

  // Anything that isn't plain ASCII letters/digits becomes a word separator.
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}
