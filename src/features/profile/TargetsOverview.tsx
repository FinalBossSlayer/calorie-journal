import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useFormat } from '@/i18n/format';
import type { Nutrient } from '@/lib/nutrition';
import { TARGET_KIND, type TargetResult } from '@/lib/targets';

const MACROS = [
  { key: 'protein', color: 'text-protein' },
  { key: 'carbs', color: 'text-carbs' },
  { key: 'fat', color: 'text-fat' },
] as const satisfies readonly { key: Nutrient; color: string }[];

const LIMITS = ['fiber', 'sugar', 'salt'] as const satisfies readonly Nutrient[];

type Props = {
  result: TargetResult;
  /** When set, each target is tappable (Profile tab: edit / override). */
  onPressTarget?: (nutrient: Nutrient) => void;
};

/** Daily targets: big kcal, three macro tiles, and a compact fiber/sugar/salt row. */
export function TargetsOverview({ result, onPressTarget }: Props) {
  const { formatNumber } = useFormat();
  const { t } = useTranslation();
  const { targets } = result;
  const custom = (n: Nutrient) => result.overridden.includes(n);
  const kcalOverridden = custom('kcal');

  return (
    <View className="gap-3">
      <Tile nutrient="kcal" onPress={onPressTarget} custom={kcalOverridden}>
        <Text className="text-5xl font-bold text-text">{formatNumber(targets.kcal)}</Text>
        <Text className="text-sm text-text-muted">
          {t('units.kcal')} {t('targets.perDay')}
        </Text>
      </Tile>

      <View className="flex-row gap-3">
        {MACROS.map((m) => (
          <Tile key={m.key} nutrient={m.key} onPress={onPressTarget} custom={custom(m.key)} flex>
            <Text className={`text-2xl font-bold ${m.color}`}>
              {formatNumber(targets[m.key])}
              <Text className="text-base"> {t('units.g')}</Text>
            </Text>
            <Text className="text-xs text-text-muted">{t(`nutrients.${m.key}`)}</Text>
          </Tile>
        ))}
      </View>

      <View className="flex-row gap-3">
        {LIMITS.map((n) => (
          <Tile key={n} nutrient={n} onPress={onPressTarget} custom={custom(n)} flex compact>
            <Text className="text-xs text-text-muted">
              {t(`nutrients.${n}`)} · {t(`targetKind.${TARGET_KIND[n] === 'min' ? 'min' : 'max'}`)}
            </Text>
            <Text className="text-lg font-bold text-text">
              {formatNumber(targets[n], 1)} {t('units.g')}
            </Text>
          </Tile>
        ))}
      </View>

      {result.overridden.length > 0 ? (
        <View className="flex-row items-center gap-2">
          <CustomDot />
          <Text className="text-xs text-text-muted">{t('targets.custom')}</Text>
        </View>
      ) : null}

      {result.belowFloor ? (
        <View className="rounded-card border border-over bg-surface p-4">
          <Text className="text-sm text-over">
            {t('targets.belowFloor', { min: formatNumber(result.minKcal) })}
          </Text>
        </View>
      ) : null}

      {/* The clamp only concerns the calculated kcal; irrelevant once the user set their own. */}
      {result.clamped && !kcalOverridden ? (
        <View className="gap-1 rounded-card border border-border bg-surface p-4">
          <Text className="text-base font-bold text-text">{t('targets.clampedTitle')}</Text>
          <Text className="text-sm text-text-muted">
            {t('targets.clampedBody', {
              kcal: formatNumber(result.unclampedKcal),
              min: formatNumber(result.minKcal),
            })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type TileProps = {
  nutrient: Nutrient;
  onPress?: (nutrient: Nutrient) => void;
  flex?: boolean;
  compact?: boolean;
  /** Shows the "custom value" dot. */
  custom?: boolean;
  children: ReactNode;
};

function Tile({ nutrient, onPress, flex, compact, custom, children }: TileProps) {
  const className = `rounded-card border border-border bg-surface ${compact ? 'p-3' : 'p-4'} ${
    flex ? 'flex-1' : ''
  }`;
  const content = (
    <>
      {children}
      {custom ? (
        <View className="absolute right-2 top-2">
          <CustomDot />
        </View>
      ) : null}
    </>
  );
  if (!onPress) return <View className={className}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(nutrient)}
      className={`${className} active:opacity-80`}>
      {content}
    </Pressable>
  );
}

function CustomDot() {
  return <View className="h-2 w-2 rounded-full bg-accent" />;
}
