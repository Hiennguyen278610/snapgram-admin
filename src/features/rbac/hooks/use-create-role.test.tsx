import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { RoleDetail } from '../schemas/role.schema';
import { createRole } from '../services/rbac.service';
import { useCreateRole } from './use-create-role';

vi.mock('../services/rbac.service', () => ({
  createRole: vi.fn(),
}));

const mockedCreateRole = vi.mocked(createRole);

const created: RoleDetail = {
  id: 'r-new',
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

describe('useCreateRole', () => {
  beforeEach(() => {
    mockedCreateRole.mockReset();
  });

  it('starts idle', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateRole(), { wrapper });

    expect(result.current.isIdle).toBe(true);
  });

  it('creates the role through the service', async () => {
    mockedCreateRole.mockResolvedValue(created);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateRole(), { wrapper });

    let response: RoleDetail | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({
        name: 'SUPPORT_LEAD',
        description: 'Leads support',
        permissionIds: [],
      });
    });

    expect(mockedCreateRole.mock.calls[0][0]).toEqual({
      name: 'SUPPORT_LEAD',
      description: 'Leads support',
      permissionIds: [],
    });
    expect(response).toMatchObject({ id: 'r-new' });
  });

  it('invalidates rbacKeys.roles() on success (conventions §6)', async () => {
    mockedCreateRole.mockResolvedValue(created);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateRole(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'SUPPORT_LEAD' });
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'rbac', 'roles']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedCreateRole.mockRejectedValue({ httpStatus: 409, kind: 'conflict', message: 'dupe' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateRole(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ name: 'ADMIN' })).rejects.toMatchObject({
        kind: 'conflict',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
