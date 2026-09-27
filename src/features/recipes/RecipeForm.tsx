import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/features/common/Button';
import { NumberField } from '@/features/common/NumberField';
import { NameFields } from '@/features/foods/NameFields';
import { NutrientPreview } from '@/features/foods/NutrientPreview';
import { PortionsEditor } from '@/features/foods/PortionsEditor';
import { formatNumber, formatNutrient, localizedName } from '@/i18n/format';
import { MAX_COOKED_WEIGHT_G, MAX_INGREDIENT_GRAMS, recipePreview, type RecipeNutrition } from '@/lib/recipe';
import { useIngredientPickerStore } from '@/store/ingredientPicker';
import { useThemeColors } from '@/theme/useThemeColors';

import { addIngredientHref } from './recipeRoute';
import { cookedWeightG, ingredientGrams, type RecipeInput, recipeSchema, type RecipeValues } from './recipeSchema';

type Props = {
  initial: RecipeInput;
  /** The recipe being edited (left out of the ingredient search), or null for a new one. */
  recipeId: string | null;
  /** Shown above the form, e.g. what a copy was made from. */
  note?: string;
  submitLabel: string;
  onSubmit: (values: RecipeValues) => Promise<void>;
  /** Edit mode only: shows a secondary Delete button. */
  onDelete?: () => void;
};

/** Recipe builder: names, ingredients with grams, cooked weight, live per-100g result, portions. */
export function RecipeForm({ initial, recipeId, note, submitLabel, onSubmit, onDelete }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const form = useForm<RecipeInput, unknown, RecipeValues>({
    resolver: zodResolver(recipeSchema),
    mode: 'onTouched',
    defaultValues: initial,
  });
  const { control } = form;

  const [ingredients, cookedText] = useWatch({ control, name: ['ingredients', 'cookedWeight'] });
  const preview = recipePreview(
    ingredients.map((ing) => ({ grams: ingredientGrams(ing.grams), per100g: ing.per100g })),
    cookedWeightG(cookedText),
  );

  const submit = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 p-4">
          {note ? <Text className="text-sm text-text-muted">{note}</Text> : null}
          <NameFields />
          <IngredientList onAdd={() => router.push(addIngredientHref(recipeId))} />
          <CookedWeightField rawWeightG={preview?.rawWeightG ?? null} />
          <RecipeResult preview={preview} />
          <PortionsEditor />
          {onDelete ? <Button label={t('recipe.delete')} variant="secondary" onPress={onDelete} /> : null}
        </ScrollView>
        <View className="px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <Button label={submitLabel} onPress={() => void submit()} disabled={form.formState.isSubmitting} />
        </View>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

function IngredientList({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { control, formState, getValues } = useFormContext<RecipeInput>();
  // The only useFieldArray for 'ingredients': two of them on one list don't stay in sync.
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });
  const values = useWatch({ control, name: 'ingredients' });

  // Coming back from "Add ingredient": add the picked food and put the cursor in its amount.
  useFocusEffect(
    useCallback(() => {
      const picked = useIngredientPickerStore.getState().take();
      if (!picked) return;
      const index = getValues('ingredients').length;
      append({ rowId: null, ...picked, grams: '' }, { focusName: `ingredients.${index}.grams` });
    }, [append, getValues]),
  );

  // With no rows the list error sits on the array itself; with rows, on its root.
  const listError = formState.errors.ingredients?.message ?? formState.errors.ingredients?.root?.message;

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-xl font-bold text-text">{t('recipe.ingredients')}</Text>
        <Text className="text-sm text-text-muted">{t('recipe.ingredientsHint')}</Text>
      </View>

      {fields.length === 0 ? (
        <Text className={`text-base ${listError ? 'text-over' : 'text-text-muted'}`}>
          {listError ? t('recipe.ingredientsRequired') : t('recipe.noIngredients')}
        </Text>
      ) : null}

      {fields.map((field, i) => {
        const value = values[i] ?? field;
        const name = localizedName(value.nameMk, value.nameEn);
        const grams = ingredientGrams(value.grams);
        const kcal = grams !== null && value.per100g.kcal !== null ? (value.per100g.kcal * grams) / 100 : null;
        const error = formState.errors.ingredients?.[i]?.grams;
        return (
          <View key={field.id} className="gap-1 border-b border-border pb-3">
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Text className="text-base text-text" numberOfLines={2}>
                  {name}
                </Text>
                <Text className="text-xs text-text-muted">
                  {formatNutrient(kcal)} {t('units.kcal')}
                </Text>
              </View>
              <Controller
                control={control}
                name={`ingredients.${i}.grams`}
                render={({ field: f }) => (
                  <TextInput
                    ref={f.ref}
                    accessibilityLabel={t('recipe.ingredientAmount', { name })}
                    value={f.value}
                    onChangeText={f.onChange}
                    onBlur={f.onBlur}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    maxLength={6}
                    className={`w-20 rounded-card border-2 bg-surface px-3 py-2 text-right text-base font-bold text-text ${
                      error ? 'border-over' : 'border-border'
                    }`}
                  />
                )}
              />
              <Text className="text-base text-text-muted">{t('units.g')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('recipe.removeIngredient', { name })}
                hitSlop={8}
                onPress={() => remove(i)}
                className="p-1 active:opacity-60">
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            {error ? (
              <Text className="text-sm text-over">
                {t('recipe.ingredientError', { max: formatNumber(MAX_INGREDIENT_GRAMS) })}
              </Text>
            ) : null}
          </View>
        );
      })}

      <View className="items-start">
        <Button label={t('recipe.addIngredient')} variant="secondary" size="small" onPress={onAdd} />
      </View>
    </View>
  );
}

function CookedWeightField({ rawWeightG }: { rawWeightG: number | null }) {
  const { t } = useTranslation();
  const { control } = useFormContext<RecipeInput>();
  return (
    <View className="gap-1">
      <Controller
        control={control}
        name="cookedWeight"
        render={({ field, fieldState }) => (
          <NumberField
            label={t('recipe.cookedWeight')}
            unit={t('units.g')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder={rawWeightG !== null ? formatNumber(rawWeightG) : '—'}
            error={
              fieldState.error && t('recipe.cookedWeightError', { max: formatNumber(MAX_COOKED_WEIGHT_G) })
            }
          />
        )}
      />
      {rawWeightG !== null ? (
        <Text className="text-sm text-text-muted">{t('recipe.rawWeight', { grams: formatNumber(rawWeightG) })}</Text>
      ) : null}
      <Text className="text-sm text-text-muted">{t('recipe.cookedWeightHint')}</Text>
    </View>
  );
}

function RecipeResult({ preview }: { preview: RecipeNutrition | null }) {
  const { t } = useTranslation();
  const incomplete = preview?.incompleteNutrients ?? [];
  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-text">{t('recipe.result')}</Text>
      <NutrientPreview values={preview?.per100g ?? null} incomplete={incomplete} />
      {preview ? (
        <Text className="text-sm text-text-muted">
          {t('recipe.wholePot', {
            kcal: formatNutrient(preview.totals.kcal, incomplete.includes('kcal')),
            grams: formatNumber(preview.finalWeightG),
          })}
        </Text>
      ) : (
        <Text className="text-sm text-text-muted">{t('recipe.resultEmpty')}</Text>
      )}
      {incomplete.length > 0 ? <Text className="text-sm text-text-muted">{t('recipe.incompleteNote')}</Text> : null}
    </View>
  );
}
