import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/features/common/Button';
import { NameFields } from '@/features/foods/NameFields';

import { type MealFormInput, mealFormSchema, type MealFormValues } from './mealSchema';

type Props = {
  /** Current names when renaming; empty fields when adding. */
  initial: MealFormInput;
  title: string;
  onSave: (values: MealFormValues) => void;
  /** Shown when renaming an existing meal. */
  onDelete?: () => void;
  onClose: () => void;
};

/** Bottom sheet for naming a meal. Mount it only while editing. */
export function MealEditor({ initial, title, onSave, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const form = useForm<MealFormInput, unknown, MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: initial,
  });

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={onClose}
          className="absolute inset-0 bg-background opacity-70"
        />
        <View
          className="gap-4 rounded-t-card border-t border-border bg-surface px-4 pt-6"
          style={{ paddingBottom: insets.bottom + 16 }}>
          <Text className="text-2xl font-bold text-text">{title}</Text>
          <FormProvider {...form}>
            <NameFields />
          </FormProvider>
          <Button label={t('common.save')} onPress={form.handleSubmit(onSave)} />
          {onDelete ? <Button label={t('meals.delete')} variant="secondary" onPress={onDelete} /> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
