import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { RoleDetail } from '../schemas/role.schema';
import { fetchRoleDetail } from '../services/rbac.service';
import { useRoleDetail } from './use-role-detail';

vi.mock('../services/rbac.service', () => ({
  fetchRoleDetail: vi.fn(),
}));

const mockedFetchRoleDetail = vi.mocked(fetchRoleDetail);

const role: RoleDetail = {
  id: 'r-support',
  name: 'SUPPORT',
  description: 'Support',
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

describe('useRoleDetail', () => {
  beforeEach(() => {
    mockedFetchRoleDetail.mockReset();
  });

  it('stays idle when no id is provided', () => {
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useRoleDetail(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedFetchRoleDetail).not.toHaveBeenCalled();
  });

  it('fetches the role once an id is provided', async () => {
    mockedFetchRoleDetail.mockResolvedValue(role);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useRoleDetail('r-support'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchRoleDetail).toHaveBeenCalledWith('r-support');
    expect(result.current.data?.name).toBe('SUPPORT');
  });

  it('keys the cache with rbacKeys.role(id) and a 60s staleTime', async () => {
    mockedFetchRoleDetail.mockResolvedValue(role);
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(() => useRoleDetail('r-support'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient.getQueryCache().getAll()[0];
    const options = query.options as unknown as { staleTime?: number };
    expect(query.queryKey).toEqual(['admin', 'rbac', 'role', 'r-support']);
    expect(options.staleTime).toBe(60_000);
  });

  it('exposes the failure state when the service rejects', async () => {
    mockedFetchRoleDetail.mockRejectedValue({
      httpStatus: 404,
      kind: 'notFound',
      message: 'nope',
    });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useRoleDetail('missing'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: 'notFound' });
  });
});
