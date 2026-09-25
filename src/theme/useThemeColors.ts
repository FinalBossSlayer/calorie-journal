import { useColorScheme } from 'nativewind';

import { colors, type ColorScheme, type ThemeColors } from './tokens';

/** Current scheme's hex colors, for props that can't take a className (tab bar, icons, navigation theme). */
export function useThemeColors(): { scheme: ColorScheme; colors: ThemeColors } {
  const { colorScheme } = useColorScheme();
  const scheme: ColorScheme = colorScheme === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colors[scheme] };
}
