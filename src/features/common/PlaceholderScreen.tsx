import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** Temporary screen body used until each tab gets its real content. */
export function PlaceholderScreen({ title, description, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
      <View className="gap-4 px-4">
        <Text className="text-4xl font-bold text-text">{title}</Text>
        <View className="rounded-card border border-border bg-surface p-4">
          <Text className="text-base text-text-muted">{description}</Text>
        </View>
        {children}
      </View>
    </ScrollView>
  );
}
