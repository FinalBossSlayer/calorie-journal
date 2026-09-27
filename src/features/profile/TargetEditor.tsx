import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/features/common/Button';
import { NumberField } from '@/features/common/NumberField';
import { useFormat } from '@/i18n/format';
import type { Nutrient } from '@/lib/nutrition';
import { parseDecimal } from '@/lib/numbers';
import { OVERRIDE_LIMITS } from '@/lib/targets';

type Props = {
  nutrient: Nutrient;
  /** Target in use now (the override if there is one). */
  current: number;
  /** What the target returns to on reset. */
  calculated: number;
  overridden: boolean;
  minKcal: number;
  onSave: (value: number) => void;
  onReset: () => void;
  onClose: () => void;
};

/** Bottom sheet for setting one target manually. Mount it only while editing. */
export function TargetEditor({ nutrient, current, calculated, overridden, minKcal, onSave, onReset, onClose }: Props) {
  const { formatNumber } = useFormat();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(String(current));
  const [submitted, setSubmitted] = useState(false);

  const limits = OVERRIDE_LIMITS[nutrient];
  const unit = nutrient === 'kcal' ? t('units.kcal') : t('units.g');
  const value = parseDecimal(text);
  const valid = value !== null && value >= limits.min && value <= limits.max;
  const belowFloor = nutrient === 'kcal' && valid && value < minKcal;

  function save() {
    setSubmitted(true);
    if (valid) onSave(value);
  }

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
          <View className="gap-1">
            <Text className="text-2xl font-bold text-text">{t(`nutrients.${nutrient}`)}</Text>
            <Text className="text-sm text-text-muted">
              {t('targets.calculated', { value: `${formatNumber(calculated, 1)} ${unit}` })}
            </Text>
          </View>

          <NumberField
            label={t(`nutrients.${nutrient}`)}
            unit={unit}
            value={text}
            onChangeText={setText}
            autoFocus
            error={submitted && !valid ? t('targets.invalid', limits) : undefined}
          />

          {nutrient === 'kcal' ? <Text className="text-sm text-text-muted">{t('targets.kcalHint')}</Text> : null}
          {belowFloor ? (
            <Text className="text-sm text-over">{t('targets.belowFloor', { min: formatNumber(minKcal) })}</Text>
          ) : null}

          <Button label={t('common.save')} onPress={save} />
          {overridden ? <Button label={t('targets.reset')} variant="secondary" onPress={onReset} /> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
