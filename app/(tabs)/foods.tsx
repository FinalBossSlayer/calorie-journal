import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodSearch } from '@/features/foods/FoodSearch';

/** Browse and log foods. Will also hold the user's own foods and recipes. */
export default function FoodsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 gap-4 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <Text className="px-4 text-4xl font-bold text-text">{t('tabs.foods')}</Text>
      <FoodSearch onSelect={(food) => router.push({ pathname: '/food/[id]', params: { id: food.id } })} />
    </View>
  );
}
