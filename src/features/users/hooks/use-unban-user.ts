'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardKeys, userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser } from '../schemas/user.schema';
import { unbanUser } from '../services/users.service';

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, string>({
    mutationFn: (id) => unbanUser(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
