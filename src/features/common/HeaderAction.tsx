import { Pressable, Text } from 'react-native';

/** Text link for the right side of a stack header, e.g. "Edit". */
export function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={12} onPress={onPress} className="px-2 active:opacity-60">
      <Text className="text-base font-bold text-accent">{label}</Text>
    </Pressable>
  );
}
