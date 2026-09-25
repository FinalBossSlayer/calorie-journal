import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { SQLiteProvider } from 'expo-sqlite';
import { type ReactNode, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { DATABASE_NAME, getDb, initDatabase } from '@/db/client';
import { runDevDatabaseCheck } from '@/db/devCheck';
import migrations from '@/db/migrations/migrations';
import { useThemeColors } from '@/theme/useThemeColors';

// Module-level constants: SQLiteProvider reopens the database when these change identity.
const PREBUILT_DB = { assetId: require('@/assets/db/app.db') as number };
const OPEN_OPTIONS = { enableChangeListener: true }; // lets Drizzle's useLiveQuery re-render on changes

/**
 * Opens the database (copying the bundled prebuilt one on first launch),
 * runs pending migrations, then renders the app.
 * Errors are thrown to the root ErrorBoundary (app/_layout.tsx).
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DatabaseLoading />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        assetSource={PREBUILT_DB}
        options={OPEN_OPTIONS}
        onInit={initDatabase}
        useSuspense>
        <Migrations>{children}</Migrations>
      </SQLiteProvider>
    </Suspense>
  );
}

function Migrations({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(getDb(), migrations);

  useEffect(() => {
    if (success && __DEV__) runDevDatabaseCheck();
  }, [success]);

  if (error) throw error;
  if (!success) return <DatabaseLoading />;
  return children;
}

function DatabaseLoading() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <ActivityIndicator color={colors.accent} />
      <Text className="text-sm text-text-muted">{t('database.loading')}</Text>
    </View>
  );
}
