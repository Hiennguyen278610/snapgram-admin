import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { RoleDetail } from '../schemas/role.schema';
import { fetchRoles } from '../services/rbac.service';
import { useRolesList } from './use-roles-list';

vi.mock('../services/rbac.service', () => ({
  fetchRoles: vi.fn(),
}));

const mockedFetchRoles = vi.mocked(fetchRoles);

const roles: RoleDetail[] = [
  {
    id: 'r-admin',
    name: 'ADMIN',
    description: 'Admin',
    permissions: [],
    userCount: 1,
    system: true,
  },
  {
    id: 'r-support',
    name: 'SUPPORT',
    description: 'Support',
    permissions: [],
    userCount: 0,
    system: false,
  },
];

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useRolesList', () => {
  beforeEach(() => {
    mockedFetchRoles.mockReset();
  });

  it('starts in the loading state', () => {
    mockedFetchRoles.mockResolvedValue(roles);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useRolesList(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('resolves the roles array', async () => {
    mockedFetchRoles.mockResolvedValue(roles);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useRolesList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(mockedFetchRoles).toHaveBeenCalledTimes(1);
  });

  it('keys the cache with rbacKeys.roles() and a 60s staleTime (brief §4)', async () => {
    mockedFetchRoles.mockResolvedValue(roles);
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(() => useRolesList(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient.getQueryCache().getAll()[0];
    const options = query.options as unknown as { staleTime?: number };
    expect(query.queryKey).toEqual(['admin', 'rbac', 'roles']);
    expect(options.staleTime).toBe(60_000);
  });

  it('exposes the failure state when the service rejects', async () => {
    mockedFetchRoles.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'boom' });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useRolesList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: 'server' });
  });
});
