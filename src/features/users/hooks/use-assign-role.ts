'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser, PageAdminUser } from '../schemas/user.schema';
import { assignRole } from '../services/users.service';

export interface AssignRoleVariables {
  id: string;
  role: string;
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, AssignRoleVariables>({
    mutationFn: ({ id, role }) => assignRole(id, role),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(userKeys.detail(variables.id), data);
      queryClient.setQueriesData<PageAdminUser>({ queryKey: userKeys.lists() }, (oldPage) => {
        if (!oldPage || !oldPage.content) return oldPage;
        return {
          ...oldPage,
          content: oldPage.content.map((u) => (u.id === data.id ? data : u)),
        };
      });
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}
