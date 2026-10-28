import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { PagePaymentOrder } from '../schemas/payment.schema';
import { fetchPayments } from '../services/payment.service';
import { usePaymentsList } from './use-payments-list';

vi.mock('../services/payment.service', () => ({
  fetchPayments: vi.fn(),
}));

const mockedFetchPayments = vi.mocked(fetchPayments);

const mockPage: PagePaymentOrder = {
  content: [
    {
      id: 'p-1',
      orderId: 'ord-123',
      productCode: 'BLUE_TICK',
      amount: 199000,
      currency: 'VND',
      status: 'SUCCESS',
      createdAt: '2026-10-24T07:16:28Z',
      expiresAt: '2026-10-24T07:31:28Z',
    },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
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

describe('usePaymentsList', () => {
  beforeEach(() => {
    mockedFetchPayments.mockReset();
  });

  it('fetches payments and resolves data', async () => {
    mockedFetchPayments.mockResolvedValue(mockPage);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => usePaymentsList({ page: 0, size: 20 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content).toHaveLength(1);
    expect(result.current.data?.content[0].orderId).toBe('ord-123');
  });

  it('passes filters to fetchPayments', async () => {
    mockedFetchPayments.mockResolvedValue(mockPage);
    const { wrapper } = makeWrapper();
    const filters = { status: 'PENDING' as const, page: 1, size: 10 };
    renderHook(() => usePaymentsList(filters), { wrapper });

    await waitFor(() => expect(mockedFetchPayments).toHaveBeenCalledWith(filters));
  });
});
