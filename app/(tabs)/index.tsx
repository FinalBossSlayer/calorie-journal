import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DateHeader } from '@/features/today/DateHeader';

export default function TodayScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
      <View className="gap-4 px-4">
        <DateHeader />
        <View className="rounded-card border border-border bg-surface p-4">
          <Text className="text-base text-text-muted">{t('placeholder.today')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
