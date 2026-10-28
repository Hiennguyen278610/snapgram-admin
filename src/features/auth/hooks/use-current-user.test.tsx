import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import { fetchCurrentUser } from '../services/auth.service';
import { useCurrentUser } from './use-current-user';

vi.mock('../services/auth.service', () => ({
  fetchCurrentUser: vi.fn(),
}));

const mockedFetch = vi.mocked(fetchCurrentUser);

function makeWrapper() {
  const qc = makeQueryClient();
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('useCurrentUser', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('resolves the current user', async () => {
    mockedFetch.mockResolvedValue({
      id: '01dd12b3-c2fb-46cc-ac26-b237aee68510',
      username: 'admin',
      displayName: 'Snapgram Admin',
      email: 'admin@snapgram.com',
      role: 'ADMIN',
      roles: ['ADMIN'],
      permissions: ['USER:READ'],
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.username).toBe('admin');
    expect(result.current.data?.role).toBe('ADMIN');
  });
});
