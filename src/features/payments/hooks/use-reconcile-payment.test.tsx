import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { PaymentOrder } from '../schemas/payment.schema';
import { reconcilePayment } from '../services/payment.service';
import { useReconcilePayment } from './use-reconcile-payment';

vi.mock('../services/payment.service', () => ({
  reconcilePayment: vi.fn(),
}));

const mockedReconcile = vi.mocked(reconcilePayment);

const mockOrder: PaymentOrder = {
  id: 'p-1',
  orderId: 'ord-123',
  productCode: 'BLUE_TICK',
  amount: 199000,
  currency: 'VND',
  status: 'SUCCESS',
  createdAt: '2026-10-24T07:16:28Z',
  expiresAt: '2026-10-24T07:31:28Z',
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

describe('useReconcilePayment', () => {
  beforeEach(() => {
    mockedReconcile.mockReset();
  });

  it('mutates payment status and triggers reconcile', async () => {
    mockedReconcile.mockResolvedValue(mockOrder);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReconcilePayment(), { wrapper });

    result.current.mutate('ord-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedReconcile).toHaveBeenCalledWith('ord-123');
    expect(result.current.data?.status).toBe('SUCCESS');
  });
});
