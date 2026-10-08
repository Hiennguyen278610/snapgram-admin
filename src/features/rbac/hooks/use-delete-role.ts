'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import { deleteRole } from '../services/rbac.service';

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: deleteRole,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: rbacKeys.role(id) });
    },
  });
}
