import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { MediaEmpty } from './media-empty';

describe('MediaEmpty', () => {
  it('renders the empty library message', () => {
    renderWithProviders(<MediaEmpty />);

    expect(screen.getByRole('heading', { name: 'No media yet' })).toBeInTheDocument();
    expect(screen.getByText(/Upload an image or a video/i)).toBeInTheDocument();
  });
});
