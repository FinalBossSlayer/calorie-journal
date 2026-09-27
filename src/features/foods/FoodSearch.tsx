import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import type { FoodSearchRow } from '@/db/queries/foods';
import { Button } from '@/features/common/Button';
import { useFormat } from '@/i18n/format';
import { useThemeColors } from '@/theme/useThemeColors';

import { foodTags } from './foodTags';
import { useFoodSearch } from './useFoodSearch';

type Props = {
  onSelect: (food: FoodSearchRow) => void;
  /** Foods never shown, e.g. the recipe being edited when picking its ingredients. */
  excludeId?: string;
  /** Offers to create a food named after the query, below the results. */
  onCreate?: (query: string) => void;
  autoFocus?: boolean;
  /** Extra space under the list, e.g. for the home indicator. */
  bottomInset?: number;
};

/** Search box plus results (or recently used foods while the box is empty). */
export function FoodSearch({ onSelect, excludeId, onCreate, autoFocus, bottomInset = 0 }: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeColors();
  const [query, setQuery] = useState('');
  const search = useFoodSearch(query);
  const { showingRecent, loaded } = search;
  const results = excludeId ? search.results.filter((f) => f.id !== excludeId) : search.results;

  let emptyText: string | null = null;
  if (loaded && results.length === 0) {
    emptyText = showingRecent ? t('search.hint') : t('search.noResults', { query: query.trim() });
  }

  return (
    <View className="flex-1 gap-3">
      <View className="mx-4 flex-row items-center gap-2 rounded-card border-2 border-border bg-surface px-3">
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          accessibilityLabel={t('search.placeholder')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          className="flex-1 py-3 text-lg text-text"
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('search.clear')} hitSlop={12} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(f) => f.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset + 16 }}
        ListHeaderComponent={
          showingRecent && results.length > 0 ? (
            <Text className="pb-2 text-sm text-text-muted">{t('search.recent')}</Text>
          ) : null
        }
        ListFooterComponent={
          onCreate && loaded && !showingRecent && query.trim() ? (
            <View className="items-start py-4">
              <Button
                label={t('customFood.create', { name: query.trim() })}
                variant="secondary"
                size="small"
                onPress={() => onCreate(query.trim())}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={emptyText ? <Text className="py-4 text-base text-text-muted">{emptyText}</Text> : null}
        renderItem={({ item }) => <FoodRow food={item} onPress={() => onSelect(item)} />}
      />
    </View>
  );
}

function FoodRow({ food, onPress }: { food: FoodSearchRow; onPress: () => void }) {
  const { formatNutrient, localizedName } = useFormat();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border py-3 active:opacity-60">
      <View className="flex-1">
        <Text className="text-base text-text" numberOfLines={2}>
          {localizedName(food.nameMk, food.nameEn)}
        </Text>
        <Text className="text-xs text-text-muted">{foodTags(t, food)}</Text>
      </View>
      <View className="items-end">
        <Text className="text-base font-bold text-text">{formatNutrient(food.kcal)}</Text>
        <Text className="text-xs text-text-muted">{t('search.per100g')}</Text>
      </View>
    </Pressable>
  );
}
