import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useThemeColors } from '@/theme/useThemeColors';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.today'), tabBarIcon: tabIcon('today-outline') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: t('tabs.history'), tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="foods"
        options={{ title: t('tabs.foods'), tabBarIcon: tabIcon('restaurant-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('person-outline') }}
      />
    </Tabs>
  );
}
