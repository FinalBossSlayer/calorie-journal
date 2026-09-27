import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type FoodSearchRow, getFood } from '@/db/queries/foods';
import { nutrientsOf } from '@/db/queries/userFoods';
import { FoodSearch } from '@/features/foods/FoodSearch';
import { useIngredientPickerStore } from '@/store/ingredientPicker';

/** Search for an ingredient; picking one goes back to the recipe builder, which adds it. */
export default function AddIngredientScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { exclude } = useLocalSearchParams<{ exclude?: string }>();
  const [error, setError] = useState<unknown>(null);

  // Surface database errors to the route's error boundary.
  if (error) throw error;

  const select = async (row: FoodSearchRow) => {
    try {
      const food = await getFood(row.id);
      if (!food) return;
      useIngredientPickerStore
        .getState()
        .pick({ foodId: food.id, nameMk: food.nameMk, nameEn: food.nameEn, per100g: nutrientsOf(food) });
      router.back();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <View className="flex-1 bg-background pt-4">
      <Stack.Screen options={{ headerShown: true, title: t('recipe.addIngredientTitle') }} />
      <FoodSearch autoFocus bottomInset={insets.bottom} excludeId={exclude} onSelect={(row) => void select(row)} />
    </View>
  );
}
