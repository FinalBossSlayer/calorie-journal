import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';

import { currentLanguage, intlLocale } from '@/i18n';
import { fromDateString, relativeDay, shiftDate, toDateString } from '@/lib/dates';
import { useSelectedDate } from '@/store/selectedDate';
import { useThemeColors } from '@/theme/useThemeColors';

/** Earliest day the picker offers. Arbitrary, just keeps the calendar sensible. */
const MIN_DATE = '2020-01-01';

/** ‹ Today › with a tap-to-pick date and a shortcut back to today. */
export function DateHeader() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { date, today, isToday, select } = useSelectedDate();

  const d = fromDateString(date);
  const locale = intlLocale[currentLanguage()];
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
      <ArrowButton
        icon="chevron-back"
        label={t('date.previousDay')}
        color={colors.text}
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
      {isToday ? (
        <ArrowButton icon="chevron-forward" label={t('date.nextDay')} color={colors.border} disabled />
      ) : (
        <ArrowButton
          icon="chevron-forward"
          label={t('date.nextDay')}
          color={colors.text}
          onPress={() => select(shiftDate(date, 1))}
        />
      )}
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

type ArrowProps = {
  icon: 'chevron-back' | 'chevron-forward';
  label: string;
  color: string;
  onPress?: () => void;
  disabled?: boolean;
};

function ArrowButton({ icon, label, color, onPress, disabled }: ArrowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-card bg-surface active:opacity-70">
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}
