'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { ReportFilters, ReportStatus, ReportTargetType } from '@/lib/api/query-keys';
import { REPORT_STATUSES, REPORT_TARGET_TYPES } from '../schemas/report.schema';

export const DEFAULT_REPORT_PAGE_SIZE = 20;

function parseStatus(raw: string | null): ReportStatus | undefined {
  // `find` keeps the value inside the UPPERCASE union: an unknown or
  // lowercase param (the real backend answers 400) is ignored entirely.
  return REPORT_STATUSES.find((status) => status === raw);
}

function parseTargetType(raw: string | null): ReportTargetType | undefined {
  return REPORT_TARGET_TYPES.find((targetType) => targetType === raw);
}

function parsePage(raw: string | null): number {
  if (raw === null) return 0;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function parseSize(raw: string | null): number {
  if (raw === null) return DEFAULT_REPORT_PAGE_SIZE;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_REPORT_PAGE_SIZE;
}

export interface UseReportFiltersResult {
  status: ReportStatus | undefined;
  targetType: ReportTargetType | undefined;
  page: number;
  size: number;
  filters: ReportFilters;
  setStatus: (status: ReportStatus | undefined) => void;
  setTargetType: (targetType: ReportTargetType | undefined) => void;
  setPage: (page: number) => void;
}

interface Patch {
  status?: ReportStatus | null;
  targetType?: ReportTargetType | null;
  page?: number;
}

/**
 * URL state synchronization (route-map.md §7): the moderation queue keeps
 * `status`, `targetType`, `page` and `size` in the query string so a shift
 * handover link survives F5 and can be pasted to another moderator.
 *
 * `null` clears a param, `undefined` leaves it untouched. Changing the tab or
 * the target filter always resets `page` to 0.
 */
export function useReportFilters(): UseReportFiltersResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = parseStatus(searchParams.get('status'));
  const targetType = parseTargetType(searchParams.get('targetType'));
  const page = parsePage(searchParams.get('page'));
  const size = parseSize(searchParams.get('size'));

  const filters = useMemo<ReportFilters>(
    () => ({
      page,
      size,
      ...(status ? { status } : {}),
      ...(targetType ? { targetType } : {}),
    }),
    [page, size, status, targetType]
  );

  const apply = useCallback(
    (patch: Patch) => {
      const params = new URLSearchParams(searchParams.toString());

      if (patch.status === null) params.delete('status');
      else if (patch.status !== undefined) params.set('status', patch.status);

      if (patch.targetType === null) params.delete('targetType');
      else if (patch.targetType !== undefined) params.set('targetType', patch.targetType);

      if (patch.page !== undefined) params.set('page', String(Math.max(0, patch.page)));
      if (!params.has('page')) params.set('page', '0');
      params.set('size', String(size));

      const query = params.toString();
      // `pathname` comes from next-intl, which strips the locale prefix so the
      // router re-adds it (never `/en/en/...`).
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, size]
  );

  const setStatus = useCallback(
    (value: ReportStatus | undefined) => {
      apply({ status: value ?? null, page: 0 });
    },
    [apply]
  );

  const setTargetType = useCallback(
    (value: ReportTargetType | undefined) => {
      apply({ targetType: value ?? null, page: 0 });
    },
    [apply]
  );

  const setPage = useCallback(
    (value: number) => {
      apply({ page: value });
    },
    [apply]
  );

  return { status, targetType, page, size, filters, setStatus, setTargetType, setPage };
}
