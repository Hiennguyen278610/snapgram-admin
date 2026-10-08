import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { DashboardError } from './dashboard-error';

const serverError: ApiError = { httpStatus: 500, kind: 'server', message: 'boom' };

describe('DashboardError', () => {
  it('renders the dashboard title and the kind-mapped error message', () => {
    const { getByText, container } = renderWithProviders(
      <DashboardError error={serverError} onRetry={() => {}} />
    );

    expect(getByText('Failed to load dashboard')).toBeInTheDocument();
    expect(getByText('Internal server error.')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden');
  });

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn();
    const { getByRole } = renderWithProviders(
      <DashboardError error={serverError} onRetry={onRetry} />
    );

    await userEvent.click(getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to the network message for connection failures', () => {
    const networkError: ApiError = { httpStatus: 0, kind: 'network', message: 'offline' };
    const { getByText } = renderWithProviders(
      <DashboardError error={networkError} onRetry={() => {}} />
    );

    expect(getByText('Network connection error.')).toBeInTheDocument();
  });
});
