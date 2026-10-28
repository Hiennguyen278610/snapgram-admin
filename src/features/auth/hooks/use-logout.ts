'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { logoutAdmin } from '../services/auth.service';

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => {
      queryClient.clear();
      router.push('/admin/login');
      router.refresh();
    },
  });
}
