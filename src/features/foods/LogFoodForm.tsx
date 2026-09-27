import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Portion } from '@/db/queries/foods';
import type { Meal } from '@/db/queries/log';
import { Button } from '@/features/common/Button';
import { ChipGroup } from '@/features/common/ChipGroup';
import { NumberField } from '@/features/common/NumberField';
import { useFormat } from '@/i18n/format';
import { MAX_ENTRY_GRAMS } from '@/lib/logging';
import type { Nutrient, NutrientValues } from '@/lib/nutrition';

import {
  amountFromInput,
  GRAMS_UNIT,
  type LogFormInput,
  logFormSchema,
  type LogFormValues,
  portionFor,
} from './logFormSchema';
import { NutrientPreview } from './NutrientPreview';

type Props = {
  /** Food name and details, shown above the form. */
  header: ReactNode;
  portions: readonly Portion[];
  meals: readonly Meal[];
  initial: LogFormInput;
  /** Nutrients for a given amount (from the food when adding, from the entry's snapshot when editing). */
  nutrientsFor: (grams: number) => NutrientValues;
  incomplete: readonly Nutrient[];
  submitLabel: string;
  onSubmit: (values: LogFormValues) => Promise<void>;
  /** Edit mode only: shows a secondary Delete button. */
  onDelete?: () => void;
};

/** Amount (portion or grams), live nutrient preview, meal, and the save button. */
export function LogFoodForm({
  header,
  portions,
  meals,
  initial,
  nutrientsFor,
  incomplete,
  submitLabel,
  onSubmit,
  onDelete,
}: Props) {
  const { formatNumber, localizedName } = useFormat();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const form = useForm<LogFormInput, unknown, LogFormValues>({
    resolver: zodResolver(logFormSchema(portions)),
    mode: 'onTouched',
    defaultValues: initial,
  });
  const { control, setValue } = form;
  const unitField = useController({ control, name: 'unit' });
  const amountField = useController({ control, name: 'amount' });
  const mealField = useController({ control, name: 'mealId' });
  const [unit, amountText] = useWatch({ control, name: ['unit', 'amount'] });

  const amount = amountFromInput({ unit, amount: amountText }, portions);
  const portion = portionFor(unit, portions);

  // Switching unit keeps the amount sensible: grams carry over, portions start at 1.
  const changeUnit = (next: string) => {
    if (next === unit) return;
    const text = next === GRAMS_UNIT ? (amount ? String(Math.round(amount.grams)) : '100') : '1';
    unitField.field.onChange(next);
    setValue('amount', text, { shouldValidate: form.formState.isSubmitted });
  };

  const submit = form.handleSubmit(onSubmit);

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 p-4">
        {header}

        {portions.length > 0 ? (
          <ChipGroup
            accessibilityLabel={t('logFood.unit')}
            value={unit}
            onChange={changeUnit}
            choices={[
              { value: GRAMS_UNIT, label: t('logFood.grams') },
              ...portions.map((p) => ({
                value: p.id,
                label: `${localizedName(p.nameMk, p.nameEn)} · ${formatNumber(p.grams)} ${t('units.g')}`,
              })),
            ]}
          />
        ) : null}

        <View className="gap-1">
          <NumberField
            label={portion ? t('logFood.quantity') : t('logFood.amount')}
            unit={portion ? '×' : t('units.g')}
            value={amountField.field.value}
            onChangeText={amountField.field.onChange}
            onBlur={amountField.field.onBlur}
            error={amountField.fieldState.error && t('logFood.amountError', { max: formatNumber(MAX_ENTRY_GRAMS) })}
          />
          {portion && amount ? (
            <Text className="text-sm text-text-muted">
              = {formatNumber(amount.grams)} {t('units.g')}
            </Text>
          ) : null}
        </View>

        <NutrientPreview values={amount ? nutrientsFor(amount.grams) : null} incomplete={incomplete} />

        <View className="gap-3">
          <Text className="text-xl font-bold text-text">{t('logFood.meal')}</Text>
          <ChipGroup
            accessibilityLabel={t('logFood.meal')}
            value={mealField.field.value}
            onChange={mealField.field.onChange}
            choices={meals.map((m) => ({ value: m.id, label: localizedName(m.nameMk, m.nameEn) }))}
          />
        </View>

        {onDelete ? <Button label={t('logFood.delete')} variant="secondary" onPress={onDelete} /> : null}
      </ScrollView>
      <View className="px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label={submitLabel} onPress={() => void submit()} disabled={form.formState.isSubmitting} />
      </View>
    </KeyboardAvoidingView>
  );
}
