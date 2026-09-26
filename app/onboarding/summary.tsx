import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { saveProfile } from '@/db/queries/profile';
import { OnboardingStep } from '@/features/profile/OnboardingStep';
import { useProfileForm } from '@/features/profile/useProfileForm';
import { profileFormSchema } from '@/features/profile/profileSchema';
import { TargetsOverview } from '@/features/profile/TargetsOverview';
import { todayString } from '@/lib/dates';
import { computeTargets } from '@/lib/targets';

export default function SummaryStep() {
  const { t } = useTranslation();
  const { control, handleSubmit, formState } = useProfileForm();
  const values = useWatch({ control });

  // Every earlier step validated its own fields, so this parses.
  const parsed = profileFormSchema.safeParse(values);
  const result = parsed.success ? computeTargets(parsed.data, todayString()) : null;

  // Saving flips the guard in app/_layout.tsx, which switches to the tabs.
  const start = handleSubmit((v) => saveProfile(v));

  return (
    <OnboardingStep
      step={6}
      title={t('onboarding.summary.title')}
      subtitle={t('onboarding.summary.subtitle')}
      nextLabel={t('common.start')}
      canContinue={result !== null && !formState.isSubmitting}
      onNext={() => void start()}>
      {result ? <TargetsOverview result={result} /> : null}
    </OnboardingStep>
  );
}
