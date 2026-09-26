import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { SEXES } from '@/db/schema';
import { ChoiceList } from '@/features/common/ChoiceList';
import { OnboardingStep } from '@/features/profile/OnboardingStep';
import { useProfileForm } from '@/features/profile/useProfileForm';

export default function SexStep() {
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const { field } = useController({ control, name: 'sex' });

  return (
    <OnboardingStep
      step={1}
      title={t('onboarding.sex.title')}
      subtitle={t('onboarding.sex.subtitle')}
      canContinue={field.value !== undefined}>
      <ChoiceList
        choices={SEXES.map((s) => ({ value: s, label: t(`sex.${s}`) }))}
        value={field.value}
        onChange={field.onChange}
      />
    </OnboardingStep>
  );
}
