import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  /** 'primary' is the one accent button per screen. */
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`items-center rounded-card px-6 py-4 active:opacity-80 ${
        primary ? 'bg-accent' : 'border border-border'
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text className={`text-base font-bold ${primary ? 'text-on-accent' : 'text-text'}`}>{label}</Text>
    </Pressable>
  );
}
