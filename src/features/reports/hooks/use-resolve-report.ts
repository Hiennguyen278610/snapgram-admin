'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { Report } from '../schemas/report.schema';
import { resolveReport } from '../services/reports.service';

/**
 * Mutation variable is the report id (conventions §6: invalidate the lists and
 * the affected detail entry).
 */
export function useResolveReport() {
  const queryClient = useQueryClient();

  return useMutation<Report, ApiError, string>({
    mutationFn: (id) => resolveReport(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
    },
  });
}
