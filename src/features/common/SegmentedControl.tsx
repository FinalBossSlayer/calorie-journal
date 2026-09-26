import { Pressable, Text, View } from 'react-native';

import type { Choice } from './ChoiceList';

type Props<T extends string> = {
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Compact single-select for 2–3 short options (settings). */
export function SegmentedControl<T extends string>({ choices, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className="flex-row gap-1 rounded-card border border-border bg-background p-1">
      {choices.map((c) => {
        const selected = c.value === value;
        return (
          <Pressable
            key={c.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(c.value)}
            className={`flex-1 items-center rounded-lg px-2 py-2 active:opacity-80 ${
              selected ? 'bg-surface' : ''
            }`}>
            <Text className={`text-sm ${selected ? 'font-bold text-text' : 'text-text-muted'}`}>{c.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
