import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  vi.useFakeTimers();

  it('returns initial value immediately and updates after delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'first' },
    });

    expect(result.current).toBe('first');

    rerender({ value: 'second' });
    // still old value before timer
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('second');
  });
});
