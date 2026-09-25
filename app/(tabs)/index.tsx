import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/features/common/PlaceholderScreen';

// Macro swatches double as a visual check that theme tokens switch with light/dark mode.
const macros = [
  { key: 'protein', className: 'text-protein' },
  { key: 'carbs', className: 'text-carbs' },
  { key: 'fat', className: 'text-fat' },
] as const;

export default function TodayScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen title={t('tabs.today')} description={t('placeholder.today')}>
      <View className="flex-row gap-3">
        {macros.map((m) => (
          <View key={m.key} className="flex-1 rounded-card bg-surface p-3">
            <Text className={`text-2xl font-bold ${m.className}`}>—</Text>
            <Text className="text-xs text-text-muted">{t(`macros.${m.key}`)}</Text>
          </View>
        ))}
      </View>
      <View className="items-center rounded-card bg-accent p-4">
        <Text className="text-base font-bold text-on-accent">{t('placeholder.comingSoon')}</Text>
      </View>
    </PlaceholderScreen>
  );
}
