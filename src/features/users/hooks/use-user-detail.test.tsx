import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { fetchUser } from '../services/users.service';
import { useUserDetail } from './use-user-detail';

vi.mock('../services/users.service', () => ({
  fetchUser: vi.fn(),
}));

const mockedFetchUser = vi.mocked(fetchUser);

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  displayName: 'Alice Nguyen',
  avatarUrl: null,
  banned: false,
  emailVerified: true,
  createdAt: '2026-10-01T09:15:00Z',
  role: 'ADMIN',
  roles: ['USER', 'ADMIN'],
};

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useUserDetail', () => {
  beforeEach(() => {
    mockedFetchUser.mockReset();
  });

  it('stays disabled and never fetches while the id is undefined', () => {
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUserDetail(undefined), { wrapper });

    expect(mockedFetchUser).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches the user when an id is provided', async () => {
    mockedFetchUser.mockResolvedValue(user);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUserDetail('u-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.username).toBe('alice');
    expect(mockedFetchUser).toHaveBeenCalledWith('u-1');
  });

  it('keys the cache under the user detail scope', async () => {
    mockedFetchUser.mockResolvedValue(user);
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(() => useUserDetail('u-42'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual([
      'admin',
      'users',
      'detail',
      'u-42',
    ]);
  });

  it('surfaces the failure state when the detail request rejects', async () => {
    mockedFetchUser.mockRejectedValue({ httpStatus: 404, kind: 'notFound', message: 'missing' });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUserDetail('u-404'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: 'notFound' });
  });
});
