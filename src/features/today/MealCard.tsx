import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { DayEntry, Meal } from '@/db/queries/log';
import { formatNumber, formatNutrient, localizedName } from '@/i18n/format';
import type { MealGroup } from '@/lib/day';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * One meal: name, total kcal and a "+" to add food to it, then each logged
 * food with its grams and kcal. Tapping a food opens it for editing.
 */
export function MealCard({ group }: { group: MealGroup<Meal, DayEntry> }) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { meal, entries, totals } = group;
  const empty = entries.length === 0;
  const mealName = localizedName(meal.nameMk, meal.nameEn);

  return (
    <View className="gap-3 rounded-card bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-lg font-bold text-text">{mealName}</Text>
        {empty ? null : (
          <Text className="text-lg font-bold text-text">
            {formatNutrient(totals.values.kcal, totals.incomplete.includes('kcal'))}
            <Text className="text-sm font-normal text-text-muted"> {t('units.kcal')}</Text>
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('today.addToMeal', { meal: mealName })}
          hitSlop={8}
          onPress={() => router.push({ pathname: '/add-food', params: { meal: meal.id } })}
          className="active:opacity-60">
          <Ionicons name="add-circle-outline" size={26} color={colors.textMuted} />
        </Pressable>
      </View>

      {empty ? (
        <Text className="text-sm text-text-muted">{t('today.nothingLogged')}</Text>
      ) : (
        entries.map((e) => (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={t('today.editEntry', { name: localizedName(e.foodNameMk, e.foodNameEn) })}
            onPress={() => router.push({ pathname: '/food/[id]', params: { id: e.foodId, entryId: e.id } })}
            className="flex-row items-center justify-between gap-3 border-t border-border pt-3 active:opacity-60">
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
          </Pressable>
        ))
      )}
    </View>
  );
}
