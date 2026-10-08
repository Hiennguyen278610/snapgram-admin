import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { unbanUser } from '../services/users.service';
import { useUnbanUser } from './use-unban-user';

vi.mock('../services/users.service', () => ({
  unbanUser: vi.fn(),
}));

const mockedUnbanUser = vi.mocked(unbanUser);

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  banned: false,
  bannedAt: null,
  banReason: null,
  roles: ['USER'],
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

describe('useUnbanUser', () => {
  beforeEach(() => {
    mockedUnbanUser.mockReset();
  });

  it('calls the unban service with the id', async () => {
    mockedUnbanUser.mockResolvedValue(user);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnbanUser(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync('u-1');
    });

    expect(mockedUnbanUser).toHaveBeenCalledWith('u-1');
    expect(response).toMatchObject({ banned: false });
  });

  it('invalidates the user lists, the user detail and the dashboard stats (conventions §6)', async () => {
    mockedUnbanUser.mockResolvedValue(user);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUnbanUser(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('u-1');
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'detail', 'u-1']);
    expect(invalidatedKeys).toContainEqual(['dashboard', 'stats']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedUnbanUser.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'boom' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUnbanUser(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('u-1')).rejects.toMatchObject({ kind: 'server' });
    });

    expect(result.current.isError).toBe(true);
  });
});
