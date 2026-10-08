import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { Report } from '../schemas/report.schema';
import { resolveReport } from '../services/reports.service';
import { useResolveReport } from './use-resolve-report';

vi.mock('../services/reports.service', () => ({
  resolveReport: vi.fn(),
}));

const mockedResolveReport = vi.mocked(resolveReport);

const report: Report = {
  id: 'r-1',
  reporterId: 'u-9',
  targetType: 'POST',
  targetId: 'p-1',
  reason: 'spam',
  description: 'Spam content',
  status: 'RESOLVED',
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

describe('useResolveReport', () => {
  beforeEach(() => {
    mockedResolveReport.mockReset();
  });

  it('starts idle', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useResolveReport(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isIdle).toBe(true);
  });

  it('calls the resolve service with the report id', async () => {
    mockedResolveReport.mockResolvedValue(report);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useResolveReport(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync('r-1');
    });

    expect(mockedResolveReport).toHaveBeenCalledWith('r-1');
    expect(response).toMatchObject({ status: 'RESOLVED' });
  });

  it('invalidates the report lists and the affected detail (conventions §6)', async () => {
    mockedResolveReport.mockResolvedValue(report);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useResolveReport(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('r-1');
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'reports', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'reports', 'detail', 'r-1']);
  });

  it('exposes the error when the mutation fails', async () => {
    mockedResolveReport.mockRejectedValue({ httpStatus: 409, kind: 'conflict', message: 'nope' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useResolveReport(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('r-1')).rejects.toMatchObject({ kind: 'conflict' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
