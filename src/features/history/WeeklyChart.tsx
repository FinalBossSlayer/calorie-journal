import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { BarChart, type barDataItem } from 'react-native-gifted-charts';

import { useDayTotals } from '@/db/queries/history';
import { useIntlLocale } from '@/i18n';
import { useFormat } from '@/i18n/format';
import { fromDateString, shiftDate } from '@/lib/dates';
import { chartMax, startOfWeek, weekSummary } from '@/lib/history';
import { useThemeColors } from '@/theme/useThemeColors';

import { PeriodNav } from './PeriodNav';
import { WEEKDAYS } from './weekdays';

const CHART_HEIGHT = 160;
const BAR_WIDTH = 22;
const Y_LABEL_WIDTH = 40;

type Props = {
  today: string;
  targetKcalFor: (date: string) => number;
  onPressDay: (date: string) => void;
};

/** Calories per day for one Monday–Sunday week, against the calorie target. */
export function WeeklyChart({ today, targetKcalFor, onPressDay }: Props) {
  const { t } = useTranslation();
  const { formatNumber, formatNutrient } = useFormat();
  const { colors } = useThemeColors();
  const locale = useIntlLocale();
  const [monday, setMonday] = useState(() => startOfWeek(today));
  // The chart needs a pixel width; measured from the card.
  const [width, setWidth] = useState(0);

  const sunday = shiftDate(monday, 6);
  const { totals } = useDayTotals(monday, sunday);
  const summary = weekSummary(monday, totals, targetKcalFor);
  // The line shows the latest target of the week; each bar is still judged by its own day's target.
  const target = targetKcalFor(sunday < today ? sunday : today);
  const maxValue = chartMax(summary.bars, target);

  const dayMonth = (date: string) => fromDateString(date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const title = monday === startOfWeek(today) ? t('history.thisWeek') : `${dayMonth(monday)} – ${dayMonth(sunday)}`;

  const data: barDataItem[] = summary.bars.map((bar, i) => ({
    value: bar.kcal ?? 0,
    label: t(`history.weekdays.${WEEKDAYS[i]}`),
    frontColor: bar.status === 'over' ? colors.over : colors.accent,
  }));

  const plotWidth = Math.max(width - Y_LABEL_WIDTH - 8, 0);
  const spacing = Math.max((plotWidth - 7 * BAR_WIDTH) / 7, 4);

  return (
    <View className="gap-3 rounded-card border border-border bg-surface p-3">
      <PeriodNav
        title={title}
        previousLabel={t('history.previousWeek')}
        nextLabel={t('history.nextWeek')}
        onPrevious={() => setMonday(shiftDate(monday, -7))}
        onNext={() => setMonday(shiftDate(monday, 7))}
        canGoNext={sunday < today}
      />

      <View className="gap-0.5">
        <Text className="text-4xl font-bold text-text">
          {formatNutrient(summary.average, summary.averageIncomplete)}
        </Text>
        <Text className="text-xs text-text-muted">
          {summary.average === null
            ? t('history.noDays')
            : t('history.averageLabel', { target: formatNumber(target) })}
        </Text>
      </View>

      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={summary.bars
          .map((b, i) => `${t(`history.weekdays.${WEEKDAYS[i]}`)} ${formatNutrient(b.kcal)} ${t('units.kcal')}`)
          .join(', ')}>
        {width > 0 ? (
          <BarChart
            data={data}
            height={CHART_HEIGHT}
            width={plotWidth}
            barWidth={BAR_WIDTH}
            spacing={spacing}
            initialSpacing={spacing / 2}
            endSpacing={spacing / 2}
            barBorderRadius={4}
            maxValue={maxValue}
            noOfSections={4}
            disableScroll
            yAxisLabelWidth={Y_LABEL_WIDTH}
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor={colors.border}
            rulesColor={colors.border}
            rulesType="solid"
            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            formatYLabel={(label) => formatNumber(Number(label))}
            showReferenceLine1
            referenceLine1Position={target}
            referenceLine1Config={{ color: colors.text, thickness: 1, dashWidth: 4, dashGap: 4 }}
            onPress={(_item: barDataItem, index: number) => {
              const date = summary.bars[index].date;
              if (date <= today) onPressDay(date);
            }}
          />
        ) : (
          <View style={{ height: CHART_HEIGHT + 30 }} />
        )}
      </View>
    </View>
  );
}
