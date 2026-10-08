import { z } from 'zod';

/**
 * Field-by-field verified against `api-docs/auth-apidocs.md`
 * (`AdminDashboardResponse` + `AdminUserResponse`).
 * `AdminUserResponse` in the API docs carries extra fields; zod strips unknown
 * keys by default, so this subset is safe.
 */
export const adminUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  banned: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export const adminDashboardResponseSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  bannedUsers: z.number(),
  newUsersToday: z.number(),
  newUsersThisWeek: z.number(),
  emailVerifiedUsers: z.number(),
  twoFaEnabledUsers: z.number(),
  recentUsers: z.array(adminUserResponseSchema).optional().default([]),
});

export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;
export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>;
