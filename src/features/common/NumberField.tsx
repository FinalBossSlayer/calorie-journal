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
  /**
   * Smaller, for fields side by side. The error only turns the border red:
   * the parent shows the message under the whole row.
   */
  compact?: boolean;
};

/** Big numeric input with a unit, e.g. "180 cm". Value stays text; parsing happens in the form schema. */
export function NumberField({
  label,
  unit,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  autoFocus,
  compact = false,
}: Props) {
  const { colors } = useThemeColors();
  return (
    <View className="gap-1">
      <Text className="text-sm text-text-muted" numberOfLines={1}>
        {label}
      </Text>
      <View
        className={`flex-row items-baseline rounded-card border-2 bg-surface ${
          compact ? 'gap-1 px-3 py-1' : 'gap-2 px-4 py-2'
        } ${error ? 'border-over' : 'border-border'}`}>
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
          className={`flex-1 font-bold text-text ${compact ? 'text-xl' : 'text-3xl'}`}
        />
        <Text className={`text-text-muted ${compact ? 'text-sm' : 'text-lg'}`}>{unit}</Text>
      </View>
      {error && !compact ? <Text className="text-sm text-over">{error}</Text> : null}
    </View>
  );
}
