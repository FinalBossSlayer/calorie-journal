import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { DayEntry, Meal } from '@/db/queries/log';
import { formatNumber, formatNutrient, localizedName } from '@/i18n/format';
import type { MealGroup } from '@/lib/day';

/** One meal: name and total kcal, then each logged food with its grams and kcal. */
export function MealCard({ group }: { group: MealGroup<Meal, DayEntry> }) {
  const { t } = useTranslation();
  const { meal, entries, totals } = group;
  const empty = entries.length === 0;

  return (
    <View className="gap-3 rounded-card bg-surface p-4">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="flex-1 text-lg font-bold text-text">{localizedName(meal.nameMk, meal.nameEn)}</Text>
        {empty ? null : (
          <Text className="text-lg font-bold text-text">
            {formatNutrient(totals.values.kcal, totals.incomplete.includes('kcal'))}
            <Text className="text-sm font-normal text-text-muted"> {t('units.kcal')}</Text>
          </Text>
        )}
      </View>

      {empty ? (
        <Text className="text-sm text-text-muted">{t('today.nothingLogged')}</Text>
      ) : (
        entries.map((e) => (
          <View key={e.id} className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
            <View className="flex-1">
              <Text className="text-base text-text" numberOfLines={2}>
                {localizedName(e.foodNameMk, e.foodNameEn)}
              </Text>
              <Text className="text-xs text-text-muted">
                {formatNumber(e.grams)} {t('units.g')}
              </Text>
            </View>
            <Text className="text-base font-bold text-text">
              {formatNutrient(e.kcal, e.incompleteNutrients?.includes('kcal') ?? false)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
