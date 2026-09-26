import { create } from 'zustand';

import { useToday } from '@/features/common/useToday';

type SelectedDateState = {
  /** A past day the user navigated to, or null to follow today (also across midnight). */
  pinned: string | null;
  select: (date: string, today: string) => void;
};

/** The day shown on Today and used when logging food. Not persisted: every launch opens on today. */
export const useSelectedDateStore = create<SelectedDateState>()((set) => ({
  pinned: null,
  // Future days aren't allowed yet, so today or later means "follow today".
  select: (date, today) => set({ pinned: date < today ? date : null }),
}));

export function useSelectedDate(): {
  date: string;
  today: string;
  isToday: boolean;
  select: (date: string) => void;
} {
  const today = useToday();
  const pinned = useSelectedDateStore((s) => s.pinned);
  const select = useSelectedDateStore((s) => s.select);
  const date = pinned !== null && pinned < today ? pinned : today;
  return { date, today, isToday: date === today, select: (d) => select(d, today) };
}
