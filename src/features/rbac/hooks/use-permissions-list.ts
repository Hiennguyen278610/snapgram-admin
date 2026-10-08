'use client';

import { useQuery } from '@tanstack/react-query';
import { rbacKeys } from '@/lib/api/query-keys';
import { fetchPermissions } from '../services/rbac.service';

/**
 * The permission catalogue is near-static reference data, so it stays fresh for
 * five minutes (brief §4).
 */
export function usePermissionsList() {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: fetchPermissions,
    staleTime: 5 * 60_000,
  });
}
