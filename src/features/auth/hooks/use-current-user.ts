'use client';

import { useQuery } from '@tanstack/react-query';
import { authKeys } from '@/lib/api/query-keys';
import { fetchCurrentUser } from '../services/auth.service';

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
