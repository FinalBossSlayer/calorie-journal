import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayString } from '@/lib/dates';

/**
 * Today's 'YYYY-MM-DD', kept current if the app stays open past midnight or
 * comes back from the background on a later day.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayString);

  useEffect(() => {
    const refresh = () => setToday(todayString());
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    // A second of slack so the timer never fires just before midnight.
    const timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 1000);
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}
