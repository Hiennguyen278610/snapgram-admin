'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import { deleteUser } from '../services/users.service';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: (_data, userId) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });
}
