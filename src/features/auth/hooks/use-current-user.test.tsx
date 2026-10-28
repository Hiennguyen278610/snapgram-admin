import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { CurrentUser } from '../schemas/current-user.schema';
import { useCurrentUser } from './use-current-user';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/lib/api/client', () => ({ apiClient: api }));

const ADMIN: CurrentUser = {
  id: 'admin-id',
  username: 'admin',
  email: 'admin@snapgram.com',
  role: 'ADMIN',
  roles: ['ADMIN'],
  permissions: ['USER:READ'],
  displayName: 'Administrator',
  emailVerified: true,
  createdAt: '2026-10-08T00:00:00Z',
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

describe('useCurrentUser', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
  });

  it('starts without data and calls GET /api/auth/me', async () => {
    api.get.mockResolvedValue({ data: ADMIN });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/auth/me'));
    await waitFor(() => expect(result.current.data).toEqual(ADMIN));
  });

  it('caches the admin identity under the auth.me query key (conventions §5.1)', async () => {
    api.get.mockResolvedValue({ data: ADMIN });
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['auth', 'me'])).toEqual(ADMIN);
  });

  it('does not retry when the session is rejected', async () => {
    api.get.mockRejectedValue({ httpStatus: 401, kind: 'unauthorized', message: 'nope' });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(api.get).toHaveBeenCalledTimes(1);
  });
});
