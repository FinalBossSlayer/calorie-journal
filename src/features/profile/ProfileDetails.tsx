import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { Profile } from '@/db/queries/profile';
import { Button } from '@/features/common/Button';
import { useFormat } from '@/i18n/format';
import { ageOn } from '@/lib/targets';

type Props = { profile: Profile; today: string };

/** Read-only summary of the profile, with a link to the edit screen. */
export function ProfileDetails({ profile, today }: Props) {
  const { formatNumber } = useFormat();
  const { t } = useTranslation();

  const goal =
    profile.goal === 'maintain'
      ? t('goal.maintain')
      : `${t(`goal.${profile.goal}`)} · ${t('goal.rate', { rate: profile.goalRateKgPerWeek })}`;

  const rows = [
    { label: t('onboarding.sex.title'), value: t(`sex.${profile.sex}`) },
    { label: t('profile.age'), value: t('profile.ageYears', { count: ageOn(profile.birthDate, today) }) },
    { label: t('onboarding.body.height'), value: `${formatNumber(profile.heightCm, 1)} ${t('units.cm')}` },
    { label: t('onboarding.body.weight'), value: `${formatNumber(profile.weightKg, 1)} ${t('units.kg')}` },
    { label: t('profile.activity'), value: t(`activity.${profile.activityLevel}.title`) },
    { label: t('profile.goal'), value: goal },
  ];

  return (
    <View className="gap-3">
      <View className="rounded-card border border-border bg-surface">
        {rows.map((r, i) => (
          <View
            key={r.label}
            className={`flex-row items-center justify-between gap-4 px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}>
            <Text className="text-sm text-text-muted">{r.label}</Text>
            <Text className="flex-shrink text-right text-base font-bold text-text">{r.value}</Text>
          </View>
        ))}
      </View>
      <Button label={t('profile.editProfile')} variant="secondary" onPress={() => router.push('/profile-edit')} />
    </View>
  );
}
