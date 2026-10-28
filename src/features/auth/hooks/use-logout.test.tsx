import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import { useLogout } from './use-logout';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: nav.push, refresh: nav.refresh }),
}));

vi.mock('@/lib/api/client', () => ({ apiClient: api }));

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useLogout', () => {
  beforeEach(() => {
    nav.push.mockReset();
    nav.refresh.mockReset();
    api.get.mockReset();
    api.post.mockReset();
  });

  it('returns a mutation in idle state', () => {
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useLogout(), { wrapper });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('posts to /api/auth/logout and lands on the login route', async () => {
    api.post.mockResolvedValue({ status: 204 });
    const { wrapper, queryClient } = makeWrapper();
    const clear = vi.spyOn(queryClient, 'clear');

    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(api.post).toHaveBeenCalledWith('/api/auth/logout', {});
    expect(clear).toHaveBeenCalled();
    expect(nav.push).toHaveBeenCalledWith('/admin/login');
    expect(nav.refresh).toHaveBeenCalled();
  });
});
