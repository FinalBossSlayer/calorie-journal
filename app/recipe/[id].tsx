import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, View } from 'react-native';

import { type LoadedRecipe, loadRecipe, saveRecipe, softDeleteUserFood } from '@/db/queries/userFoods';
import { RecipeForm } from '@/features/recipes/RecipeForm';
import { cloneRecipeInput, emptyRecipeInput, recipeToInput } from '@/features/recipes/recipeInput';
import { NEW_RECIPE_ID } from '@/features/recipes/recipeRoute';
import i18n, { currentLanguage } from '@/i18n';
import { localizedName } from '@/i18n/format';

type Params = {
  id: string;
  /** New recipe only: the seed dish to copy ("Make my version"). */
  from?: string;
};

/** Loading, then the recipe (null = not found). Errors go to the route's error boundary. */
type LoadState =
  | { status: 'loading' }
  | { status: 'done'; recipe: LoadedRecipe | null }
  | { status: 'error'; error: unknown };

/** Create a recipe (empty, or as a copy of a seed dish) or edit one of the user's recipes. */
export default function RecipeScreen() {
  const { t } = useTranslation();
  const { id, from } = useLocalSearchParams<Params>();
  const isNew = id === NEW_RECIPE_ID;
  // What to read first: the recipe being edited, or the dish being copied.
  const loadId = isNew ? (from ?? null) : id;
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  // Read once, not live: the form keeps its own copy while editing.
  useEffect(() => {
    if (loadId === null) return;
    let cancelled = false;
    loadRecipe(loadId).then(
      (recipe) => !cancelled && setState({ status: 'done', recipe }),
      (error: unknown) => !cancelled && setState({ status: 'error', error }),
    );
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  if (state.status === 'error') throw state.error;

  let title = t('recipe.editTitle');
  let body = null;
  if (loadId === null) {
    title = t('recipe.newTitle');
    body = <NewRecipe />;
  } else if (isNew) {
    title = t('recipe.myVersionTitle');
    if (state.status === 'done') {
      const { recipe } = state;
      body =
        recipe?.food.source === 'seed' ? (
          <MyVersion source={recipe} />
        ) : (
          <Text className="p-4 text-base text-text-muted">{t('recipe.notFound')}</Text>
        );
    }
  } else if (state.status === 'done') {
    const { recipe } = state;
    const editable =
      recipe?.food.source === 'user' && recipe.food.kind === 'recipe' && recipe.food.deletedAt === null;
    body = editable ? (
      <EditRecipe recipe={recipe} />
    ) : (
      <Text className="p-4 text-base text-text-muted">{t('recipe.notFound')}</Text>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title }} />
      {body}
    </View>
  );
}

function NewRecipe() {
  const { t } = useTranslation();
  const language = currentLanguage();
  return (
    <RecipeForm
      initial={emptyRecipeInput()}
      recipeId={null}
      submitLabel={t('common.save')}
      onSubmit={async (values) => {
        const id = await saveRecipe(null, values, language);
        router.replace({ pathname: '/food/[id]', params: { id } });
      }}
    />
  );
}

/** "Make my version": a new user recipe pre-filled from a seed dish. Nothing is saved until Save. */
function MyVersion({ source }: { source: LoadedRecipe }) {
  const { t } = useTranslation();
  const language = currentLanguage();
  // Each name gets the suffix in its own language.
  const suffix = {
    mk: i18n.getFixedT('mk')('recipe.myVersionSuffix'),
    en: i18n.getFixedT('en')('recipe.myVersionSuffix'),
  };
  const [initial] = useState(() => cloneRecipeInput(source, language, suffix));

  return (
    <RecipeForm
      initial={initial}
      recipeId={null}
      note={t('recipe.myVersionNote', { name: localizedName(source.food.nameMk, source.food.nameEn) })}
      submitLabel={t('common.save')}
      onSubmit={async (values) => {
        const id = await saveRecipe(null, values, language, source.food.id);
        router.replace({ pathname: '/food/[id]', params: { id } });
      }}
    />
  );
}

function EditRecipe({ recipe }: { recipe: LoadedRecipe }) {
  const { t } = useTranslation();
  const language = currentLanguage();
  const { food } = recipe;

  const confirmDelete = () => {
    Alert.alert(
      t('recipe.deleteTitle'),
      t('recipe.deleteBody', { name: localizedName(food.nameMk, food.nameEn) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('recipe.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            // Leave first: the screens below would otherwise show a deleted recipe.
            router.dismissAll();
            void softDeleteUserFood(food.id);
          },
        },
      ],
    );
  };

  return (
    <RecipeForm
      initial={recipeToInput(recipe, language)}
      recipeId={food.id}
      submitLabel={t('common.save')}
      onSubmit={async (values) => {
        await saveRecipe(food.id, values, language);
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}
