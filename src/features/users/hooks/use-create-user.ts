'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import type { AdminUser, CreateAdminUserInput } from '../schemas/user.schema';
import { createUser } from '../services/users.service';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, CreateAdminUserInput>({
    mutationFn: (payload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
