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

// Placeholders for the upcoming sprints — add them here when needed.
// export const rbacKeys = ...    // Sprint 2.4
// export const reportKeys = ...  // Sprint 2.5
// export const mediaKeys = ...   // Sprint 2.6
