'use client';

import { useQuery } from '@tanstack/react-query';
import { userKeys, type UserFilters } from '@/lib/api/query-keys';
import { fetchUsers } from '../services/users.service';

export function useUsersList(filters: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => fetchUsers(filters),
    staleTime: 60_000,
  });
}
