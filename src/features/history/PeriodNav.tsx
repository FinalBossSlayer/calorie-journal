import { Text, View } from 'react-native';

import { IconButton } from '@/features/common/IconButton';

type Props = {
  title: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  /** False on the current month/week: the future has nothing to show. */
  canGoNext: boolean;
};

/** ‹ Title › for stepping through months or weeks. */
export function PeriodNav({ title, previousLabel, nextLabel, onPrevious, onNext, canGoNext }: Props) {
  return (
    <View className="flex-row items-center gap-2">
      <IconButton icon="chevron-back" label={previousLabel} onPress={onPrevious} />
      <Text className="flex-1 text-center text-lg font-bold text-text" numberOfLines={1}>
        {title}
      </Text>
      <IconButton icon="chevron-forward" label={nextLabel} onPress={onNext} disabled={!canGoNext} />
    </View>
  );
}
