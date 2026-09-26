import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { FormProvider, useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Profile, saveProfile, useProfile } from '@/db/queries/profile';
import { SEXES } from '@/db/schema';
import { Button } from '@/features/common/Button';
import { ChoiceList } from '@/features/common/ChoiceList';
import { ActivityChoices } from '@/features/profile/ActivityChoices';
import { BirthDateField } from '@/features/profile/BirthDateField';
import { BodyFields } from '@/features/profile/BodyFields';
import { GoalFields } from '@/features/profile/GoalFields';
import { profileFormSchema, type ProfileFormInput, type ProfileFormValues } from '@/features/profile/profileSchema';
import { useProfileForm } from '@/features/profile/useProfileForm';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('profile.editProfile') }} />
      {/* Wait for the live query so the form starts with the saved values. */}
      {profile ? <EditProfileForm profile={profile} /> : null}
    </>
  );
}

function toFormInput(p: Profile): ProfileFormInput {
  return {
    language: p.language,
    sex: p.sex,
    birthDate: p.birthDate,
    heightCm: String(p.heightCm),
    weightKg: String(p.weightKg),
    activityLevel: p.activityLevel,
    goal: p.goal,
    // 'maintain' stores 0; preselect a sensible rate if the goal is switched.
    goalRateKgPerWeek: p.goalRateKgPerWeek > 0 ? p.goalRateKgPerWeek : 0.5,
  };
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onTouched',
    defaultValues: toFormInput(profile),
  });

  const save = form.handleSubmit(async (values) => {
    await saveProfile(values);
    router.back();
  });

  return (
    <FormProvider {...form}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-8 p-4">
          <Field title={t('onboarding.sex.title')}>
            <SexField />
          </Field>
          <Field title={t('onboarding.birthDate.title')}>
            <BirthDateInput />
          </Field>
          <BodyFields />
          <Field title={t('profile.activity')}>
            <ActivityField />
          </Field>
          <Field title={t('profile.goal')}>
            <GoalFields />
          </Field>
        </ScrollView>
        <View className="px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
          <Button label={t('common.save')} onPress={() => void save()} disabled={form.formState.isSubmitting} />
        </View>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

function Field({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-text">{title}</Text>
      {children}
    </View>
  );
}

function SexField() {
  const { t } = useTranslation();
  const { control } = useProfileForm();
  const { field } = useController({ control, name: 'sex' });
  return (
    <ChoiceList
      choices={SEXES.map((s) => ({ value: s, label: t(`sex.${s}`) }))}
      value={field.value}
      onChange={field.onChange}
    />
  );
}

function BirthDateInput() {
  const { control } = useProfileForm();
  const { field, fieldState } = useController({ control, name: 'birthDate' });
  return <BirthDateField value={field.value} onChange={field.onChange} invalid={fieldState.error !== undefined} />;
}

function ActivityField() {
  const { control } = useProfileForm();
  const { field } = useController({ control, name: 'activityLevel' });
  return <ActivityChoices value={field.value} onChange={field.onChange} />;
}
