import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { useAllServicesHealth, type ServiceHealthEntry } from '../hooks/use-all-services-health';
import { HealthPageContent } from './health-page-content';

vi.mock('../hooks/use-all-services-health');

const mockedUseAllServicesHealth = vi.mocked(useAllServicesHealth);

function entry(overrides: Partial<ServiceHealthEntry> = {}): ServiceHealthEntry {
  return {
    id: 'gateway',
    labelKey: 'health.services.gateway',
    status: 'UP',
    lastChecked: '2026-10-09T04:00:00.000Z',
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

function mockHealth(
  overrides: {
    services?: ServiceHealthEntry[];
    isLoading?: boolean;
    isError?: boolean;
    lastChecked?: string | null;
  } = {}
) {
  const refetch = vi.fn();
  mockedUseAllServicesHealth.mockReturnValue({
    services: overrides.services ?? [
      entry(),
      entry({ id: 'auth', labelKey: 'health.services.auth' }),
      entry({ id: 'content', labelKey: 'health.services.content' }),
      entry({ id: 'media', labelKey: 'health.services.media' }),
    ],
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    lastChecked: overrides.lastChecked ?? '2026-10-09T04:00:00.000Z',
    refetch,
  });
  return { refetch };
}

describe('HealthPageContent', () => {
  beforeEach(() => {
    mockedUseAllServicesHealth.mockReset();
  });

  it('renders the heading and description in the loading state', () => {
    mockHealth({ isLoading: true });

    renderWithProviders(<HealthPageContent />);

    expect(screen.getByRole('heading', { name: 'System Health' })).toBeInTheDocument();
    expect(screen.getByText('Monitor service status and infrastructure')).toBeInTheDocument();
    expect(screen.getAllByTestId('service-status-skeleton')).toHaveLength(4);
  });

  it('renders four status cards and the external links when data arrives', () => {
    mockHealth();

    renderWithProviders(<HealthPageContent />);

    expect(screen.getAllByTestId('service-status-card')).toHaveLength(4);
    expect(screen.getByText('API Gateway')).toBeInTheDocument();
    expect(screen.getByText('Auth Service')).toBeInTheDocument();
    expect(screen.getByText('Content Service')).toBeInTheDocument();
    expect(screen.getByText('Media Service')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'External Tools' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('shows a single service as down without collapsing the page', () => {
    mockHealth({
      services: [
        entry(),
        entry({ id: 'auth', labelKey: 'health.services.auth', status: 'DOWN', lastChecked: null }),
        entry({ id: 'content', labelKey: 'health.services.content' }),
        entry({ id: 'media', labelKey: 'health.services.media' }),
      ],
    });

    renderWithProviders(<HealthPageContent />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getAllByText('Online')).toHaveLength(3);
  });

  it('renders the error state with a retry button that refetches', async () => {
    const user = userEvent.setup();
    const { refetch } = mockHealth({ isError: true, services: [] });

    renderWithProviders(<HealthPageContent />);

    expect(screen.getByText('Failed to load health status')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('refetches all services from the manual refresh button', async () => {
    const user = userEvent.setup();
    const { refetch } = mockHealth();

    renderWithProviders(<HealthPageContent />);
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the last-checked line once a timestamp exists', () => {
    mockHealth();

    renderWithProviders(<HealthPageContent />);

    expect(screen.getAllByText(/Last checked:/).length).toBeGreaterThan(0);
  });
});
