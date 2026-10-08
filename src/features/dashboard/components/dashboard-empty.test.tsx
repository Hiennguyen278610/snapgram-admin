import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { DashboardEmpty } from './dashboard-empty';

describe('DashboardEmpty', () => {
  it('renders the empty title and description', () => {
    const { getByText, container } = renderWithProviders(<DashboardEmpty />);

    expect(getByText('No data yet')).toBeInTheDocument();
    expect(getByText("Dashboard data will appear here when there's activity.")).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden');
  });
});
