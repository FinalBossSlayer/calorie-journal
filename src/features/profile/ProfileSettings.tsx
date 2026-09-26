import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { type Profile, softDeleteProfile, updateProfile } from '@/db/queries/profile';
import { LANGUAGES, RING_MODES } from '@/db/schema';
import { Button } from '@/features/common/Button';
import { SegmentedControl } from '@/features/common/SegmentedControl';

const RING_LABEL_KEYS = { eaten: 'profile.ringEaten', left: 'profile.ringLeft' } as const;

/** Language and Today-ring mode. Changes save immediately. */
export function ProfileSettings({ profile }: { profile: Profile }) {
  const { t } = useTranslation();

  return (
    <View className="gap-4 rounded-card border border-border bg-surface p-4">
      <View className="gap-2">
        <Text className="text-sm text-text-muted">{t('profile.language')}</Text>
        <SegmentedControl
          accessibilityLabel={t('profile.language')}
          choices={LANGUAGES.map((l) => ({ value: l, label: t(`language.${l}`) }))}
          value={profile.language}
          // app/_layout.tsx switches the UI language when the profile changes.
          onChange={(language) => void updateProfile(profile.id, { language })}
        />
      </View>

      <View className="gap-2">
        <Text className="text-sm text-text-muted">{t('profile.ringMode')}</Text>
        <SegmentedControl
          accessibilityLabel={t('profile.ringMode')}
          choices={RING_MODES.map((m) => ({ value: m, label: t(RING_LABEL_KEYS[m]) }))}
          value={profile.ringMode}
          onChange={(ringMode) => void updateProfile(profile.id, { ringMode })}
        />
      </View>

      {__DEV__ ? (
        <Button
          label={t('profile.restartOnboarding')}
          variant="secondary"
          onPress={() => void softDeleteProfile(profile.id)}
        />
      ) : null}
    </View>
  );
}
