import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { addSampleDay, clearDay, useDayLog } from '@/db/queries/log';
import { type Profile, useProfile } from '@/db/queries/profile';
import { useTargetsForDate } from '@/db/queries/targets';
import { Button } from '@/features/common/Button';
import { DateHeader } from '@/features/today/DateHeader';
import { formatNumber } from '@/i18n/format';
import { sumNutrients } from '@/lib/day';
import { useSelectedDate } from '@/store/selectedDate';

export default function TodayScreen() {
  const { profile } = useProfile();
  // The tabs are only reachable with a profile; this covers the first render of the live query.
  if (!profile) return null;
  return <TodayContent profile={profile} />;
}

function TodayContent({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { date, today } = useSelectedDate();
  const { entries } = useDayLog(date);
  const targets = useTargetsForDate(profile, date, today);
  const totals = sumNutrients(entries);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
      <View className="gap-4 px-4">
        <DateHeader />
        {/* TEMPORARY (step 3): plain readout until the ring, tiles and meal cards land. */}
        <View className="rounded-card border border-border bg-surface p-4">
          <Text className="text-base text-text-muted">
            {t('dev.dayReadout', {
              count: entries.length,
              kcal: totals.values.kcal === null ? '—' : formatNumber(totals.values.kcal),
              target: formatNumber(targets.kcal),
            })}
          </Text>
        </View>
        {__DEV__ ? (
          <>
            <Button label={t('dev.addSampleDay')} variant="secondary" onPress={() => void addSampleDay(date)} />
            <Button label={t('dev.clearDay')} variant="secondary" onPress={() => void clearDay(date)} />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
