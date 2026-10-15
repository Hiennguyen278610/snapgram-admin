'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { logoutAdmin } from '../services/auth.service';

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logoutAdmin,
    onSuccess: () => {
      qc.clear();
      router.push('/admin/login');
      router.refresh();
    },
  });
}
