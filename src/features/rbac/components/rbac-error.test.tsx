import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { RbacError } from './rbac-error';

const serverError: ApiError = { httpStatus: 500, kind: 'server', message: 'boom' };

describe('RbacError', () => {
  it('renders the localized title, the mapped reason and a retry button', () => {
    const { getByText, getByRole } = renderWithProviders(
      <RbacError error={serverError} onRetry={vi.fn()} />
    );

    expect(getByText('Failed to load roles')).toBeInTheDocument();
    expect(getByText('Internal server error.')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('falls back to the unknown error message when no error is provided', () => {
    const { getByText } = renderWithProviders(<RbacError error={null} onRetry={vi.fn()} />);

    expect(getByText('An unexpected error occurred. Please try again later.')).toBeInTheDocument();
  });

  it('reports a retry request', async () => {
    const onRetry = vi.fn();
    const { getByRole } = renderWithProviders(<RbacError error={serverError} onRetry={onRetry} />);

    await userEvent.click(getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
