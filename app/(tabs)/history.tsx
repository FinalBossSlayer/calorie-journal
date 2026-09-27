import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Profile, useProfile } from '@/db/queries/profile';
import { useTargetsLookup } from '@/db/queries/targets';
import { useToday } from '@/features/common/useToday';
import { MonthCalendar } from '@/features/history/MonthCalendar';
import { WeeklyChart } from '@/features/history/WeeklyChart';
import { useSelectedDate } from '@/store/selectedDate';

export default function HistoryScreen() {
  const { profile } = useProfile();
  // The tabs are only reachable with a profile; this covers the first render of the live query.
  if (!profile) return null;
  return <HistoryContent profile={profile} />;
}

function HistoryContent({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const targetsFor = useTargetsLookup(profile, today);
  const { select } = useSelectedDate();

  const targetKcalFor = (date: string) => targetsFor(date).kcal;

  /** Opens the day on Today, where it can be viewed and edited. */
  function openDay(date: string) {
    select(date);
    router.navigate('/');
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
      <View className="gap-4 px-4">
        <Text className="text-4xl font-bold text-text">{t('tabs.history')}</Text>
        <MonthCalendar today={today} targetKcalFor={targetKcalFor} onPressDay={openDay} />
        <WeeklyChart today={today} targetKcalFor={targetKcalFor} onPressDay={openDay} />
      </View>
    </ScrollView>
  );
}
