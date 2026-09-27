import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { GOALS } from '@/db/schema';
import { ChoiceList } from '@/features/common/ChoiceList';
import { useFormat } from '@/i18n/format';
import { GOAL_RATES_KG_PER_WEEK, goalAdjustment } from '@/lib/targets';

import { useProfileForm } from './useProfileForm';

/** Goal choice, plus the weekly rate (hidden for "maintain"). */
export function GoalFields() {
  const { formatNumber } = useFormat();
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const goal = useController({ control, name: 'goal' });
  const rate = useController({ control, name: 'goalRateKgPerWeek' });
  const direction = goal.field.value;

  return (
    <View className="gap-6">
      <ChoiceList
        choices={GOALS.map((g) => ({ value: g, label: t(`goal.${g}`) }))}
        value={direction}
        onChange={goal.field.onChange}
      />

      {direction === 'lose' || direction === 'gain' ? (
        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-xl font-bold text-text">{t('onboarding.goal.rateTitle')}</Text>
            <Text className="text-sm text-text-muted">{t('onboarding.goal.rateHint')}</Text>
          </View>
          <ChoiceList
            choices={GOAL_RATES_KG_PER_WEEK.map((r) => {
              const kcal = formatNumber(Math.abs(goalAdjustment(direction, r)));
              return {
                value: r,
                label: t('goal.rate', { rate: r }),
                description: direction === 'lose' ? t('goal.rateLose', { kcal }) : t('goal.rateGain', { kcal }),
              };
            })}
            value={rate.field.value}
            onChange={rate.field.onChange}
          />
        </View>
      ) : null}
    </View>
  );
}
