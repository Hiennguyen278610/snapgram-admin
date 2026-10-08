import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { Report } from '../schemas/report.schema';
import { fetchReportDetail } from '../services/reports.service';
import { useReportDetail } from './use-report-detail';

vi.mock('../services/reports.service', () => ({
  fetchReportDetail: vi.fn(),
}));

const mockedFetchReportDetail = vi.mocked(fetchReportDetail);

const report: Report = {
  id: 'r-1',
  reporterId: 'u-9',
  targetType: 'USER',
  targetId: 'target-1',
  reason: 'fake_account',
  description: null,
  status: 'REVIEWED',
  createdAt: '2026-10-08T06:00:00Z',
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

describe('useReportDetail', () => {
  beforeEach(() => {
    mockedFetchReportDetail.mockReset();
  });

  it('does not fetch while no id is selected', () => {
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useReportDetail(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedFetchReportDetail).not.toHaveBeenCalled();
  });

  it('fetches the report by id and keys the cache on it', async () => {
    mockedFetchReportDetail.mockResolvedValue(report);
    const { wrapper, queryClient } = makeWrapper();

    const { result } = renderHook(() => useReportDetail('r-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchReportDetail).toHaveBeenCalledWith('r-1');
    expect(result.current.data?.targetType).toBe('USER');
    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual([
      'admin',
      'reports',
      'detail',
      'r-1',
    ]);
  });

  it('exposes a notFound error for a 404 response', async () => {
    mockedFetchReportDetail.mockRejectedValue({
      httpStatus: 404,
      kind: 'notFound',
      message: 'Report not found',
    });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useReportDetail('missing'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ kind: 'notFound' });
  });
});
