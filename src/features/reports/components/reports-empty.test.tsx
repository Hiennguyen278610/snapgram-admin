import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { ReportsEmpty } from './reports-empty';

describe('ReportsEmpty', () => {
  it('renders the localized empty state', () => {
    renderWithProviders(<ReportsEmpty />);

    expect(screen.getByRole('heading', { name: 'No reports here' })).toBeInTheDocument();
    expect(screen.getByText(/Nothing matches this filter right now/i)).toBeInTheDocument();
  });
});
