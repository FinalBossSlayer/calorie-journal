import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { type Food, type Portion, useFood } from '@/db/queries/foods';
import { addEntry, type LogEntry, type Meal, softDeleteEntry, updateEntry, useEntry, useMeals } from '@/db/queries/log';
import { DEFAULT_MEAL_IDS } from '@/db/defaults';
import { Button } from '@/features/common/Button';
import { HeaderAction } from '@/features/common/HeaderAction';
import { foodTags } from '@/features/foods/foodTags';
import { LogFoodForm } from '@/features/foods/LogFoodForm';
import { myVersionHref, recipeHref } from '@/features/recipes/recipeRoute';
import { GRAMS_UNIT, type LogFormInput } from '@/features/foods/logFormSchema';
import { formatNutrient, localizedName } from '@/i18n/format';
import { defaultMealId, rescaleSnapshot } from '@/lib/logging';
import { scaleNutrients } from '@/lib/nutrition';
import { useSelectedDate } from '@/store/selectedDate';

type Params = {
  id: string;
  /** Add mode: meal to preselect. */
  meal?: string;
  /** Edit mode: the entry being changed. */
  entryId?: string;
};

/** Food detail: log it (add mode), or change/delete an existing entry of it (edit mode). */
export default function FoodScreen() {
  const { t } = useTranslation();
  const { id, meal, entryId } = useLocalSearchParams<Params>();
  const food = useFood(id);
  const meals = useMeals();
  const entry = useEntry(entryId ?? '');
  const editing = entryId !== undefined;

  const loaded = food.loaded && meals.loaded && (!editing || entry.loaded);
  let body = null;
  if (loaded) {
    if (!food.food || (editing && !entry.entry)) {
      body = <Text className="p-4 text-base text-text-muted">{t('logFood.notFound')}</Text>;
    } else if (entry.entry) {
      body = <EditEntry food={food.food} portions={food.portions} meals={meals.meals} entry={entry.entry} />;
    } else {
      body = <AddEntry food={food.food} portions={food.portions} meals={meals.meals} mealParam={meal} />;
    }
  }

  // Your own foods can be changed from here; past entries keep their snapshot.
  const ownFood = !editing && food.food?.source === 'user' && food.food.deletedAt === null;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: editing ? t('logFood.editTitle') : t('addFood.title'),
          headerRight: ownFood
            ? () => (
                <HeaderAction
                  label={t('customFood.edit')}
                  onPress={() =>
                    router.push(
                      food.food?.kind === 'recipe'
                        ? recipeHref(id)
                        : { pathname: '/custom-food/[id]', params: { id } },
                    )
                  }
                />
              )
            : undefined,
        }}
      />
      {body}
    </View>
  );
}

type FormProps = { food: Food; portions: Portion[]; meals: Meal[] };

function AddEntry({ food, portions, meals, mealParam }: FormProps & { mealParam: string | undefined }) {
  const { t } = useTranslation();
  const { date } = useSelectedDate();

  const visible = meals.filter((m) => !m.isHidden);
  const mealId = visible.some((m) => m.id === mealParam)
    ? mealParam
    : defaultMealId(meals, new Date().getHours(), DEFAULT_MEAL_IDS);
  // Dishes are eaten by the piece or plate; ingredients are weighed.
  const firstPortion = food.kind === 'dish' || food.kind === 'recipe' ? portions[0] : undefined;
  const initial: LogFormInput = firstPortion
    ? { unit: firstPortion.id, amount: '1', mealId: mealId ?? '' }
    : { unit: GRAMS_UNIT, amount: '100', mealId: mealId ?? '' };

  return (
    <LogFoodForm
      header={<FoodHeader food={food} canCopy />}
      portions={portions}
      meals={visible}
      initial={initial}
      nutrientsFor={(grams) => scaleNutrients(food, grams)}
      incomplete={food.incompleteNutrients ?? []}
      submitLabel={t('logFood.add')}
      onSubmit={async (values) => {
        await addEntry(date, food, values);
        router.dismissAll();
      }}
    />
  );
}

function EditEntry({ food, portions, meals, entry }: FormProps & { entry: LogEntry }) {
  const { t } = useTranslation();

  const portion = portions.find((p) => p.id === entry.portionId);
  const initial: LogFormInput = portion
    ? { unit: portion.id, amount: String(entry.quantity ?? 1), mealId: entry.mealId }
    : { unit: GRAMS_UNIT, amount: String(Math.round(entry.grams * 10) / 10), mealId: entry.mealId };

  const confirmDelete = () => {
    Alert.alert(
      t('logFood.deleteTitle'),
      t('logFood.deleteBody', { name: localizedName(food.nameMk, food.nameEn) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('logFood.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            // Leave first: the live query would otherwise flash "not found".
            router.back();
            void softDeleteEntry(entry.id);
          },
        },
      ],
    );
  };

  return (
    <LogFoodForm
      header={<FoodHeader food={food} />}
      portions={portions}
      // A hidden meal stays selectable for entries already in it.
      meals={meals.filter((m) => !m.isHidden || m.id === entry.mealId)}
      initial={initial}
      nutrientsFor={(grams) => rescaleSnapshot(entry, entry.grams, grams)}
      incomplete={entry.incompleteNutrients ?? []}
      submitLabel={t('common.save')}
      onSubmit={async (values) => {
        await updateEntry(entry, values);
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}

/** `canCopy`: offer "Make my version" for seed dishes (not while editing an entry). */
function FoodHeader({ food, canCopy = false }: { food: Food; canCopy?: boolean }) {
  const { t } = useTranslation();
  return (
    <View className="gap-1">
      <Text className="text-3xl font-bold text-text">{localizedName(food.nameMk, food.nameEn)}</Text>
      <Text className="text-sm text-text-muted">
        {foodTags(t, food)} · {formatNutrient(food.kcal)} {t('units.kcal')} {t('logFood.per100g')}
      </Text>
      {canCopy && food.source === 'seed' ? (
        <View className="items-start pt-2">
          <Button
            label={t('recipe.makeMyVersion')}
            variant="secondary"
            size="small"
            onPress={() => router.push(myVersionHref(food.id))}
          />
        </View>
      ) : null}
    </View>
  );
}
