import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { newCustomFoodHref } from '@/features/foods/customFoodRoute';
import { FoodSearch } from '@/features/foods/FoodSearch';

/** Search step of "Add food". `meal` (optional) preselects the meal on the next screen. */
export default function AddFoodScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { meal } = useLocalSearchParams<{ meal?: string }>();

  return (
    <View className="flex-1 bg-background pt-4">
      <Stack.Screen options={{ headerShown: true, title: t('addFood.title') }} />
      <FoodSearch
        autoFocus
        bottomInset={insets.bottom}
        onSelect={(food) =>
          router.push({ pathname: '/food/[id]', params: meal ? { id: food.id, meal } : { id: food.id } })
        }
        onCreate={(query) => router.push(newCustomFoodHref(query, meal))}
      />
    </View>
  );
}
