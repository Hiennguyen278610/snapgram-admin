'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser } from '../schemas/user.schema';
import { removeRole } from '../services/users.service';

export interface RemoveRoleVariables {
  id: string;
  role: string;
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, RemoveRoleVariables>({
    mutationFn: ({ id, role }) => removeRole(id, role),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}
