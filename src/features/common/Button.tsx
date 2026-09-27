import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  /** 'primary' is the one accent button per screen. */
  variant?: 'primary' | 'secondary';
  /** 'small' for buttons next to a title or inside a list. */
  size?: 'large' | 'small';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', size = 'large', disabled = false }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`items-center rounded-card active:opacity-80 ${size === 'small' ? 'px-4 py-2' : 'px-6 py-4'} ${
        primary ? 'bg-accent' : 'border border-border'
      } ${disabled ? 'opacity-40' : ''}`}>
      <Text className={`font-bold ${size === 'small' ? 'text-sm' : 'text-base'} ${primary ? 'text-on-accent' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
