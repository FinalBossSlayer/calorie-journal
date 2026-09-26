import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ChoiceList } from '@/features/common/ChoiceList';
import { OnboardingStep } from '@/features/profile/OnboardingStep';
import { useProfileForm } from '@/features/profile/useProfileForm';
import i18n, { languages } from '@/i18n';

export default function LanguageStep() {
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const { field } = useController({ control, name: 'language' });

  return (
    <OnboardingStep step={0} title={t('onboarding.language.title')} subtitle={t('onboarding.language.subtitle')}>
      <ChoiceList
        choices={languages.map((l) => ({ value: l, label: t(`language.${l}`) }))}
        value={field.value}
        onChange={(l) => {
          field.onChange(l);
          void i18n.changeLanguage(l); // switch the UI right away
        }}
      />
    </OnboardingStep>
  );
}
