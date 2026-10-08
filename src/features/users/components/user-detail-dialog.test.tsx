import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser } from '../schemas/user.schema';
import { useUserDetail } from '../hooks/use-user-detail';
import { UserDetailDialog } from './user-detail-dialog';

vi.mock('../hooks/use-user-detail');

const mockedUseUserDetail = vi.mocked(useUserDetail);

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  displayName: 'Alice Nguyen',
  avatarUrl: null,
  emailVerified: true,
  banned: true,
  bannedAt: '2026-09-30T10:00:00Z',
  banReason: 'Repeated spam',
  lastSeenAt: '2026-10-07T09:15:00Z',
  createdAt: '2026-10-01T09:15:00Z',
  role: 'ADMIN',
  roles: ['USER', 'ADMIN'],
};

function mockQuery(overrides: Record<string, unknown>) {
  mockedUseUserDetail.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useUserDetail>);
}

describe('UserDetailDialog', () => {
  beforeEach(() => {
    mockedUseUserDetail.mockReset();
  });

  it('renders the loading skeleton while the detail is pending', () => {
    mockQuery({ isLoading: true });
    const { getByRole, getByText } = renderWithProviders(
      <UserDetailDialog userId="u-1" open onOpenChange={vi.fn()} />
    );

    expect(getByText('User details')).toBeInTheDocument();
    expect(getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the profile, roles, dates and ban metadata', () => {
    mockQuery({ data: user });
    const { getByText, getByRole } = renderWithProviders(
      <UserDetailDialog userId="u-1" open onOpenChange={vi.fn()} />
    );

    expect(getByText('Alice Nguyen')).toBeInTheDocument();
    expect(getByText('alice@snapgram.dev')).toBeInTheDocument();
    expect(getByText('Banned')).toBeInTheDocument();
    expect(getByText('USER, ADMIN')).toBeInTheDocument();
    expect(getByText('Joined')).toBeInTheDocument();
    expect(getByText('Last seen')).toBeInTheDocument();
    expect(getByText('Banned on')).toBeInTheDocument();
    expect(getByText('Repeated spam')).toBeInTheDocument();
    expect(getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the not-found message when the query resolves with no data', () => {
    mockQuery({ data: undefined });
    const { getByText } = renderWithProviders(
      <UserDetailDialog userId="u-1" open onOpenChange={vi.fn()} />
    );

    expect(getByText('This user could not be found.')).toBeInTheDocument();
  });

  it('renders the mapped error and retries', async () => {
    const refetch = vi.fn();
    mockQuery({
      isError: true,
      error: { httpStatus: 404, kind: 'notFound', message: 'gone' } satisfies ApiError,
      refetch,
    });
    const { getByRole, getByText } = renderWithProviders(
      <UserDetailDialog userId="u-1" open onOpenChange={vi.fn()} />
    );

    expect(getByText('The requested resource could not be found.')).toBeInTheDocument();

    await userEvent.click(getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to the unknown message when the error object is missing', () => {
    mockQuery({ isError: true, error: null });
    const { getByText } = renderWithProviders(
      <UserDetailDialog userId="u-1" open onOpenChange={vi.fn()} />
    );

    expect(getByText('An unexpected error occurred. Please try again later.')).toBeInTheDocument();
  });

  it('renders optional action slots when provided', () => {
    mockQuery({ data: user });
    const { getByRole } = renderWithProviders(
      <UserDetailDialog
        userId="u-1"
        open
        onOpenChange={vi.fn()}
        actions={<button type="button">Ban user</button>}
      />
    );

    expect(getByRole('button', { name: 'Ban user' })).toBeInTheDocument();
  });

  it('renders the no-roles fallback for an account without roles', () => {
    mockQuery({ data: { ...user, roles: [], role: null } });
    const { getByText } = renderWithProviders(
      <UserDetailDialog userId="u-1" open onOpenChange={vi.fn()} />
    );

    expect(getByText('This account has no roles')).toBeInTheDocument();
  });
});
