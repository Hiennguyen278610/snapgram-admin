'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardKeys } from '@/lib/api/query-keys';
import { fetchDashboardStats } from '../services/dashboard.service';

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
