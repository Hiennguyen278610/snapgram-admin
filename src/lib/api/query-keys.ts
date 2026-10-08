/**
 * Centralized TanStack Query keys (conventions.md §5.1).
 * Hierarchy convention: `[domain, scope, ...params]`.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export interface UserFilters {
  page?: number;
  size?: number;
  q?: string;
}

export const userKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export const rbacKeys = {
  all: ['admin', 'rbac'] as const,
  roles: () => [...rbacKeys.all, 'roles'] as const,
  role: (id: string) => [...rbacKeys.all, 'role', id] as const,
  permissions: () => [...rbacKeys.all, 'permissions'] as const,
};

/**
 * Report enums — verified against the LIVE Swagger + real backend data
 * (2026-10-08). Values are **case-sensitive UPPERCASE**; sending anything else
 * makes the backend answer `500` instead of `400` (see BI-009).
 */
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
export type ReportTargetType = 'POST' | 'COMMENT' | 'USER';

export interface ReportFilters {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  page?: number;
  size?: number;
}

export const reportKeys = {
  all: ['admin', 'reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: ReportFilters) => [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
};

export interface MediaFilters {
  page?: number;
  size?: number;
}

export const mediaKeys = {
  all: ['admin', 'media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (filters: MediaFilters) => [...mediaKeys.lists(), filters] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
};

/**
 * System health keys (Sprint 3.1). Unlike the admin domains these are not
 * prefixed with `admin` — the actuator proxy is public and belongs to no
 * domain. `services()` is the invalidation scope for every service check.
 */
export const healthKeys = {
  all: ['health'] as const,
  services: () => [...healthKeys.all, 'service'] as const,
  service: (id: string) => [...healthKeys.services(), id] as const,
};
