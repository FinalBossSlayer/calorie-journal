import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { GoalFields } from '@/features/profile/GoalFields';
import { OnboardingStep } from '@/features/profile/OnboardingStep';
import { useProfileForm } from '@/features/profile/useProfileForm';

export default function GoalStep() {
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const { field } = useController({ control, name: 'goal' });

  return (
    <OnboardingStep step={5} title={t('onboarding.goal.title')} canContinue={field.value !== undefined}>
      <GoalFields />
    </OnboardingStep>
  );
}
