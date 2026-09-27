import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import type { RingMode } from '@/db/schema';
import { useFormat } from '@/i18n/format';
import { ringValues } from '@/lib/day';
import { useThemeColors } from '@/theme/useThemeColors';

const SIZE = 208;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LABEL_KEYS = { eaten: 'today.ringEaten', left: 'today.ringLeft', over: 'today.ringOver' } as const;

type Props = {
  eatenKcal: number | null;
  /** Some logged foods have unknown kcal, so eatenKcal is a lower bound. */
  incomplete: boolean;
  targetKcal: number;
  mode: RingMode;
};

/** Big calorie ring: fills with kcal eaten, turns the "over" color past the target. */
export function CalorieRing({ eatenKcal, incomplete, targetKcal, mode }: Props) {
  const { formatNumber, formatNutrient } = useFormat();
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const ring = ringValues(eatenKcal, targetKcal, mode);
  // "Left" is an upper bound when eaten is a lower bound, so only mark "≥" in eaten/over.
  const markIncomplete = incomplete && ring.label !== 'left';

  return (
    <View
      className="items-center justify-center self-center"
      style={{ width: SIZE, height: SIZE }}
      accessible
      accessibilityLabel={`${formatNutrient(ring.value, markIncomplete)} ${t(LABEL_KEYS[ring.label])}, ${t(
        'today.ofTarget',
        { target: formatNumber(targetKcal) },
      )}`}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
        {ring.fraction > 0 ? (
          // Start at 12 o'clock and fill clockwise.
          <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={ring.over ? colors.over : colors.accent}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ring.fraction)}
              fill="none"
            />
          </G>
        ) : null}
      </Svg>
      <Text className={`text-5xl font-bold ${ring.over ? 'text-over' : 'text-text'}`}>
        {formatNutrient(ring.value, markIncomplete)}
      </Text>
      <Text className="text-sm text-text-muted">{t(LABEL_KEYS[ring.label])}</Text>
      <Text className="mt-1 text-xs text-text-muted">{t('today.ofTarget', { target: formatNumber(targetKcal) })}</Text>
    </View>
  );
}
