import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { type Food, type Portion, useFood } from '@/db/queries/foods';
import { saveCustomFood, softDeleteUserFood } from '@/db/queries/userFoods';
import { CustomFoodForm } from '@/features/foods/CustomFoodForm';
import { type CustomFoodInput, emptyPortion } from '@/features/foods/customFoodSchema';
import { NEW_FOOD_ID } from '@/features/foods/customFoodRoute';
import { useLanguage } from '@/i18n';
import { useFormat } from '@/i18n/format';
import { type CustomFoodKind, CUSTOM_FOOD_KINDS } from '@/lib/customFood';
import { NUTRIENTS } from '@/lib/nutrition';
import { portionDisplayName } from '@/lib/portions';

type Params = {
  id: string;
  /** New food only: prefilled name, e.g. what was typed in search. */
  name?: string;
  /** New food only: meal to preselect when logging it right after. */
  meal?: string;
};

/** Create or edit one of the user's own foods. */
export default function CustomFoodScreen() {
  const { t } = useTranslation();
  const { id, name, meal } = useLocalSearchParams<Params>();
  const isNew = id === NEW_FOOD_ID;
  const food = useFood(isNew ? '' : id);

  let body = null;
  if (isNew) {
    body = <NewFood name={name ?? ''} meal={meal} />;
  } else if (food.loaded) {
    // Recipes have their own editor (app/recipe/[id].tsx).
    const editable =
      food.food?.source === 'user' && food.food.kind !== 'recipe' && food.food.deletedAt === null ? food.food : null;
    body = editable ? (
      <EditFood food={editable} portions={food.portions} />
    ) : (
      <Text className="p-4 text-base text-text-muted">{t('customFood.notFound')}</Text>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{ headerShown: true, title: isNew ? t('customFood.newTitle') : t('customFood.editTitle') }}
      />
      {body}
    </View>
  );
}

function NewFood({ name, meal }: { name: string; meal: string | undefined }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const trimmed = name.trim();
  const initial: CustomFoodInput = {
    nameMk: language === 'mk' ? trimmed : '',
    nameEn: language === 'en' ? trimmed : '',
    kind: 'product',
    nutrients: { kcal: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', salt: '' },
    portions: [emptyPortion()],
  };

  return (
    <CustomFoodForm
      initial={initial}
      submitLabel={t('common.save')}
      onSubmit={async (values) => {
        const id = await saveCustomFood(null, values, language);
        // Straight on to logging it.
        router.replace({ pathname: '/food/[id]', params: meal ? { id, meal } : { id } });
      }}
    />
  );
}

function EditFood({ food, portions }: { food: Food; portions: Portion[] }) {
  const { localizedName } = useFormat();
  const { t } = useTranslation();
  const language = useLanguage();

  const confirmDelete = () => {
    Alert.alert(
      t('customFood.deleteTitle'),
      t('customFood.deleteBody', { name: localizedName(food.nameMk, food.nameEn) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('customFood.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            // Leave first: the screens below would otherwise flash "not found".
            router.dismissAll();
            void softDeleteUserFood(food.id);
          },
        },
      ],
    );
  };

  return (
    <CustomFoodForm
      initial={toInput(food, portions, language)}
      submitLabel={t('common.save')}
      onSubmit={async (values) => {
        await saveCustomFood(food.id, values, language);
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}

function toInput(food: Food, portions: Portion[], language: 'mk' | 'en'): CustomFoodInput {
  const nutrients = Object.fromEntries(
    NUTRIENTS.map((n) => [n, food[n] === null ? '' : String(food[n])]),
  ) as CustomFoodInput['nutrients'];
  return {
    nameMk: food.nameMk ?? '',
    nameEn: food.nameEn ?? '',
    // User foods are only ever created with these kinds; fall back for safety.
    kind: (CUSTOM_FOOD_KINDS as readonly string[]).includes(food.kind) ? (food.kind as CustomFoodKind) : 'product',
    nutrients,
    portions: portions.map((p) => ({ portionId: p.id, name: portionDisplayName(p, language), grams: String(p.grams) })),
  };
}
