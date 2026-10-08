import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import { deleteRole } from '../services/rbac.service';
import { useDeleteRole } from './use-delete-role';

vi.mock('../services/rbac.service', () => ({
  deleteRole: vi.fn(),
}));

const mockedDeleteRole = vi.mocked(deleteRole);

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useDeleteRole', () => {
  beforeEach(() => {
    mockedDeleteRole.mockReset();
  });

  it('starts idle', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteRole(), { wrapper });

    expect(result.current.isIdle).toBe(true);
  });

  it('deletes the role by id and resolves void', async () => {
    mockedDeleteRole.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteRole(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('r-support')).resolves.toBeUndefined();
    });

    expect(mockedDeleteRole.mock.calls[0][0]).toBe('r-support');
  });

  it('invalidates the roles list and the deleted role detail', async () => {
    mockedDeleteRole.mockResolvedValue(undefined);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteRole(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('r-support');
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'rbac', 'roles']);
    expect(invalidatedKeys).toContainEqual(['admin', 'rbac', 'role', 'r-support']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedDeleteRole.mockRejectedValue({ httpStatus: 403, kind: 'forbidden', message: 'nope' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteRole(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('r-admin')).rejects.toMatchObject({
        kind: 'forbidden',
      });
    });

    expect(result.current.isError).toBe(true);
  });
});
