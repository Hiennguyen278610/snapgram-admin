import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { MediaLibrarySkeleton } from './media-library-skeleton';

describe('MediaLibrarySkeleton', () => {
  it('announces a busy loading region', () => {
    renderWithProviders(<MediaLibrarySkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-label', 'Loading...');
  });

  it('renders the requested number of skeleton tiles', () => {
    const { container } = renderWithProviders(<MediaLibrarySkeleton items={3} />);

    expect(container.querySelectorAll('[data-slot="skeleton"].aspect-square')).toHaveLength(3);
  });
});
