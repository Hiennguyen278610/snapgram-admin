import { describe, it, expect } from 'vitest';
import { Users } from 'lucide-react';
import { renderWithProviders } from '@/test-utils/render';
import { StatMetricCard } from './stat-metric-card';

describe('StatMetricCard', () => {
  it('renders the label and the locale-formatted value', () => {
    const { getByText } = renderWithProviders(<StatMetricCard label="Total Users" value={1250} />);

    expect(getByText('Total Users')).toBeInTheDocument();
    expect(getByText('1,250')).toBeInTheDocument();
  });

  it('renders a skeleton instead of the value while loading', () => {
    const { getByTestId, queryByText } = renderWithProviders(
      <StatMetricCard label="Total Users" value={1250} isLoading />
    );

    expect(getByTestId('stat-metric-skeleton')).toBeInTheDocument();
    expect(queryByText('1,250')).not.toBeInTheDocument();
  });

  it('renders the optional icon as a decorative element', () => {
    const { container } = renderWithProviders(
      <StatMetricCard label="Total Users" value={1250} icon={Users} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden');
  });
});
