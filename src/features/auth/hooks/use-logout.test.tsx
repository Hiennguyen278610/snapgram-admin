import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import { logoutAdmin } from '../services/auth.service';
import { useLogout } from './use-logout';

const replaceMock = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('../services/auth.service', () => ({
  logoutAdmin: vi.fn(),
}));

const mockedLogout = vi.mocked(logoutAdmin);

function makeWrapper() {
  const qc = makeQueryClient();
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

describe('useLogout', () => {
  beforeEach(() => {
    mockedLogout.mockReset();
    replaceMock.mockReset();
  });

  it('calls logoutAdmin, clears queryClient and redirects to login', async () => {
    mockedLogout.mockResolvedValue();
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedLogout).toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/admin/login');
  });
});
