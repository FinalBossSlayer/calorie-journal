import { Pressable, Text, View } from 'react-native';

export type Choice<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
};

type Props<T extends string | number> = {
  choices: readonly Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/** Single-select list of cards. The selected card gets an accent border. */
export function ChoiceList<T extends string | number>({ choices, value, onChange }: Props<T>) {
  return (
    <View accessibilityRole="radiogroup" className="gap-3">
      {choices.map((c) => {
        const selected = c.value === value;
        return (
          <Pressable
            key={String(c.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(c.value)}
            className={`rounded-card border-2 bg-surface p-4 active:opacity-80 ${
              selected ? 'border-accent' : 'border-border'
            }`}>
            <Text className="text-lg font-bold text-text">{c.label}</Text>
            {c.description ? (
              <Text className="mt-1 text-sm text-text-muted">{c.description}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
