import Ionicons from '@expo/vector-icons/Ionicons';
import { Controller, useFieldArray, useFormContext, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/features/common/Button';
import { formatNumber } from '@/i18n/format';
import { MAX_ENTRY_GRAMS } from '@/lib/logging';
import { useThemeColors } from '@/theme/useThemeColors';

import { emptyPortion, MAX_PORTION_NAME_LENGTH, type PortionInput } from './customFoodSchema';

/** Any form with a `portions` list (custom foods, recipes). */
type WithPortions = { portions: PortionInput[] };

/** Editable list of portions ("1 slice = 30 g"). Must be inside a FormProvider. */
export function PortionsEditor() {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const { control } = useFormContext<WithPortions>();
  const { fields, append, remove } = useFieldArray({ control, name: 'portions' });
  const { errors } = useFormState({ control, name: 'portions' });

  const inputClass = 'rounded-card border-2 bg-surface px-3 py-2 text-base text-text';

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-xl font-bold text-text">{t('portions.title')}</Text>
        <Text className="text-sm text-text-muted">{t('portions.hint')}</Text>
      </View>

      {fields.map((field, i) => {
        const rowErrors = errors.portions?.[i];
        return (
          <View key={field.id} className="gap-1">
            <View className="flex-row items-center gap-2">
              <Controller
                control={control}
                name={`portions.${i}.name`}
                render={({ field: f }) => (
                  <TextInput
                    accessibilityLabel={t('portions.name')}
                    value={f.value}
                    onChangeText={f.onChange}
                    onBlur={f.onBlur}
                    placeholder={t('portions.namePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    maxLength={MAX_PORTION_NAME_LENGTH}
                    className={`flex-1 ${inputClass} ${rowErrors?.name ? 'border-over' : 'border-border'}`}
                  />
                )}
              />
              <Controller
                control={control}
                name={`portions.${i}.grams`}
                render={({ field: f }) => (
                  <TextInput
                    accessibilityLabel={t('portions.grams')}
                    value={f.value}
                    onChangeText={f.onChange}
                    onBlur={f.onBlur}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    maxLength={6}
                    className={`w-20 text-right ${inputClass} ${rowErrors?.grams ? 'border-over' : 'border-border'}`}
                  />
                )}
              />
              <Text className="text-base text-text-muted">{t('units.g')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('portions.remove')}
                hitSlop={8}
                onPress={() => remove(i)}
                className="p-1 active:opacity-60">
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            {rowErrors ? (
              <Text className="text-sm text-over">{t('portions.error', { max: formatNumber(MAX_ENTRY_GRAMS) })}</Text>
            ) : null}
          </View>
        );
      })}

      <View className="items-start">
        <Button label={t('portions.add')} variant="secondary" size="small" onPress={() => append(emptyPortion())} />
      </View>
    </View>
  );
}
