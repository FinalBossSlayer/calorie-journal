import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useFormat } from '@/i18n/format';
import type { Nutrient, NutrientValues } from '@/lib/nutrition';

// Full class names (not built from strings) so Tailwind can find them. Same macro colors as Today.
const MACROS = [
  { key: 'protein', text: 'text-protein' },
  { key: 'carbs', text: 'text-carbs' },
  { key: 'fat', text: 'text-fat' },
] as const satisfies readonly { key: Nutrient; text: string }[];

const OTHERS = ['fiber', 'sugar', 'salt'] as const satisfies readonly Nutrient[];

const DIGITS: Partial<Record<Nutrient, number>> = { salt: 1 };

type Props = {
  /** null while the amount isn't valid: every value shows as "—". */
  values: NutrientValues | null;
  incomplete: readonly Nutrient[];
};

/** Nutrients for the amount being logged: big kcal, colored macros, then fiber/sugar/salt. */
export function NutrientPreview({ values, incomplete }: Props) {
  const { formatNutrient } = useFormat();
  const { t } = useTranslation();
  const show = (n: Nutrient) => formatNutrient(values?.[n] ?? null, incomplete.includes(n), DIGITS[n] ?? 0);

  return (
    <View className="gap-4 rounded-card bg-surface p-4">
      <Text className="text-4xl font-bold text-text">
        {show('kcal')}
        <Text className="text-lg font-normal text-text-muted"> {t('units.kcal')}</Text>
      </Text>
      <View className="flex-row gap-3">
        {MACROS.map((m) => (
          <View key={m.key} className="flex-1">
            <Text className="text-xs text-text-muted">{t(`nutrients.${m.key}`)}</Text>
            <Text className={`text-xl font-bold ${m.text}`}>
              {show(m.key)}
              <Text className="text-sm font-normal text-text-muted"> {t('units.g')}</Text>
            </Text>
          </View>
        ))}
      </View>
      <View className="flex-row gap-3 border-t border-border pt-3">
        {OTHERS.map((n) => (
          <View key={n} className="flex-1">
            <Text className="text-xs text-text-muted">{t(`nutrients.${n}`)}</Text>
            <Text className="text-base font-bold text-text">
              {show(n)}
              <Text className="text-xs font-normal text-text-muted"> {t('units.g')}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
