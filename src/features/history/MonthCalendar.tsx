import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useDayTotals } from '@/db/queries/history';
import { useIntlLocale } from '@/i18n';
import { useFormat } from '@/i18n/format';
import { fromDateString } from '@/lib/dates';
import { type DayStatus, type DayTotal, dayStatus, gridRange, monthGrid, monthOf, shiftMonth } from '@/lib/history';

import { PeriodNav } from './PeriodNav';
import { WEEKDAYS } from './weekdays';

/** Dot color per status. 'none' has no dot. */
export const STATUS_DOT: Record<Exclude<DayStatus, 'none'>, string> = {
  ok: 'bg-accent',
  over: 'bg-over',
  unknown: 'bg-text-muted',
};

type Props = {
  today: string;
  targetKcalFor: (date: string) => number;
  onPressDay: (date: string) => void;
};

/** A month of days, each marked by how it went against its calorie target. */
export function MonthCalendar({ today, targetKcalFor, onPressDay }: Props) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(() => monthOf(today));
  const weeks = monthGrid(month);
  const { from, to } = gridRange(weeks);
  const { totals } = useDayTotals(from, to);

  const locale = useIntlLocale();
  const title = fromDateString(`${month}-01`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  return (
    <View className="gap-3 rounded-card border border-border bg-surface p-3">
      <PeriodNav
        title={title}
        previousLabel={t('history.previousMonth')}
        nextLabel={t('history.nextMonth')}
        onPrevious={() => setMonth(shiftMonth(month, -1))}
        onNext={() => setMonth(shiftMonth(month, 1))}
        canGoNext={month < monthOf(today)}
      />

      <View className="flex-row">
        {WEEKDAYS.map((day) => (
          <Text key={day} className="flex-1 text-center text-xs text-text-muted">
            {t(`history.weekdays.${day}`)}
          </Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0]} className="flex-row">
          {week.map((date) =>
            monthOf(date) === month ? (
              <DayCell
                key={date}
                date={date}
                today={today}
                total={totals.get(date)}
                status={dayStatus(totals.get(date), targetKcalFor(date))}
                onPress={() => onPressDay(date)}
              />
            ) : (
              <View key={date} className="flex-1" />
            ),
          )}
        </View>
      ))}

      <Legend />
    </View>
  );
}

type DayCellProps = {
  date: string;
  today: string;
  total: DayTotal | undefined;
  status: DayStatus;
  onPress: () => void;
};

function DayCell({ date, today, total, status, onPress }: DayCellProps) {
  const { t } = useTranslation();
  const { formatNutrient } = useFormat();
  const future = date > today;
  const isToday = date === today;
  const day = Number(date.slice(8));
  const label =
    status === 'none' || !total
      ? String(day)
      : t('history.dayWithKcal', {
          day,
          kcal: formatNutrient(total.kcal, total.incomplete),
          status: t(`history.status.${status}`),
        });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: future }}
      disabled={future}
      onPress={onPress}
      className="flex-1 items-center gap-1 py-1.5 active:opacity-70">
      <View
        className={`h-8 w-8 items-center justify-center ${isToday ? 'border border-accent' : ''}`}
        style={{ borderRadius: 16 }}>
        <Text className={`text-sm ${future ? 'text-border' : 'text-text'} ${isToday ? 'font-bold' : ''}`}>{day}</Text>
      </View>
      {status === 'none' ? <View style={DOT_SIZE} /> : <Dot className={STATUS_DOT[status]} />}
    </Pressable>
  );
}

function Legend() {
  const { t } = useTranslation();
  return (
    <View className="flex-row flex-wrap justify-center gap-x-4 gap-y-1">
      {(['ok', 'over', 'unknown'] as const).map((s) => (
        <View key={s} className="flex-row items-center gap-1.5">
          <Dot className={STATUS_DOT[s]} />
          <Text className="text-xs text-text-muted">{t(`history.status.${s}`)}</Text>
        </View>
      ))}
    </View>
  );
}

const DOT_SIZE = { width: 6, height: 6 };

/** Explicit radius: `rounded-full` rendered these tiny views as squares on Android. */
function Dot({ className }: { className: string }) {
  return <View className={className} style={{ ...DOT_SIZE, borderRadius: 3 }} />;
}
