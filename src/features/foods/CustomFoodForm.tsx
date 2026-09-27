import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { Controller, type FieldError, FormProvider, useForm, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/features/common/Button';
import { ChipGroup } from '@/features/common/ChipGroup';
import { NumberField } from '@/features/common/NumberField';
import { type Format, useFormat } from '@/i18n/format';
import { CUSTOM_FOOD_KINDS, NUTRIENT_MAX_PER_100G } from '@/lib/customFood';
import type { Nutrient } from '@/lib/nutrition';

import { type CustomFoodError, type CustomFoodInput, customFoodSchema, type CustomFoodValues } from './customFoodSchema';
import { NameFields } from './NameFields';
import { PortionsEditor } from './PortionsEditor';

// Side by side in rows of three: macros first (same order as everywhere else), then the rest.
const NUTRIENT_ROWS = [
  ['protein', 'carbs', 'fat'],
  ['fiber', 'sugar', 'salt'],
] as const satisfies readonly (readonly Nutrient[])[];

type Props = {
  initial: CustomFoodInput;
  submitLabel: string;
  onSubmit: (values: CustomFoodValues) => Promise<void>;
  /** Edit mode only: shows a secondary Delete button. */
  onDelete?: () => void;
};

/** Name, kind, nutrients per 100 g and portions of a food the user types in. */
export function CustomFoodForm({ initial, submitLabel, onSubmit, onDelete }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const form = useForm<CustomFoodInput, unknown, CustomFoodValues>({
    resolver: zodResolver(customFoodSchema),
    mode: 'onTouched',
    defaultValues: initial,
  });
  const { control } = form;
  const submit = form.handleSubmit(onSubmit);

  return (
    <FormProvider {...form}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 p-4">
          <NameFields />

          <View className="gap-3">
            <Text className="text-sm text-text-muted">{t('customFood.kind')}</Text>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <ChipGroup
                  accessibilityLabel={t('customFood.kind')}
                  value={field.value}
                  onChange={field.onChange}
                  choices={CUSTOM_FOOD_KINDS.map((k) => ({ value: k, label: t(`customFood.kinds.${k}`) }))}
                />
              )}
            />
          </View>

          <NutrientFields />

          <PortionsEditor />

          {onDelete ? <Button label={t('customFood.delete')} variant="secondary" onPress={onDelete} /> : null}
        </ScrollView>
        <View className="px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <Button label={submitLabel} onPress={() => void submit()} disabled={form.formState.isSubmitting} />
        </View>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

function NutrientFields() {
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const { errors } = useFormState<CustomFoodInput>({ name: 'nutrients' });

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-xl font-bold text-text">{t('customFood.per100g')}</Text>
        <Text className="text-sm text-text-muted">{t('customFood.unknownHint')}</Text>
      </View>

      <NutrientField nutrient="kcal" />

      {NUTRIENT_ROWS.map((row) => {
        const messages = row.flatMap((n) => {
          const text = nutrientErrorText(t, formatNumber, n, errors.nutrients?.[n]);
          return text ? [text] : [];
        });
        return (
          <View key={row.join()} className="gap-1">
            <View className="flex-row gap-3">
              {row.map((n) => (
                <View key={n} className="flex-1">
                  <NutrientField nutrient={n} compact />
                </View>
              ))}
            </View>
            {messages.map((m) => (
              <Text key={m} className="text-sm text-over">
                {m}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function NutrientField({ nutrient, compact = false }: { nutrient: Nutrient; compact?: boolean }) {
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  return (
    <Controller<CustomFoodInput, `nutrients.${Nutrient}`>
      name={`nutrients.${nutrient}`}
      render={({ field, fieldState }) => (
        <NumberField
          label={t(`nutrients.${nutrient}`)}
          unit={nutrient === 'kcal' ? t('units.kcal') : t('units.g')}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          placeholder="—"
          compact={compact}
          error={nutrientErrorText(t, formatNumber, nutrient, fieldState.error)}
        />
      )}
    />
  );
}

function nutrientErrorText(
  t: TFunction,
  formatNumber: Format['formatNumber'],
  nutrient: Nutrient,
  error: FieldError | undefined,
): string | undefined {
  if (!error) return undefined;
  switch (error.message as CustomFoodError) {
    case 'required':
      return t('customFood.kcalRequired');
    case 'macroSum':
      return t('customFood.macroSum');
    case 'sugarOverCarbs':
      return t('customFood.sugarOverCarbs');
    default:
      return t('customFood.nutrientRange', {
        nutrient: t(`nutrients.${nutrient}`),
        max: formatNumber(NUTRIENT_MAX_PER_100G[nutrient]),
      });
  }
}
