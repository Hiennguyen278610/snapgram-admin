'use client';

import { useMemo } from 'react';
import { useCurrentUser } from './use-current-user';

export function usePermission() {
  const { data: user, isLoading } = useCurrentUser();

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (user.roles && user.roles.some((r) => r.toUpperCase() === 'ADMIN')) return true;
    return false;
  }, [user]);

  const permissions = useMemo(() => {
    return user?.permissions ?? [];
  }, [user?.permissions]);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms: string[]): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (...perms: string[]): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return perms.every((p) => permissions.includes(p));
  };

  return {
    user,
    isLoading,
    isAdmin,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
