import { reloadAppAsync } from 'expo';
import type { ErrorBoundaryProps } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

/**
 * Body of the root ErrorBoundary. Retry reloads the whole JS app: expo-sqlite
 * caches a failed database open at module level, so re-rendering alone
 * (the router's `retry`) would hit the same cached error again.
 */
export function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);

  async function onRetry() {
    setRetrying(true);
    try {
      await reloadAppAsync('Retry after error');
    } catch {
      // reloadAppAsync is unavailable on some platforms (e.g. web): fall back to re-rendering.
      await retry();
      setRetrying(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-4">
      <Text className="text-center text-2xl font-bold text-text">{t('errors.title')}</Text>
      <View className="w-full rounded-card border border-border bg-surface p-4">
        <Text selectable className="text-center text-sm text-over">
          {error.message}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={retrying}
        onPress={onRetry}
        className="rounded-card bg-accent px-6 py-3 active:opacity-80 disabled:opacity-50">
        <Text className="text-base font-bold text-on-accent">{t('errors.retry')}</Text>
      </Pressable>
    </View>
  );
}
