import { type Href, router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/features/common/Button';

import type { ProfileField } from './profileSchema';
import { useProfileForm } from './useProfileForm';

/** Onboarding screens in order, with the form fields each one must validate before moving on. */
export const ONBOARDING_STEPS = [
  { href: '/onboarding', fields: ['language'] },
  { href: '/onboarding/sex', fields: ['sex'] },
  { href: '/onboarding/birth-date', fields: ['birthDate'] },
  { href: '/onboarding/body', fields: ['heightCm', 'weightKg'] },
  { href: '/onboarding/activity', fields: ['activityLevel'] },
  { href: '/onboarding/goal', fields: ['goal', 'goalRateKgPerWeek'] },
  { href: '/onboarding/summary', fields: [] },
] as const satisfies readonly { href: Href; fields: readonly ProfileField[] }[];

type Props = {
  step: number; // index into ONBOARDING_STEPS
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** False disables the button (e.g. nothing chosen yet). */
  canContinue?: boolean;
  /** Replaces "validate and go to next step" (used by the last step). */
  onNext?: () => void;
  nextLabel?: string;
};

/** Shared layout: progress, back, title, content, and the accent "Next" button pinned at the bottom. */
export function OnboardingStep({ step, title, subtitle, children, canContinue = true, onNext, nextLabel }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { trigger } = useProfileForm();
  const total = ONBOARDING_STEPS.length;

  async function next() {
    if (onNext) return onNext();
    const valid = await trigger([...ONBOARDING_STEPS[step].fields]);
    const following = ONBOARDING_STEPS[step + 1];
    if (valid && following) router.push(following.href);
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
      <View className="gap-3 px-4" style={{ paddingTop: insets.top + 12 }}>
        <View className="h-10 flex-row items-center justify-between">
          {step > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
              <Text className="text-base text-text-muted">‹ {t('common.back')}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text className="text-sm text-text-muted">
            {t('onboarding.stepOf', { current: step + 1, total })}
          </Text>
        </View>
        <View className="h-1 overflow-hidden rounded-full bg-surface">
          <View className="h-1 bg-accent" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-4 pb-6 pt-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-text">{title}</Text>
          {subtitle ? <Text className="text-base text-text-muted">{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>

      <View className="px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label={nextLabel ?? t('common.next')} onPress={next} disabled={!canContinue} />
      </View>
    </KeyboardAvoidingView>
  );
}
