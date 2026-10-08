import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

import { useDashboardStats } from './use-dashboard-stats';
import { makeQueryClient } from '@/test-utils/render';
import enMessages from '../../../../messages/en.json';

vi.mock('../services/dashboard.service', () => ({
  fetchDashboardStats: vi.fn().mockResolvedValue({
    totalUsers: 1250,
    activeUsers: 1180,
    bannedUsers: 70,
    newUsersToday: 12,
    newUsersThisWeek: 87,
    emailVerifiedUsers: 1100,
    twoFaEnabledUsers: 240,
    recentUsers: [],
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = makeQueryClient();
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </NextIntlClientProvider>
  );
}

describe('useDashboardStats', () => {
  it('returns a query object that starts in the loading state', () => {
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
    expect(typeof result.current.refetch).toBe('function');
  });
});
