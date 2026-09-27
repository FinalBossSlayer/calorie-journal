import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Meal, useMeals } from '@/db/queries/log';
import {
  addMeal,
  countMealEntries,
  renameMeal,
  reorderMeals,
  setMealHidden,
  softDeleteMeal,
} from '@/db/queries/meals';
import { Button } from '@/features/common/Button';
import { IconButton } from '@/features/common/IconButton';
import { MealEditor } from '@/features/meals/MealEditor';
import { useFormat } from '@/i18n/format';
import { canHide, checkDelete, moveMeal, nextSortOrder } from '@/lib/meals';

/** null: no sheet open; 'new': adding a meal; a Meal: renaming it. */
type Editing = null | 'new' | Meal;

export default function MealsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { meals } = useMeals();
  const { localizedName } = useFormat();
  const [editing, setEditing] = useState<Editing>(null);

  function toggleHidden(meal: Meal) {
    if (!meal.isHidden && !canHide(meals, meal.id)) {
      Alert.alert(t('meals.lastVisibleTitle'), t('meals.lastVisibleBody'));
      return;
    }
    void setMealHidden(meal.id, !meal.isHidden);
  }

  async function deleteMeal(meal: Meal) {
    setEditing(null);
    const name = localizedName(meal.nameMk, meal.nameEn);
    const check = checkDelete(meals, meal.id, await countMealEntries(meal.id));

    if (check === 'lastVisible') {
      Alert.alert(t('meals.lastVisibleTitle'), t('meals.lastVisibleBody'));
    } else if (check === 'hasEntries') {
      // Deleting would take the food logged in it off those days; hiding keeps it.
      Alert.alert(t('meals.hasEntriesTitle'), t('meals.hasEntriesBody', { meal: name }), [
        { text: t('common.cancel'), style: 'cancel' },
        ...(meal.isHidden ? [] : [{ text: t('meals.hideInstead'), onPress: () => void setMealHidden(meal.id, true) }]),
      ]);
    } else {
      Alert.alert(t('meals.deleteTitle'), t('meals.deleteBody', { meal: name }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('meals.deleteConfirm'), style: 'destructive', onPress: () => void softDeleteMeal(meal.id) },
      ]);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('meals.title') }} />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
        <View className="gap-3 px-4">
          <Text className="text-sm text-text-muted">{t('meals.hint')}</Text>

          {meals.map((meal, i) => (
            <MealRow
              key={meal.id}
              meal={meal}
              isFirst={i === 0}
              isLast={i === meals.length - 1}
              onRename={() => setEditing(meal)}
              onMove={(direction) => reorderMeals(moveMeal(meals, meal.id, direction))}
              onToggleHidden={() => toggleHidden(meal)}
            />
          ))}

          <Button label={t('meals.add')} onPress={() => setEditing('new')} />
        </View>
      </ScrollView>

      {editing ? (
        <MealEditor
          title={editing === 'new' ? t('meals.addTitle') : t('meals.renameTitle')}
          initial={editing === 'new' ? { nameMk: '', nameEn: '' } : { nameMk: editing.nameMk, nameEn: editing.nameEn }}
          onDelete={editing === 'new' ? undefined : () => void deleteMeal(editing)}
          onClose={() => setEditing(null)}
          onSave={(names) => {
            setEditing(null);
            void (editing === 'new' ? addMeal(names, nextSortOrder(meals)) : renameMeal(editing.id, names));
          }}
        />
      ) : null}
    </>
  );
}

type RowProps = {
  meal: Meal;
  isFirst: boolean;
  isLast: boolean;
  onRename: () => void;
  onMove: (direction: -1 | 1) => void;
  onToggleHidden: () => void;
};

function MealRow({ meal, isFirst, isLast, onRename, onMove, onToggleHidden }: RowProps) {
  const { t } = useTranslation();
  const { localizedName } = useFormat();
  const name = localizedName(meal.nameMk, meal.nameEn);

  return (
    <View className="flex-row items-center gap-1 rounded-card border border-border bg-surface py-2 pl-4 pr-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('meals.rename', { meal: name })}
        onPress={onRename}
        className="flex-1 py-1 active:opacity-70">
        <Text className={`text-lg font-bold ${meal.isHidden ? 'text-text-muted' : 'text-text'}`} numberOfLines={1}>
          {name}
        </Text>
        {meal.isHidden ? <Text className="text-xs text-text-muted">{t('meals.hidden')}</Text> : null}
      </Pressable>
      <IconButton icon="arrow-up" label={t('meals.moveUp', { meal: name })} disabled={isFirst} onPress={() => onMove(-1)} />
      <IconButton icon="arrow-down" label={t('meals.moveDown', { meal: name })} disabled={isLast} onPress={() => onMove(1)} />
      <IconButton
        icon={meal.isHidden ? 'eye-off-outline' : 'eye-outline'}
        label={meal.isHidden ? t('meals.show', { meal: name }) : t('meals.hide', { meal: name })}
        onPress={onToggleHidden}
      />
    </View>
  );
}
