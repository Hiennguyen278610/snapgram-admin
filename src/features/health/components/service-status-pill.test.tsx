import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { useServiceHealth } from '../hooks/use-service-health';
import { ServiceStatusPill } from './service-status-pill';

vi.mock('../hooks/use-service-health');

const mockedUseServiceHealth = vi.mocked(useServiceHealth);

function mockHealth(overrides: { status?: string; isLoading?: boolean } = {}) {
  mockedUseServiceHealth.mockReturnValue({
    data: overrides.status ? { status: overrides.status } : undefined,
    isLoading: overrides.isLoading ?? false,
  } as unknown as ReturnType<typeof useServiceHealth>);
}

describe('ServiceStatusPill', () => {
  beforeEach(() => {
    mockedUseServiceHealth.mockReset();
  });

  it('polls the gateway every 30 seconds', () => {
    mockHealth({ status: 'UP' });

    renderWithProviders(<ServiceStatusPill />);

    expect(mockedUseServiceHealth).toHaveBeenCalledWith('gateway', 30_000);
  });

  it('shows the online label when the gateway is UP', () => {
    mockHealth({ status: 'UP' });

    renderWithProviders(<ServiceStatusPill />);

    const pill = screen.getByTestId('service-status-pill');
    expect(screen.getByText('Gateway: Online')).toBeInTheDocument();
    expect(pill).toHaveAttribute('aria-label', 'Gateway: Online');
    expect(pill).toHaveAttribute('data-status', 'UP');
  });

  it('shows the offline label when the gateway is DOWN', () => {
    mockHealth({ status: 'DOWN' });

    renderWithProviders(<ServiceStatusPill />);

    expect(screen.getByText('Gateway: Offline')).toBeInTheDocument();
    expect(screen.getByTestId('service-status-pill')).toHaveAttribute('data-status', 'DOWN');
  });

  it('shows the checking label while the first check is pending', () => {
    mockHealth({ isLoading: true });

    renderWithProviders(<ServiceStatusPill />);

    expect(screen.getByText('Gateway: Checking...')).toBeInTheDocument();
    expect(screen.getByTestId('service-status-pill')).toHaveAttribute('data-status', 'UNKNOWN');
  });

  it('falls back to the offline label for an unrecognized status', () => {
    mockHealth({ status: 'DEGRADED' });

    renderWithProviders(<ServiceStatusPill />);

    expect(screen.getByText('Gateway: Offline')).toBeInTheDocument();
  });
});
