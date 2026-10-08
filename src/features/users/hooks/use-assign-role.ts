'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser } from '../schemas/user.schema';
import { assignRole } from '../services/users.service';

export interface AssignRoleVariables {
  id: string;
  role: string;
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, AssignRoleVariables>({
    mutationFn: ({ id, role }) => assignRole(id, role),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}
