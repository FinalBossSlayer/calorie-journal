import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/features/common/Button';
import { newCustomFoodHref } from '@/features/foods/customFoodRoute';
import { FoodSearch } from '@/features/foods/FoodSearch';
import { recipeHref } from '@/features/recipes/recipeRoute';

/** Browse and log foods, and create your own foods and recipes. */
export default function FoodsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 gap-4 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="gap-3 px-4">
        <Text className="text-4xl font-bold text-text">{t('tabs.foods')}</Text>
        <View className="flex-row gap-2">
          <Button
            label={t('customFood.newFood')}
            variant="secondary"
            size="small"
            onPress={() => router.push(newCustomFoodHref())}
          />
          <Button
            label={t('recipe.newRecipe')}
            variant="secondary"
            size="small"
            onPress={() => router.push(recipeHref())}
          />
        </View>
      </View>
      <FoodSearch
        onSelect={(food) => router.push({ pathname: '/food/[id]', params: { id: food.id } })}
        onCreate={(query) => router.push(newCustomFoodHref(query))}
      />
    </View>
  );
}
