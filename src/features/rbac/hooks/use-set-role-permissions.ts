'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { RoleDetail } from '../schemas/role.schema';
import { setRolePermissions } from '../services/rbac.service';

export interface SetRolePermissionsVariables {
  id: string;
  permissionIds: string[];
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation<RoleDetail, ApiError, SetRolePermissionsVariables>({
    mutationFn: ({ id, permissionIds }) => setRolePermissions(id, permissionIds),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: rbacKeys.role(variables.id) });
      void queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}
