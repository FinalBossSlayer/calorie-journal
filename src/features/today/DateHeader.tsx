import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';

import { IconButton } from '@/features/common/IconButton';
import { useIntlLocale } from '@/i18n';
import { fromDateString, relativeDay, shiftDate, toDateString } from '@/lib/dates';
import { useSelectedDate } from '@/store/selectedDate';

/** Earliest day the picker offers. Arbitrary, just keeps the calendar sensible. */
const MIN_DATE = '2020-01-01';

/** ‹ Today › with a tap-to-pick date and a shortcut back to today. */
export function DateHeader() {
  const { t } = useTranslation();
  const { date, today, isToday, select } = useSelectedDate();

  const d = fromDateString(date);
  const locale = useIntlLocale();
  const fullDate = d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() !== fromDateString(today).getFullYear() && { year: 'numeric' }),
  });
  const relative = relativeDay(date, today);
  const title = relative ? t(`date.${relative}`) : fullDate;

  function openPicker() {
    // The app targets Android; other platforms just use the arrows.
    if (Platform.OS !== 'android') return;
    DateTimePickerAndroid.open({
      value: d,
      mode: 'date',
      minimumDate: fromDateString(MIN_DATE),
      maximumDate: fromDateString(today),
      onValueChange: (_e, picked) => select(toDateString(picked)),
    });
  }

  return (
    <View className="flex-row items-center gap-2">
      <IconButton
        icon="chevron-back"
        label={t('date.previousDay')}
        onPress={() => select(shiftDate(date, -1))}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('date.pickDate')}
        onPress={openPicker}
        className="flex-1 items-center active:opacity-70">
        <Text className="text-2xl font-bold text-text" numberOfLines={1}>
          {title}
        </Text>
        {relative ? <Text className="text-xs text-text-muted">{fullDate}</Text> : null}
      </Pressable>
      <IconButton
        icon="chevron-forward"
        label={t('date.nextDay')}
        disabled={isToday}
        onPress={() => select(shiftDate(date, 1))}
      />
      {isToday ? null : (
        <Pressable
          accessibilityRole="button"
          onPress={() => select(today)}
          className="rounded-card border border-border px-3 py-1.5 active:opacity-70">
          <Text className="text-sm font-bold text-text">{t('date.today')}</Text>
        </Pressable>
      )}
    </View>
  );
}
