import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BirthDateField } from '@/features/profile/BirthDateField';
import { OnboardingStep } from '@/features/profile/OnboardingStep';
import { useProfileForm } from '@/features/profile/useProfileForm';

export default function BirthDateStep() {
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const { field, fieldState } = useController({ control, name: 'birthDate' });

  return (
    <OnboardingStep
      step={2}
      title={t('onboarding.birthDate.title')}
      subtitle={t('onboarding.birthDate.subtitle')}
      canContinue={field.value !== undefined}>
      <BirthDateField value={field.value} onChange={field.onChange} invalid={fieldState.error !== undefined} />
    </OnboardingStep>
  );
}
