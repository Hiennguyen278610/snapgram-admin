'use client';

import { useQuery } from '@tanstack/react-query';
import { userKeys } from '@/lib/api/query-keys';
import { fetchUser } from '../services/users.service';

export function useUserDetail(id?: string) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => fetchUser(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
