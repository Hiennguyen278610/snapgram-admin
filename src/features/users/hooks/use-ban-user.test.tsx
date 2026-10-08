import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { banUser } from '../services/users.service';
import { useBanUser } from './use-ban-user';

vi.mock('../services/users.service', () => ({
  banUser: vi.fn(),
}));

const mockedBanUser = vi.mocked(banUser);

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  banned: true,
  banReason: 'Spam',
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

describe('useBanUser', () => {
  beforeEach(() => {
    mockedBanUser.mockReset();
  });

  it('starts idle', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useBanUser(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isIdle).toBe(true);
  });

  it('calls the ban service with the id and the reason', async () => {
    mockedBanUser.mockResolvedValue(user);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useBanUser(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({ id: 'u-1', reason: 'Spam' });
    });

    expect(mockedBanUser).toHaveBeenCalledWith('u-1', 'Spam');
    expect(response).toMatchObject({ banned: true, banReason: 'Spam' });
  });

  it('invalidates the user lists, the user detail and the dashboard stats (conventions §6)', async () => {
    mockedBanUser.mockResolvedValue(user);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useBanUser(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'u-1', reason: 'Spam' });
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'detail', 'u-1']);
    expect(invalidatedKeys).toContainEqual(['dashboard', 'stats']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedBanUser.mockRejectedValue({ httpStatus: 403, kind: 'forbidden', message: 'nope' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useBanUser(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ id: 'u-1', reason: 'Spam' })).rejects.toMatchObject(
        { kind: 'forbidden' }
      );
    });

    expect(result.current.isError).toBe(true);
  });
});
