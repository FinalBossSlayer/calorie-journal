import { Text, TextInput, View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
};

/** Labelled one-line text input, e.g. a food name. */
export function TextField({ label, value, onChangeText, onBlur, error, hint, placeholder, maxLength, autoFocus }: Props) {
  const { colors } = useThemeColors();
  return (
    <View className="gap-1">
      <Text className="text-sm text-text-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={`rounded-card border-2 bg-surface px-4 py-3 text-lg text-text ${
          error ? 'border-over' : 'border-border'
        }`}
      />
      {error ? (
        <Text className="text-sm text-over">{error}</Text>
      ) : hint ? (
        <Text className="text-sm text-text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
