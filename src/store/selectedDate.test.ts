import { useSelectedDateStore } from './selectedDate';

const today = '2026-09-26';

beforeEach(() => useSelectedDateStore.setState({ pinned: null }));

describe('selected date store', () => {
  it('pins a past day', () => {
    useSelectedDateStore.getState().select('2026-09-20', today);
    expect(useSelectedDateStore.getState().pinned).toBe('2026-09-20');
  });

  it('follows today when today is selected', () => {
    useSelectedDateStore.getState().select('2026-09-20', today);
    useSelectedDateStore.getState().select(today, today);
    expect(useSelectedDateStore.getState().pinned).toBeNull();
  });

  it('does not allow future days', () => {
    useSelectedDateStore.getState().select('2026-09-27', today);
    expect(useSelectedDateStore.getState().pinned).toBeNull();
  });
});
