'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardKeys, userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser } from '../schemas/user.schema';
import { banUser } from '../services/users.service';

export interface BanUserVariables {
  id: string;
  reason: string;
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, BanUserVariables>({
    mutationFn: ({ id, reason }) => banUser(id, reason),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
