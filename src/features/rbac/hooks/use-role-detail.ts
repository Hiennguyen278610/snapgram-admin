'use client';

import { useQuery } from '@tanstack/react-query';
import { rbacKeys } from '@/lib/api/query-keys';
import { fetchRoleDetail } from '../services/rbac.service';

export function useRoleDetail(id?: string) {
  return useQuery({
    queryKey: rbacKeys.role(id ?? ''),
    queryFn: () => fetchRoleDetail(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
