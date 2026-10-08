import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { PageAdminUser } from '../schemas/user.schema';
import { fetchUsers } from '../services/users.service';
import { useUsersList } from './use-users-list';

vi.mock('../services/users.service', () => ({
  fetchUsers: vi.fn(),
}));

const mockedFetchUsers = vi.mocked(fetchUsers);

const page: PageAdminUser = {
  content: [
    {
      id: 'u-1',
      username: 'alice',
      email: 'alice@snapgram.dev',
      displayName: 'Alice Nguyen',
      avatarUrl: null,
      banned: false,
      createdAt: '2026-10-01T09:15:00Z',
      role: 'ADMIN',
      roles: ['USER', 'ADMIN'],
    },
  ],
  totalElements: 25,
  totalPages: 2,
  number: 0,
  size: 20,
  numberOfElements: 1,
  first: true,
  last: false,
  empty: false,
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

describe('useUsersList', () => {
  beforeEach(() => {
    mockedFetchUsers.mockReset();
  });

  it('starts in the loading state', () => {
    mockedFetchUsers.mockResolvedValue(page);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUsersList({ page: 0, size: 20 }), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('resolves the page and forwards the filters to the service', async () => {
    mockedFetchUsers.mockResolvedValue(page);
    const { wrapper } = makeWrapper();
    const filters = { page: 1, size: 20, q: 'alice' };

    const { result } = renderHook(() => useUsersList(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalElements).toBe(25);
    expect(mockedFetchUsers).toHaveBeenCalledWith(filters);
  });

  it('keys the cache by the filters object (conventions §5.1)', async () => {
    mockedFetchUsers.mockResolvedValue(page);
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(() => useUsersList({ page: 2, size: 20, q: 'bob' }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual([
      'admin',
      'users',
      'list',
      { page: 2, size: 20, q: 'bob' },
    ]);
  });

  it('exposes the failure state when the service rejects', async () => {
    mockedFetchUsers.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'boom' });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useUsersList({ page: 0, size: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: 'server' });
  });
});
