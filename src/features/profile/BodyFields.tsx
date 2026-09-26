import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { NumberField } from '@/features/common/NumberField';

import { useProfileForm } from './useProfileForm';
import { HEIGHT_RANGE_CM, WEIGHT_RANGE_KG } from './profileSchema';

/** Height and weight inputs bound to the profile form. */
export function BodyFields() {
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const height = useController({ control, name: 'heightCm' });
  const weight = useController({ control, name: 'weightKg' });

  return (
    <View className="gap-4">
      <NumberField
        label={t('onboarding.body.height')}
        unit={t('units.cm')}
        placeholder="175"
        value={height.field.value}
        onChangeText={height.field.onChange}
        onBlur={height.field.onBlur}
        error={height.fieldState.error && t('onboarding.body.heightError', HEIGHT_RANGE_CM)}
      />
      <NumberField
        label={t('onboarding.body.weight')}
        unit={t('units.kg')}
        placeholder="75"
        value={weight.field.value}
        onChangeText={weight.field.onChange}
        onBlur={weight.field.onBlur}
        error={weight.fieldState.error && t('onboarding.body.weightError', WEIGHT_RANGE_KG)}
      />
    </View>
  );
}
