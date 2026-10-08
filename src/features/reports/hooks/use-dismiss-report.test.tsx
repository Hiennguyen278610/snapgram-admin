import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { Report } from '../schemas/report.schema';
import { dismissReport } from '../services/reports.service';
import { useDismissReport } from './use-dismiss-report';

vi.mock('../services/reports.service', () => ({
  dismissReport: vi.fn(),
}));

const mockedDismissReport = vi.mocked(dismissReport);

const report: Report = {
  id: 'r-2',
  reporterId: 'u-9',
  targetType: 'COMMENT',
  targetId: 'c-1',
  reason: 'off_topic',
  description: null,
  status: 'DISMISSED',
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

describe('useDismissReport', () => {
  beforeEach(() => {
    mockedDismissReport.mockReset();
  });

  it('starts idle', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDismissReport(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isIdle).toBe(true);
  });

  it('calls the dismiss service with the report id', async () => {
    mockedDismissReport.mockResolvedValue(report);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDismissReport(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync('r-2');
    });

    expect(mockedDismissReport).toHaveBeenCalledWith('r-2');
    expect(response).toMatchObject({ status: 'DISMISSED' });
  });

  it('invalidates the report lists and the affected detail (conventions §6)', async () => {
    mockedDismissReport.mockResolvedValue(report);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDismissReport(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('r-2');
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'reports', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'reports', 'detail', 'r-2']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedDismissReport.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'boom' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDismissReport(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('r-2')).rejects.toMatchObject({ kind: 'server' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
