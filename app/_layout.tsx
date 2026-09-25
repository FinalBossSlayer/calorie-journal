import '../global.css';
import '@/i18n';

import { DarkTheme, DefaultTheme, type ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseGate } from '@/features/common/DatabaseGate';
import { ErrorScreen } from '@/features/common/ErrorScreen';
import { useThemeColors } from '@/theme/useThemeColors';

// Expo Router renders this instead of the layout when anything below throws,
// including database open and migration errors from DatabaseGate.
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} />;
}

export default function RootLayout() {
  const { scheme, colors } = useThemeColors();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  // Navigation theme controls the colors React Navigation paints itself (screen backgrounds, transitions).
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.over,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <DatabaseGate>
        <Stack screenOptions={{ headerShown: false }} />
      </DatabaseGate>
    </ThemeProvider>
  );
}
