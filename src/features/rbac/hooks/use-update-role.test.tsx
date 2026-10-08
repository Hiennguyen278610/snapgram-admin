import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { RoleDetail } from '../schemas/role.schema';
import { updateRole } from '../services/rbac.service';
import { useUpdateRole } from './use-update-role';

vi.mock('../services/rbac.service', () => ({
  updateRole: vi.fn(),
}));

const mockedUpdateRole = vi.mocked(updateRole);

const updated: RoleDetail = {
  id: 'r-support',
  name: 'SUPPORT_LEAD',
  description: 'Leads support',
  permissions: [],
  userCount: 0,
  system: false,
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

describe('useUpdateRole', () => {
  beforeEach(() => {
    mockedUpdateRole.mockReset();
  });

  it('forwards the id and payload to the service', async () => {
    mockedUpdateRole.mockResolvedValue(updated);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateRole(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'r-support',
        payload: { name: 'SUPPORT_LEAD', description: 'Leads support' },
      });
    });

    expect(mockedUpdateRole).toHaveBeenCalledWith('r-support', {
      name: 'SUPPORT_LEAD',
      description: 'Leads support',
    });
  });

  it('invalidates the roles list and the role detail (conventions §6)', async () => {
    mockedUpdateRole.mockResolvedValue(updated);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateRole(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'r-support', payload: { name: 'SUPPORT_LEAD' } });
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'rbac', 'roles']);
    expect(invalidatedKeys).toContainEqual(['admin', 'rbac', 'role', 'r-support']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedUpdateRole.mockRejectedValue({ httpStatus: 403, kind: 'forbidden', message: 'nope' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateRole(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: 'r-admin', payload: { name: 'ADMIN' } })
      ).rejects.toMatchObject({ kind: 'forbidden' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
