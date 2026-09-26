import { useTranslation } from 'react-i18next';

import { ACTIVITY_LEVELS, type ActivityLevel } from '@/db/schema';
import { ChoiceList } from '@/features/common/ChoiceList';

type Props = {
  value: ActivityLevel | undefined;
  onChange: (value: ActivityLevel) => void;
};

/** Activity levels with plain-language descriptions instead of multipliers. */
export function ActivityChoices({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <ChoiceList
      choices={ACTIVITY_LEVELS.map((a) => ({
        value: a,
        label: t(`activity.${a}.title`),
        description: t(`activity.${a}.description`),
      }))}
      value={value}
      onChange={onChange}
    />
  );
}
