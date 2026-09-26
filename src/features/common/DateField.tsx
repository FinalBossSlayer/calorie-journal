import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';

import { currentLanguage, intlLocale } from '@/i18n';
import { fromDateString, toDateString } from '@/lib/dates';

type Props = {
  value: string | undefined; // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  /** Where the picker opens when no date is chosen yet. */
  initial: string;
  min: string;
  max: string;
  error?: string;
};

/**
 * Android: a button that opens the native date dialog (starting on the year list,
 * handy for birth dates). Other platforms: an inline spinner.
 */
export function DateField({ value, onChange, initial, min, max, error }: Props) {
  const { t } = useTranslation();
  const date = fromDateString(value ?? initial);
  const minimumDate = fromDateString(min);
  const maximumDate = fromDateString(max);

  if (Platform.OS !== 'android') {
    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="spinner"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onValueChange={(_e, d) => onChange(toDateString(d))}
      />
    );
  }

  function open() {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      minimumDate,
      maximumDate,
      startOnYearSelection: true,
      // Only fires when the user picks a date. Cancel / back / tapping outside goes to
      // onDismiss instead, which we don't need: the previous date simply stays.
      onValueChange: (_e, d) => onChange(toDateString(d)),
    });
  }

  const label = value
    ? fromDateString(value).toLocaleDateString(intlLocale[currentLanguage()], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : t('common.selectDate');

  return (
    <View className="gap-1">
      <Pressable
        accessibilityRole="button"
        onPress={open}
        className={`rounded-card border-2 bg-surface px-4 py-4 active:opacity-80 ${
          error ? 'border-over' : 'border-border'
        }`}>
        <Text className={`text-2xl font-bold ${value ? 'text-text' : 'text-text-muted'}`}>{label}</Text>
      </Pressable>
      {error ? <Text className="text-sm text-over">{error}</Text> : null}
    </View>
  );
}
