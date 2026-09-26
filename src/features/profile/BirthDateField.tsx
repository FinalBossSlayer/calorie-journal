import { useTranslation } from 'react-i18next';

import { DateField } from '@/features/common/DateField';
import { todayString, yearsBefore } from '@/lib/dates';

import { AGE_RANGE } from './profileSchema';

type Props = {
  value: string | undefined;
  onChange: (date: string) => void;
  invalid: boolean;
};

/** Date picker limited to the supported age range; used by onboarding and "Edit profile". */
export function BirthDateField({ value, onChange, invalid }: Props) {
  const { t } = useTranslation();
  const today = todayString();

  return (
    <DateField
      value={value}
      onChange={onChange}
      initial={yearsBefore(today, 30)}
      // One day past the max-age birthday is still AGE_RANGE.max years old.
      min={yearsBefore(today, AGE_RANGE.max + 1)}
      max={yearsBefore(today, AGE_RANGE.min)}
      error={invalid ? t('onboarding.birthDate.error', AGE_RANGE) : undefined}
    />
  );
}
