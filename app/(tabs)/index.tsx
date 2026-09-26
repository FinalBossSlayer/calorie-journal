import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useDayLog } from '@/db/queries/log';
import { type Profile, useProfile } from '@/db/queries/profile';
import { useTargetsForDate } from '@/db/queries/targets';
import { Button } from '@/features/common/Button';
import { CalorieRing } from '@/features/today/CalorieRing';
import { DateHeader } from '@/features/today/DateHeader';
import { MealCard } from '@/features/today/MealCard';
import { LimitsRow, MacroTiles } from '@/features/today/NutrientTiles';
import { groupByMeal, sumNutrients } from '@/lib/day';
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
  const { entries, meals, loaded } = useDayLog(date);
  const targets = useTargetsForDate(profile, date, today);

  const totals = sumNutrients(entries);
  const groups = groupByMeal(meals, entries);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
      <View className="gap-4 px-4">
        <DateHeader />
        {loaded ? (
          <>
            <CalorieRing
              eatenKcal={totals.values.kcal}
              incomplete={totals.incomplete.includes('kcal')}
              targetKcal={targets.kcal}
              mode={profile.ringMode}
            />
            <MacroTiles totals={totals} targets={targets} />
            <LimitsRow totals={totals} targets={targets} />
            {totals.incomplete.length > 0 ? (
              <Text className="text-xs text-text-muted">{t('today.incompleteNote')}</Text>
            ) : null}

            <Button label={t('today.addFood')} onPress={() => router.push('/add-food')} />

            {groups.map((g) => (
              <MealCard key={g.meal.id} group={g} />
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
