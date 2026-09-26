import { useTranslation } from 'react-i18next';

import { OnboardingStep } from '@/features/profile/OnboardingStep';
import { BodyFields } from '@/features/profile/BodyFields';

export default function BodyStep() {
  const { t } = useTranslation();
  return (
    <OnboardingStep step={3} title={t('onboarding.body.title')} subtitle={t('onboarding.body.subtitle')}>
      <BodyFields />
    </OnboardingStep>
  );
}
