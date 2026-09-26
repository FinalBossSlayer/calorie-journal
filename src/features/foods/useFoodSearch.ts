import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { type FoodSearchRow, searchFoods } from '@/db/queries/foods';
import { buildSearch } from '@/lib/search';

/** Wait for a short pause in typing before querying. */
const DEBOUNCE_MS = 150;

type State = { results: FoodSearchRow[]; query: string | null; error: unknown };

/**
 * Search results for `query`, or recently used foods while it is too short.
 * Re-runs when the screen regains focus, so recents pick up what was just logged.
 * `showingRecent` describes the results currently shown, not the latest keystroke.
 */
export function useFoodSearch(query: string): {
  results: FoodSearchRow[];
  showingRecent: boolean;
  loaded: boolean;
} {
  const [state, setState] = useState<State>({ results: [], query: null, error: null });
  const [focusCount, setFocusCount] = useState(0);

  useFocusEffect(useCallback(() => setFocusCount((n) => n + 1), []));

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        searchFoods(query).then(
          (results) => {
            if (!cancelled) setState({ results, query, error: null });
          },
          (error: unknown) => {
            if (!cancelled) setState((s) => ({ ...s, error }));
          },
        );
      },
      buildSearch(query) ? DEBOUNCE_MS : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, focusCount]);

  // Surface database errors to the route's error boundary.
  if (state.error) throw state.error;

  return {
    results: state.results,
    showingRecent: state.query !== null && buildSearch(state.query) === null,
    loaded: state.query !== null,
  };
}
