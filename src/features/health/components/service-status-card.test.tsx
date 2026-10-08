import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { ServiceStatusCard } from './service-status-card';

describe('ServiceStatusCard', () => {
  it('renders the UP state with Online text and a timestamp', () => {
    renderWithProviders(
      <ServiceStatusCard label="API Gateway" status="UP" lastChecked="09/10/2026, 11:00" />
    );

    expect(screen.getByText('API Gateway')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Last checked: 09/10/2026, 11:00')).toBeInTheDocument();
    expect(screen.getByTestId('service-status-card')).toHaveAttribute('data-status', 'UP');
  });

  it('renders the DOWN state with Offline text', () => {
    renderWithProviders(<ServiceStatusCard label="Auth Service" status="DOWN" />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByTestId('service-status-card')).toHaveAttribute('data-status', 'DOWN');
    expect(screen.queryByText(/Last checked/)).not.toBeInTheDocument();
  });

  it('renders the UNKNOWN state with Unknown text', () => {
    renderWithProviders(<ServiceStatusCard label="Content Service" status="UNKNOWN" />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByTestId('service-status-card')).toHaveAttribute('data-status', 'UNKNOWN');
  });

  it('renders a skeleton while the first check is pending', () => {
    renderWithProviders(<ServiceStatusCard label="Media Service" status="UNKNOWN" isLoading />);

    expect(screen.getByTestId('service-status-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });
});
