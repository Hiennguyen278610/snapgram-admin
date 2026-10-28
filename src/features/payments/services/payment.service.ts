import { apiClient } from '@/lib/api/client';
import type { PaymentFilters } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import {
  pagePaymentOrderSchema,
  paymentOrderSchema,
  type PagePaymentOrder,
  type PaymentOrder,
} from '../schemas/payment.schema';

export const PAYMENTS_ENDPOINT = '/api/admin/payments';

function invalidShape(label: string, data: unknown, issues: unknown): ApiError {
  console.warn(`[payments] Invalid ${label} response shape`, issues);
  return {
    httpStatus: 0,
    kind: 'server',
    message: 'Invalid response shape',
    rawResponse: data,
  };
}

export async function fetchPayments(filters: PaymentFilters = {}): Promise<PagePaymentOrder> {
  const params: Record<string, string | number> = {
    page: filters.page ?? 0,
    size: filters.size ?? 20,
    sort: filters.sort ?? 'createdAt,desc',
  };

  if (filters.status) params.status = filters.status;
  if (filters.productCode) params.productCode = filters.productCode;
  if (filters.userId) params.userId = filters.userId;

  const { data } = await apiClient.get(PAYMENTS_ENDPOINT, { params });

  const parsed = pagePaymentOrderSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('payments list', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function reconcilePayment(orderId: string): Promise<PaymentOrder> {
  const { data } = await apiClient.post(
    `${PAYMENTS_ENDPOINT}/${encodeURIComponent(orderId)}/reconcile`
  );

  const parsed = paymentOrderSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('reconcile payment', data, parsed.error.issues);
  }

  return parsed.data;
}
