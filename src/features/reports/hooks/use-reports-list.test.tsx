import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { PageReport } from '../schemas/report.schema';
import { fetchReports } from '../services/reports.service';
import { useReportsList } from './use-reports-list';

vi.mock('../services/reports.service', () => ({
  fetchReports: vi.fn(),
}));

const mockedFetchReports = vi.mocked(fetchReports);

const page: PageReport = {
  content: [
    {
      id: 'r-1',
      reporterId: 'u-9',
      targetType: 'POST',
      targetId: 'p-1',
      reason: 'spam',
      description: 'Spam content',
      status: 'PENDING',
      createdAt: '2026-10-08T06:00:00Z',
    },
  ],
  totalElements: 12,
  totalPages: 1,
  number: 0,
  size: 20,
  numberOfElements: 1,
  first: true,
  last: true,
  empty: false,
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

describe('useReportsList', () => {
  beforeEach(() => {
    mockedFetchReports.mockReset();
  });

  it('starts in the loading state', () => {
    mockedFetchReports.mockResolvedValue(page);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useReportsList({ page: 0, size: 20 }), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('resolves the page and forwards the filters to the service', async () => {
    mockedFetchReports.mockResolvedValue(page);
    const { wrapper } = makeWrapper();
    const filters = { status: 'PENDING', targetType: 'POST', page: 1, size: 20 } as const;

    const { result } = renderHook(() => useReportsList(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalElements).toBe(12);
    expect(mockedFetchReports).toHaveBeenCalledWith(filters);
  });

  it('keys the cache by the filters object (conventions §5.1)', async () => {
    mockedFetchReports.mockResolvedValue(page);
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(
      () => useReportsList({ status: 'REVIEWED', targetType: 'USER', page: 2, size: 20 }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual([
      'admin',
      'reports',
      'list',
      { status: 'REVIEWED', targetType: 'USER', page: 2, size: 20 },
    ]);
  });

  it('exposes the failure state when the service rejects', async () => {
    mockedFetchReports.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'boom' });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useReportsList({ page: 0, size: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: 'server' });
  });
});
