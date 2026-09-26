import { Text, TextInput, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

type Props = {
  label: string;
  unit: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

/** Big numeric input with a unit, e.g. "180 cm". Value stays text; parsing happens in the form schema. */
export function NumberField({ label, unit, value, onChangeText, onBlur, error, placeholder, autoFocus }: Props) {
  const { colors } = useThemeColors();
  return (
    <View className="gap-1">
      <Text className="text-sm text-text-muted">{label}</Text>
      <View
        className={`flex-row items-baseline gap-2 rounded-card border-2 bg-surface px-4 py-2 ${
          error ? 'border-over' : 'border-border'
        }`}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          maxLength={6}
          className="flex-1 text-3xl font-bold text-text"
        />
        <Text className="text-lg text-text-muted">{unit}</Text>
      </View>
      {error ? <Text className="text-sm text-over">{error}</Text> : null}
    </View>
  );
}
