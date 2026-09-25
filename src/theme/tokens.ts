// Single source of truth for the "Dark and bold" design system (see CLAUDE.md).
// Tailwind classes (via CSS variables) and JS-side colors are both generated from here.

export const colors = {
  dark: {
    background: '#141413',
    surface: '#2C2C2A',
    border: '#444441',
    text: '#F1EFE8',
    textMuted: '#B4B2A9',
    accent: '#97C459',
    onAccent: '#173404',
    protein: '#85B7EB',
    carbs: '#FAC775',
    fat: '#F0997B',
    over: '#E24B4A',
  },
  light: {
    background: '#F7F6F2',
    surface: '#FFFFFF',
    border: '#D3D1C7',
    text: '#2C2C2A',
    textMuted: '#5F5E5A',
    accent: '#3B6D11',
    onAccent: '#FFFFFF',
    protein: '#185FA5',
    carbs: '#854F0B',
    fat: '#993C1D',
    over: '#A32D2D',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof (typeof colors)['light'];
export type ThemeColors = Record<ColorToken, string>;

export const radius = {
  card: 12,
} as const;

/** textMuted -> text-muted, used for CSS variable and Tailwind class names. */
export function toKebab(token: string): string {
  return token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

export function cssVarName(token: ColorToken): string {
  return `--color-${toKebab(token)}`;
}
