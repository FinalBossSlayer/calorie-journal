import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Profile, updateProfile, useProfile } from '@/db/queries/profile';
import { ProfileDetails } from '@/features/profile/ProfileDetails';
import { ProfileSettings } from '@/features/profile/ProfileSettings';
import { TargetEditor } from '@/features/profile/TargetEditor';
import { TargetsOverview } from '@/features/profile/TargetsOverview';
import { todayString } from '@/lib/dates';
import type { Nutrient } from '@/lib/nutrition';
import { computeTargets, removeOverride } from '@/lib/targets';

export default function ProfileScreen() {
  const { profile } = useProfile();
  // The tabs are only reachable with a profile; this covers the first render of the live query.
  if (!profile) return null;
  return <ProfileContent profile={profile} />;
}

function ProfileContent({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState<Nutrient | null>(null);

  const today = todayString();
  const overrides = profile.targetOverrides;
  const result = computeTargets(profile, today, overrides);

  function saveOverride(nutrient: Nutrient, value: number) {
    setEditing(null);
    void updateProfile(profile.id, { targetOverrides: { ...overrides, [nutrient]: value } });
  }

  function resetOverride(nutrient: Nutrient) {
    setEditing(null);
    void updateProfile(profile.id, { targetOverrides: removeOverride(overrides, nutrient) });
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
        <View className="gap-6 px-4">
          <Text className="text-4xl font-bold text-text">{t('tabs.profile')}</Text>

          <Section title={t('profile.targetsTitle')} hint={t('profile.targetsHint')}>
            <TargetsOverview result={result} onPressTarget={setEditing} />
          </Section>

          <Section title={t('profile.detailsTitle')}>
            <ProfileDetails profile={profile} today={today} />
          </Section>

          <Section title={t('profile.settingsTitle')}>
            <ProfileSettings profile={profile} />
          </Section>
        </View>
      </ScrollView>

      {editing ? (
        <TargetEditor
          nutrient={editing}
          current={result.targets[editing]}
          calculated={computeTargets(profile, today, removeOverride(overrides, editing)).targets[editing]}
          overridden={result.overridden.includes(editing)}
          minKcal={result.minKcal}
          onSave={(value) => saveOverride(editing, value)}
          onReset={() => resetOverride(editing)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-xl font-bold text-text">{title}</Text>
        {hint ? <Text className="text-sm text-text-muted">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}
