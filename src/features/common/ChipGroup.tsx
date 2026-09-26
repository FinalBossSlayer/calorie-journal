import { Pressable, Text, View } from 'react-native';

import type { Choice } from './ChoiceList';

type Props<T extends string> = {
  choices: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Single-select pills that wrap onto more lines: for lists of any length (portions, meals). */
export function ChipGroup<T extends string>({ choices, value, onChange, accessibilityLabel }: Props<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} className="flex-row flex-wrap gap-2">
      {choices.map((c) => {
        const selected = c.value === value;
        return (
          <Pressable
            key={c.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(c.value)}
            className={`rounded-full border-2 px-4 py-2 active:opacity-80 ${
              selected ? 'border-accent bg-surface' : 'border-border'
            }`}>
            <Text className={`text-sm ${selected ? 'font-bold text-text' : 'text-text-muted'}`}>{c.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
