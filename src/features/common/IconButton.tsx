import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Read by screen readers: the button has no visible text. */
  label: string;
  onPress?: () => void;
  disabled?: boolean;
};

/** Square icon-only button, e.g. ‹ / › for stepping through days, weeks and months. */
export function IconButton({ icon, label, onPress, disabled = false }: Props) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-card bg-surface active:opacity-70">
      <Ionicons name={icon} size={22} color={disabled ? colors.border : colors.text} />
    </Pressable>
  );
}
