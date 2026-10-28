'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser, PageAdminUser } from '../schemas/user.schema';
import { removeRole } from '../services/users.service';

export interface RemoveRoleVariables {
  id: string;
  role: string;
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, RemoveRoleVariables>({
    mutationFn: ({ id, role }) => removeRole(id, role),
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
