'use client';

import { useQuery } from '@tanstack/react-query';
import { reportKeys } from '@/lib/api/query-keys';
import { fetchReportDetail } from '../services/reports.service';

export function useReportDetail(id?: string) {
  return useQuery({
    queryKey: reportKeys.detail(id ?? ''),
    queryFn: () => fetchReportDetail(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
