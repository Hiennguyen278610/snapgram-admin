'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { PaymentFilters, PaymentStatus } from '@/lib/api/query-keys';

export const DEFAULT_PAYMENT_PAGE_SIZE = 20;

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
];

function parseStatus(raw: string | null): PaymentStatus | undefined {
  return PAYMENT_STATUSES.find((s) => s === raw);
}

function parsePage(raw: string | null): number {
  if (raw === null) return 0;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function parseSize(raw: string | null): number {
  if (raw === null) return DEFAULT_PAYMENT_PAGE_SIZE;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_PAYMENT_PAGE_SIZE;
}

export interface UsePaymentFiltersResult {
  status: PaymentStatus | undefined;
  page: number;
  size: number;
  filters: PaymentFilters;
  setStatus: (status: PaymentStatus | undefined) => void;
  setPage: (page: number) => void;
}

interface Patch {
  status?: PaymentStatus | null;
  page?: number;
}

export function usePaymentFilters(): UsePaymentFiltersResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = parseStatus(searchParams.get('status'));
  const page = parsePage(searchParams.get('page'));
  const size = parseSize(searchParams.get('size'));

  const filters = useMemo<PaymentFilters>(
    () => ({
      page,
      size,
      ...(status ? { status } : {}),
    }),
    [page, size, status]
  );

  const apply = useCallback(
    (patch: Patch) => {
      const params = new URLSearchParams(searchParams.toString());

      if (patch.status === null) params.delete('status');
      else if (patch.status !== undefined) params.set('status', patch.status);

      if (patch.page !== undefined) params.set('page', String(Math.max(0, patch.page)));
      if (!params.has('page')) params.set('page', '0');
      params.set('size', String(size));

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, size]
  );

  const setStatus = useCallback(
    (value: PaymentStatus | undefined) => {
      apply({ status: value ?? null, page: 0 });
    },
    [apply]
  );

  const setPage = useCallback(
    (value: number) => {
      apply({ page: value });
    },
    [apply]
  );

  return { status, page, size, filters, setStatus, setPage };
}
