import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { PermissionMap } from '../schemas/permission.schema';
import { fetchPermissions } from '../services/rbac.service';
import { usePermissionsList } from './use-permissions-list';

vi.mock('../services/rbac.service', () => ({
  fetchPermissions: vi.fn(),
}));

const mockedFetchPermissions = vi.mocked(fetchPermissions);

const permissions: PermissionMap = {
  CONTENT_MODERATION: [
    { id: 'p-1', name: 'COMMENT:DELETE', category: 'CONTENT_MODERATION', description: 'x' },
  ],
  REPORT_MANAGEMENT: [],
  SUPPORT: [],
  SYSTEM: [],
  USER_MANAGEMENT: [],
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

describe('usePermissionsList', () => {
  beforeEach(() => {
    mockedFetchPermissions.mockReset();
  });

  it('starts in the loading state', () => {
    mockedFetchPermissions.mockResolvedValue(permissions);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => usePermissionsList(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('resolves the category map from the service', async () => {
    mockedFetchPermissions.mockResolvedValue(permissions);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => usePermissionsList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.CONTENT_MODERATION).toHaveLength(1);
  });

  it('keys the cache with rbacKeys.permissions() and a 5min staleTime (brief §4)', async () => {
    mockedFetchPermissions.mockResolvedValue(permissions);
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(() => usePermissionsList(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = queryClient.getQueryCache().getAll()[0];
    const options = query.options as unknown as { staleTime?: number };
    expect(query.queryKey).toEqual(['admin', 'rbac', 'permissions']);
    expect(options.staleTime).toBe(300_000);
  });

  it('exposes the failure state when the service rejects', async () => {
    mockedFetchPermissions.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'boom' });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => usePermissionsList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
