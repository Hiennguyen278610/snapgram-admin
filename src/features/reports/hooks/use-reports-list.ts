'use client';

import { useQuery } from '@tanstack/react-query';
import { reportKeys, type ReportFilters } from '@/lib/api/query-keys';
import { fetchReports } from '../services/reports.service';

export function useReportsList(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => fetchReports(filters),
    staleTime: 30_000,
  });
}
