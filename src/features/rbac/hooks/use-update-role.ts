'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { RoleDetail, UpdateRoleInput } from '../schemas/role.schema';
import { updateRole } from '../services/rbac.service';

export interface UpdateRoleVariables {
  id: string;
  payload: UpdateRoleInput;
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation<RoleDetail, ApiError, UpdateRoleVariables>({
    mutationFn: ({ id, payload }) => updateRole(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: rbacKeys.role(variables.id) });
    },
  });
}
