'use client';

import { useQuery } from '@tanstack/react-query';
import { rbacKeys } from '@/lib/api/query-keys';
import { fetchRoles } from '../services/rbac.service';

export function useRolesList() {
  return useQuery({
    queryKey: rbacKeys.roles(),
    queryFn: fetchRoles,
    staleTime: 60_000,
  });
}
