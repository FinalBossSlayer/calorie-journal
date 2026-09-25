import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { db } from '@/db/client';
import { runDevDatabaseCheck } from '@/db/devCheck';
import migrations from '@/db/migrations/migrations';
import { useThemeColors } from '@/theme/useThemeColors';

/** Runs pending migrations before rendering the app. */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success && __DEV__) runDevDatabaseCheck();
  }, [success]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-4">
        <Text className="text-center text-lg font-bold text-over">{t('database.error')}</Text>
        <Text className="text-center text-sm text-text-muted">{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background">
        <ActivityIndicator color={colors.accent} />
        <Text className="text-sm text-text-muted">{t('database.loading')}</Text>
      </View>
    );
  }

  return children;
}
