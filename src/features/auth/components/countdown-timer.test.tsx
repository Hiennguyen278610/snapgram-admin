import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, act } from '@/test-utils/render';
import { CountdownTimer } from './countdown-timer';

describe('CountdownTimer', () => {
  it('renders formatted time', () => {
    const { getByRole } = renderWithProviders(<CountdownTimer seconds={125} />);
    expect(getByRole('timer').textContent).toContain('02:05');
  });

  it('calls onComplete when reaching zero', () => {
    vi.useFakeTimers();
    try {
      const onComplete = vi.fn();
      renderWithProviders(<CountdownTimer seconds={2} onComplete={onComplete} />);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onComplete).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
