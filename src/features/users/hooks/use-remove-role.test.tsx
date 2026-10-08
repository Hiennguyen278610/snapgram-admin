import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { removeRole } from '../services/users.service';
import { useRemoveRole } from './use-remove-role';

vi.mock('../services/users.service', () => ({
  removeRole: vi.fn(),
}));

const mockedRemoveRole = vi.mocked(removeRole);

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  banned: false,
  role: 'USER',
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

describe('useRemoveRole', () => {
  beforeEach(() => {
    mockedRemoveRole.mockReset();
  });

  it('calls the remove service with the id and role', async () => {
    mockedRemoveRole.mockResolvedValue({ ...user, roles: [] });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRemoveRole(), { wrapper });

    let response: AdminUser | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ id: 'u-1', role: 'USER' });
    });

    expect(mockedRemoveRole).toHaveBeenCalledWith('u-1', 'USER');
    expect(response?.roles).toEqual([]);
  });

  it('invalidates the lists and the detail but NOT the dashboard stats (conventions §6)', async () => {
    mockedRemoveRole.mockResolvedValue({ ...user, roles: [] });
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useRemoveRole(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'u-1', role: 'USER' });
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'detail', 'u-1']);
    expect(invalidatedKeys).not.toContainEqual(['dashboard', 'stats']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedRemoveRole.mockRejectedValue({ httpStatus: 404, kind: 'notFound', message: 'gone' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useRemoveRole(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ id: 'u-1', role: 'USER' })).rejects.toMatchObject({
        kind: 'notFound',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
