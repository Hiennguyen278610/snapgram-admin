'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser, UpdateAdminUserInput } from '../schemas/user.schema';
import { updateUser } from '../services/users.service';

export interface UpdateUserVariables {
  id: string;
  payload: UpdateAdminUserInput;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, UpdateUserVariables>({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}
