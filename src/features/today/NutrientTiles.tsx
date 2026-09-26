import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatNumber, formatNutrient } from '@/i18n/format';
import { type NutrientTotals, nutrientProgress } from '@/lib/day';
import type { Nutrient } from '@/lib/nutrition';
import { TARGET_KIND, type Targets } from '@/lib/targets';

// Full class names (not built from strings) so Tailwind can find them.
const MACROS = [
  { key: 'protein', text: 'text-protein', bar: 'bg-protein' },
  { key: 'carbs', text: 'text-carbs', bar: 'bg-carbs' },
  { key: 'fat', text: 'text-fat', bar: 'bg-fat' },
] as const satisfies readonly { key: Nutrient; text: string; bar: string }[];

const LIMITS = ['fiber', 'sugar', 'salt'] as const satisfies readonly Nutrient[];

/** Salt is small enough that a decimal matters. */
const DIGITS: Partial<Record<Nutrient, number>> = { salt: 1 };

type Props = { totals: NutrientTotals; targets: Targets };

/** Three macro tiles: eaten / target with a progress bar in the macro's color. */
export function MacroTiles({ totals, targets }: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-3">
      {MACROS.map((m) => {
        const value = totals.values[m.key];
        const { fraction } = nutrientProgress(m.key, value, targets[m.key]);
        return (
          <View key={m.key} className="flex-1 gap-2 rounded-card bg-surface p-3">
            <Text className="text-xs text-text-muted">{t(`nutrients.${m.key}`)}</Text>
            <Text className={`text-2xl font-bold ${m.text}`} numberOfLines={1} adjustsFontSizeToFit>
              {formatNutrient(value, totals.incomplete.includes(m.key))}
              <Text className="text-sm font-normal text-text-muted">
                {' '}
                / {formatNumber(targets[m.key])} {t('units.g')}
              </Text>
            </Text>
            <View className="h-1.5 overflow-hidden rounded-full bg-border">
              <View className={`h-full rounded-full ${m.bar}`} style={{ width: `${fraction * 100}%` }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Compact fiber (at least) / sugar and salt (at most) row. Limits turn "over" when passed. */
export function LimitsRow({ totals, targets }: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row rounded-card bg-surface px-3 py-2.5">
      {LIMITS.map((n) => {
        const value = totals.values[n];
        const { over } = nutrientProgress(n, value, targets[n]);
        const digits = DIGITS[n] ?? 0;
        return (
          <View key={n} className="flex-1 gap-0.5">
            <Text className="text-xs text-text-muted">
              {t(`nutrients.${n}`)} · {t(`targetKind.${TARGET_KIND[n] === 'min' ? 'min' : 'max'}`)}
            </Text>
            <Text className={`text-base font-bold ${over ? 'text-over' : 'text-text'}`}>
              {formatNutrient(value, totals.incomplete.includes(n), digits)}
              <Text className="text-xs font-normal text-text-muted">
                {' '}
                / {formatNumber(targets[n], digits)} {t('units.g')}
              </Text>
            </Text>
          </View>
        );
      })}
    </View>
  );
}
