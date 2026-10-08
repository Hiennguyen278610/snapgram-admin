'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { Report } from '../schemas/report.schema';
import { dismissReport } from '../services/reports.service';

export function useDismissReport() {
  const queryClient = useQueryClient();

  return useMutation<Report, ApiError, string>({
    mutationFn: (id) => dismissReport(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
    },
  });
}
