'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { CreateRoleInput, RoleDetail } from '../schemas/role.schema';
import { createRole } from '../services/rbac.service';

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation<RoleDetail, ApiError, CreateRoleInput>({
    mutationFn: createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rbacKeys.roles() });
    },
  });
}
