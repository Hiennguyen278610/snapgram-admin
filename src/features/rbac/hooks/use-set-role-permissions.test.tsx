import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { RoleDetail } from '../schemas/role.schema';
import { setRolePermissions } from '../services/rbac.service';
import { useSetRolePermissions } from './use-set-role-permissions';

vi.mock('../services/rbac.service', () => ({
  setRolePermissions: vi.fn(),
}));

const mockedSetRolePermissions = vi.mocked(setRolePermissions);

const updated: RoleDetail = {
  id: 'r-support',
  name: 'SUPPORT',
  description: 'Support',
  permissions: [
    {
      id: 'p-1',
      name: 'REPORT:VIEW',
      category: 'REPORT_MANAGEMENT',
      description: 'x',
    },
  ],
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

describe('useSetRolePermissions', () => {
  beforeEach(() => {
    mockedSetRolePermissions.mockReset();
  });

  it('forwards the role id and permission ids to the service', async () => {
    mockedSetRolePermissions.mockResolvedValue(updated);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetRolePermissions(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'r-support', permissionIds: ['p-1'] });
    });

    expect(mockedSetRolePermissions).toHaveBeenCalledWith('r-support', ['p-1']);
  });

  it('invalidates the role detail and the roles list (conventions §6)', async () => {
    mockedSetRolePermissions.mockResolvedValue(updated);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSetRolePermissions(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'r-support', permissionIds: [] });
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'rbac', 'role', 'r-support']);
    expect(invalidatedKeys).toContainEqual(['admin', 'rbac', 'roles']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedSetRolePermissions.mockRejectedValue({
      httpStatus: 500,
      kind: 'server',
      message: 'boom',
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSetRolePermissions(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: 'r-support', permissionIds: [] })
      ).rejects.toMatchObject({ kind: 'server' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
