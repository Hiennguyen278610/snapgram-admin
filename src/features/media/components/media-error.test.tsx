import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { MediaError } from './media-error';

describe('MediaError', () => {
  const onRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the ApiError kind to an i18n message', () => {
    renderWithProviders(
      <MediaError error={{ httpStatus: 500, kind: 'server', message: 'boom' }} onRetry={onRetry} />
    );

    expect(screen.getByRole('heading', { name: 'Failed to load media' })).toBeInTheDocument();
    expect(screen.getByText('Internal server error.')).toBeInTheDocument();
  });

  it('falls back to the unknown error message without an ApiError', () => {
    renderWithProviders(<MediaError error={null} onRetry={onRetry} />);

    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it('retries the query', async () => {
    renderWithProviders(
      <MediaError
        error={{ httpStatus: 0, kind: 'network', message: 'offline' }}
        onRetry={onRetry}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
