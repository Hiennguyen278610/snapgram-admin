import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import type { AdminUserResponse } from '../schemas/stats.schema';
import { ActivityFeedCard } from './activity-feed-card';

const users: AdminUserResponse[] = [
  {
    id: 'u-1',
    username: 'alice',
    email: 'alice@snapgram.dev',
    displayName: 'Alice Nguyen',
    avatarUrl: null,
    createdAt: '2026-10-07T09:15:00Z',
  },
  {
    id: 'u-2',
    username: 'bob',
    email: 'bob@snapgram.dev',
    displayName: 'Bob Tran',
    avatarUrl: null,
    createdAt: '2026-10-07T08:40:00Z',
  },
  {
    id: 'u-3',
    username: 'carol',
    email: 'carol@snapgram.dev',
    displayName: 'Carol Le',
    avatarUrl: null,
  },
  {
    id: 'u-4',
    username: 'dave',
    email: 'dave@snapgram.dev',
    displayName: 'Dave Pham',
    avatarUrl: null,
    createdAt: '2026-10-06T17:30:00Z',
  },
  {
    id: 'u-5',
    username: 'erin',
    email: 'erin@snapgram.dev',
    displayName: null,
    avatarUrl: null,
    createdAt: '2026-10-06T11:00:00Z',
  },
];

describe('ActivityFeedCard', () => {
  it('renders every recent user with username and optional timestamp', () => {
    const { getByText, container } = renderWithProviders(<ActivityFeedCard users={users} />);

    expect(getByText('Recent Users')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(5);

    expect(getByText('Alice Nguyen')).toBeInTheDocument();
    expect(getByText('@alice')).toBeInTheDocument();
    expect(getByText('Bob Tran')).toBeInTheDocument();

    // displayName is null -> falls back to the username.
    expect(getByText('erin')).toBeInTheDocument();
    expect(getByText('@erin')).toBeInTheDocument();

    // createdAt is optional: only the 4 users that have it render a <time>.
    expect(container.querySelectorAll('time')).toHaveLength(4);
  });

  it('renders the empty message when there are no recent users', () => {
    const { getByText, queryByRole } = renderWithProviders(<ActivityFeedCard users={[]} />);

    expect(getByText('No recent users')).toBeInTheDocument();
    expect(queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders 5 skeleton rows while loading', () => {
    const { getByTestId, queryByText } = renderWithProviders(
      <ActivityFeedCard users={[]} isLoading />
    );

    const skeleton = getByTestId('activity-feed-skeleton');
    expect(skeleton.querySelectorAll('li')).toHaveLength(5);
    expect(queryByText('No recent users')).not.toBeInTheDocument();
  });
});
