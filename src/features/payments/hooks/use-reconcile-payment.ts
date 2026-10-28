'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { PaymentOrder } from '../schemas/payment.schema';
import { reconcilePayment } from '../services/payment.service';

export function useReconcilePayment() {
  const queryClient = useQueryClient();

  return useMutation<PaymentOrder, ApiError, string>({
    mutationFn: (orderId) => reconcilePayment(orderId),
    onSuccess: (_data, orderId) => {
      void queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: paymentKeys.detail(orderId) });
    },
  });
}
