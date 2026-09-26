import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';

import { profileFormSchema, type ProfileFormInput, type ProfileFormValues } from '@/features/profile/profileSchema';
import { currentLanguage } from '@/i18n';

/** One form shared by all onboarding steps; each step screen reads it via useProfileForm(). */
export default function OnboardingLayout() {
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onTouched',
    defaultValues: {
      language: currentLanguage(),
      heightCm: '',
      weightKg: '',
      goalRateKgPerWeek: 0.5,
    },
  });

  return (
    <FormProvider {...form}>
      <Stack screenOptions={{ headerShown: false }} />
    </FormProvider>
  );
}
