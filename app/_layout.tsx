import '../global.css';

import { DarkTheme, DefaultTheme, type ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { syncActiveProfileTargets, useProfile } from '@/db/queries/profile';
import { DatabaseGate } from '@/features/common/DatabaseGate';
import { ErrorScreen } from '@/features/common/ErrorScreen';
import i18n from '@/i18n';
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
        <AppStack />
      </DatabaseGate>
    </ThemeProvider>
  );
}

/** Onboarding until a profile exists, then the tabs. Also keeps the UI language in sync with the profile. */
function AppStack() {
  const { profile, loaded } = useProfile();
  const language = profile?.language;

  useEffect(() => {
    if (language) void i18n.changeLanguage(language);
  }, [language]);

  // Creates the first target-history row for profiles made before it existed,
  // and picks up target changes that happen without a save (e.g. a birthday).
  const profileId = profile?.id;
  useEffect(() => {
    if (profileId) void syncActiveProfileTargets();
  }, [profileId]);

  if (!loaded) return null;
  const hasProfile = profile !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={hasProfile}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="add-food" />
        <Stack.Screen name="food/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!hasProfile}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
