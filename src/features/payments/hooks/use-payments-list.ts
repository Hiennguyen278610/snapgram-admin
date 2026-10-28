'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentKeys, type PaymentFilters } from '@/lib/api/query-keys';
import { fetchPayments } from '../services/payment.service';

export function usePaymentsList(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => fetchPayments(filters),
    staleTime: 30_000,
  });
}
