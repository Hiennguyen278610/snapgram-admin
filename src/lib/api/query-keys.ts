/**
 * Centralized TanStack Query keys (conventions.md §5.1).
 * Hierarchy convention: `[domain, scope, ...params]`.
 */
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

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
 * makes the backend answer `400` (verified live 2026-10-16).
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

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentFilters {
  status?: PaymentStatus;
  productCode?: string;
  userId?: string;
  sort?: string;
  page?: number;
  size?: number;
}

export const paymentKeys = {
  all: ['admin', 'payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
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

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketCategory =
  'TECHNICAL_ISSUE' | 'ACCOUNT_ISSUE' | 'PAYMENT_ISSUE' | 'FEATURE_FEEDBACK' | 'OTHER';
export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface SupportTicketFilters {
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  page?: number;
  size?: number;
}

export const supportKeys = {
  all: ['admin', 'support'] as const,
  lists: () => [...supportKeys.all, 'list'] as const,
  list: (filters: SupportTicketFilters) => [...supportKeys.lists(), filters] as const,
  details: () => [...supportKeys.all, 'detail'] as const,
  detail: (id: string) => [...supportKeys.details(), id] as const,
};
