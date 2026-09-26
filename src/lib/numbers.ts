/**
 * Number typed by the user. Accepts a decimal comma ("72,5"), as typed on
 * Macedonian keyboards. Returns null for empty or non-numeric text.
 */
export function parseDecimal(text: string): number | null {
  const s = text.trim().replace(',', '.');
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return null;
  return Number(s);
}
