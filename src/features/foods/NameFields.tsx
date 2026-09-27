import type { TFunction } from 'i18next';
import { Controller, type FieldError, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { TextField } from '@/features/common/TextField';
import { MAX_NAME_LENGTH } from '@/lib/customFood';

/** Any form with the two name fields (custom foods, recipes). */
type WithNames = { nameMk: string; nameEn: string };

/** Macedonian and English name; one is enough. Must be inside a FormProvider. */
export function NameFields() {
  const { t } = useTranslation();
  const { control } = useFormContext<WithNames>();
  return (
    <View className="gap-3">
      <Controller
        control={control}
        name="nameMk"
        render={({ field, fieldState }) => (
          <TextField
            label={t('customFood.nameMk')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={MAX_NAME_LENGTH}
            error={nameErrorText(t, fieldState.error)}
          />
        )}
      />
      <Controller
        control={control}
        name="nameEn"
        render={({ field, fieldState }) => (
          <TextField
            label={t('customFood.nameEn')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={MAX_NAME_LENGTH}
            hint={t('customFood.nameHint')}
            error={nameErrorText(t, fieldState.error)}
          />
        )}
      />
    </View>
  );
}

function nameErrorText(t: TFunction, error: FieldError | undefined): string | undefined {
  if (!error) return undefined;
  return error.message === 'range'
    ? t('customFood.nameTooLong', { max: MAX_NAME_LENGTH })
    : t('customFood.nameRequired');
}
