// Tailwind loads this file with jiti, so it can require the TypeScript tokens directly.
const plugin = require('tailwindcss/plugin');
const { colors, radius, cssVarName, toKebab } = require('./src/theme/tokens.ts');

const tokenNames = Object.keys(colors.light);

/** { '--color-background': '#F7F6F2', ... } for one scheme. */
function cssVars(scheme) {
  return Object.fromEntries(tokenNames.map((t) => [cssVarName(t), colors[scheme][t]]));
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Follow the phone's light/dark setting.
  darkMode: 'media',
  theme: {
    extend: {
      // bg-background, text-text-muted, border-border, text-protein, ...
      colors: Object.fromEntries(tokenNames.map((t) => [toKebab(t), `var(${cssVarName(t)})`])),
      borderRadius: {
        card: `${radius.card}px`,
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': cssVars('light'),
        '@media (prefers-color-scheme: dark)': {
          ':root': cssVars('dark'),
        },
      });
    }),
  ],
};
