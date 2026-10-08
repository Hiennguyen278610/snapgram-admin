import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { ReportsError } from './reports-error';

describe('ReportsError', () => {
  it('shows the localized failure title and the mapped error message', () => {
    renderWithProviders(
      <ReportsError
        error={{ httpStatus: 500, kind: 'server', message: 'boom' } satisfies ApiError}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Failed to load reports' })).toBeInTheDocument();
    expect(screen.getByText('Internal server error.')).toBeInTheDocument();
  });

  it('falls back to the unknown error message when no error is provided', () => {
    renderWithProviders(<ReportsError error={null} onRetry={vi.fn()} />);

    expect(
      screen.getByText('An unexpected error occurred. Please try again later.')
    ).toBeInTheDocument();
  });

  it('calls onRetry from the retry button', async () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ReportsError
        error={{ httpStatus: 0, kind: 'network', message: 'offline' } satisfies ApiError}
        onRetry={onRetry}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
