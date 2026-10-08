/**
 * Centralized TanStack Query keys (conventions.md §5.1).
 * Hierarchy convention: `[domain, scope, ...params]`.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

// Placeholders for the upcoming sprints — add them here when needed.
// export const userKeys = ...    // Sprint 2.3
// export const rbacKeys = ...    // Sprint 2.4
// export const reportKeys = ...  // Sprint 2.5
// export const mediaKeys = ...   // Sprint 2.6
