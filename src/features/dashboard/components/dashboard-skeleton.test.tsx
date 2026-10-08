import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { DashboardSkeleton } from './dashboard-skeleton';

describe('DashboardSkeleton', () => {
  it('renders an accessible status region with every content skeleton', () => {
    const { getByRole, getByTestId, getAllByTestId } = renderWithProviders(<DashboardSkeleton />);

    const status = getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-label', 'Loading...');

    expect(getAllByTestId('stat-metric-skeleton')).toHaveLength(4);
    expect(getByTestId('activity-feed-skeleton')).toBeInTheDocument();
    expect(getAllByTestId('quick-bar-skeleton')).toHaveLength(3);
  });
});
