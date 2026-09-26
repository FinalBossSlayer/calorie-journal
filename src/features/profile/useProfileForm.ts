import { useFormContext } from 'react-hook-form';

import type { ProfileFormInput, ProfileFormValues } from './profileSchema';

/** The profile form from the nearest <FormProvider> (onboarding layout or Edit profile screen). */
export function useProfileForm() {
  return useFormContext<ProfileFormInput, unknown, ProfileFormValues>();
}
