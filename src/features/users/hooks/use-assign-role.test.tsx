import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { assignRole } from '../services/users.service';
import { useAssignRole } from './use-assign-role';

vi.mock('../services/users.service', () => ({
  assignRole: vi.fn(),
}));

const mockedAssignRole = vi.mocked(assignRole);

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  banned: false,
  role: 'MODERATOR',
  roles: ['USER', 'MODERATOR'],
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

describe('useAssignRole', () => {
  beforeEach(() => {
    mockedAssignRole.mockReset();
  });

  it('calls the assign service with the id and role', async () => {
    mockedAssignRole.mockResolvedValue(user);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAssignRole(), { wrapper });

    let response: AdminUser | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ id: 'u-1', role: 'MODERATOR' });
    });

    expect(mockedAssignRole).toHaveBeenCalledWith('u-1', 'MODERATOR');
    expect(response?.roles).toContain('MODERATOR');
  });

  it('invalidates the lists and the detail but NOT the dashboard stats (conventions §6)', async () => {
    mockedAssignRole.mockResolvedValue(user);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAssignRole(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'u-1', role: 'MODERATOR' });
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'users', 'detail', 'u-1']);
    expect(invalidatedKeys).not.toContainEqual(['dashboard', 'stats']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedAssignRole.mockRejectedValue({ httpStatus: 409, kind: 'conflict', message: 'dup' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAssignRole(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: 'u-1', role: 'MODERATOR' })
      ).rejects.toMatchObject({ kind: 'conflict' });
    });

    expect(result.current.isError).toBe(true);
  });
});
