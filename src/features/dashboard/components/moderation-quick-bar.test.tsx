import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import type { AdminDashboardResponse } from '../schemas/stats.schema';
import { ModerationQuickBar } from './moderation-quick-bar';

const stats: AdminDashboardResponse = {
  totalUsers: 1250,
  activeUsers: 1180,
  bannedUsers: 70,
  newUsersToday: 12,
  newUsersThisWeek: 87,
  emailVerifiedUsers: 1100,
  twoFaEnabledUsers: 240,
  recentUsers: [],
};

describe('ModerationQuickBar', () => {
  it('renders the three quick stats with locale-formatted values', () => {
    const { getByText, container } = renderWithProviders(<ModerationQuickBar stats={stats} />);

    expect(getByText('Quick Stats')).toBeInTheDocument();
    expect(getByText('Email Verified')).toBeInTheDocument();
    expect(getByText('1,100')).toBeInTheDocument();
    expect(getByText('2FA Enabled')).toBeInTheDocument();
    expect(getByText('240')).toBeInTheDocument();
    expect(getByText('New Users This Week')).toBeInTheDocument();
    expect(getByText('87')).toBeInTheDocument();

    const scroller = container.querySelector('.overflow-x-auto');
    expect(scroller).not.toBeNull();
    expect(scroller?.className).toContain('[scrollbar-width:none]');
  });

  it('renders 3 pill skeletons while loading', () => {
    const { getAllByTestId, queryByText } = renderWithProviders(
      <ModerationQuickBar stats={stats} isLoading />
    );

    expect(getAllByTestId('quick-bar-skeleton')).toHaveLength(3);
    expect(queryByText('1,100')).not.toBeInTheDocument();
  });
});
