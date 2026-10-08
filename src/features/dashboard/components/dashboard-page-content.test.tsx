import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import type { AdminDashboardResponse } from '../schemas/stats.schema';
import { useDashboardStats } from '../hooks/use-dashboard-stats';
import { DashboardPageContent } from './dashboard-page-content';

vi.mock('../hooks/use-dashboard-stats');

const mockedUseDashboardStats = vi.mocked(useDashboardStats);

const fullStats: AdminDashboardResponse = {
  totalUsers: 1250,
  activeUsers: 1180,
  bannedUsers: 70,
  newUsersToday: 12,
  newUsersThisWeek: 87,
  emailVerifiedUsers: 1100,
  twoFaEnabledUsers: 240,
  recentUsers: [
    {
      id: 'u-1',
      username: 'alice',
      email: 'alice@snapgram.dev',
      displayName: 'Alice Nguyen',
      avatarUrl: null,
      createdAt: '2026-10-07T09:15:00Z',
    },
  ],
};

function mockQuery(overrides: Record<string, unknown>) {
  mockedUseDashboardStats.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useDashboardStats>);
}

describe('DashboardPageContent', () => {
  beforeEach(() => {
    mockedUseDashboardStats.mockReset();
  });

  it('renders the heading and the skeleton while loading', () => {
    mockQuery({ isLoading: true });
    const { getByRole } = renderWithProviders(<DashboardPageContent />);

    expect(getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the heading and the error panel on failure, and refetches on retry', async () => {
    const refetch = vi.fn();
    mockQuery({
      isError: true,
      error: { httpStatus: 500, kind: 'server', message: 'boom' },
      refetch,
    });
    const { getByRole, getByText } = renderWithProviders(<DashboardPageContent />);

    expect(getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(getByText('Failed to load dashboard')).toBeInTheDocument();

    await userEvent.click(getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the heading and the empty state for an empty payload', () => {
    mockQuery({
      data: {
        ...fullStats,
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        newUsersToday: 0,
        recentUsers: [],
      },
    });
    const { getByRole, getByText } = renderWithProviders(<DashboardPageContent />);

    expect(getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(getByText('No data yet')).toBeInTheDocument();
  });

  it('renders the heading, the 4 metric cards and the two cards with data', () => {
    mockQuery({ data: fullStats });
    const { getByRole, getByText, queryAllByTestId } = renderWithProviders(
      <DashboardPageContent />
    );

    expect(getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

    expect(getByText('Total Users')).toBeInTheDocument();
    expect(getByText('Active Users')).toBeInTheDocument();
    expect(getByText('Banned Users')).toBeInTheDocument();
    expect(getByText('New Users Today')).toBeInTheDocument();
    expect(getByText('1,250')).toBeInTheDocument();

    expect(getByText('Recent Users')).toBeInTheDocument();
    expect(getByText('@alice')).toBeInTheDocument();
    expect(getByText('Quick Stats')).toBeInTheDocument();

    // 4 metric cards, none of them in loading mode.
    expect(queryAllByTestId('stat-metric-skeleton')).toHaveLength(0);
  });
});
