import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OnboardingStep } from '@/features/profile/OnboardingStep';
import { useProfileForm } from '@/features/profile/useProfileForm';
import { ActivityChoices } from '@/features/profile/ActivityChoices';

export default function ActivityStep() {
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const { field } = useController({ control, name: 'activityLevel' });

  return (
    <OnboardingStep
      step={4}
      title={t('onboarding.activity.title')}
      subtitle={t('onboarding.activity.subtitle')}
      canContinue={field.value !== undefined}>
      <ActivityChoices value={field.value} onChange={field.onChange} />
    </OnboardingStep>
  );
}
