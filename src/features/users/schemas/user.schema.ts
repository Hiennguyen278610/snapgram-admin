import { z } from 'zod';

/**
 * Field-by-field verified against `api-docs/auth-apidocs.md`
 * (`AdminUserResponse`, `PageAdminUserResponse`).
 *
 * Deliberately named `adminUserSchema` (not `adminUserResponseSchema`) to avoid
 * colliding with the stricter subset exported from
 * `src/features/dashboard/schemas/stats.schema.ts`.
 *
 * Zod style follows the dashboard schema: `z.string()` for `id` and date-time
 * fields instead of `z.string().uuid()` / `.datetime()` (deprecated in zod
 * 4.6.5 and intentionally lenient in this repo).
 */
export const adminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  privateAccount: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  twoFaEnabled: z.boolean().optional(),
  banned: z.boolean().optional(),
  bannedAt: z.string().nullable().optional(),
  banReason: z.string().nullable().optional(),
  lastSeenAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  role: z.string().nullable().optional(),
  roles: z.array(z.string()).optional().default([]),
});

export const pageAdminUserSchema = z.object({
  content: z.array(adminUserSchema).optional().default([]),
  totalElements: z.number().optional().default(0),
  totalPages: z.number().optional().default(0),
  number: z.number().optional().default(0),
  size: z.number().optional().default(0),
  numberOfElements: z.number().optional().default(0),
  first: z.boolean().optional().default(true),
  last: z.boolean().optional().default(true),
  empty: z.boolean().optional().default(false),
});

/**
 * Ban form schema (conventions.md §7).
 *
 * DEVIATION (brief D3): `reason` uses `min(1)` while `api-docs` declares
 * `BanUserRequest.reason` as `[minLen: 0, maxLen: 255]`. A moderation action
 * must carry an audit trail, so an empty reason is rejected on purpose.
 * The 255 upper bound still mirrors the backend contract.
 */
export const banUserSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, { message: 'users.form.reasonRequired' })
    .max(255, { message: 'users.form.reasonTooLong' }),
});

export const assignRoleSchema = z.object({
  role: z.string().min(1),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
export type PageAdminUser = z.infer<typeof pageAdminUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

/**
 * Status shown by `UserStatusBadge`.
 *
 * The backend only exposes `banned` + `emailVerified`, so:
 * - `banned` wins over everything;
 * - unverified e-mail -> `pending`;
 * - `locked` is part of the four-state contract but has no backend source yet
 *   (BI-002: 423 locked is not implemented) — it stays reachable for callers
 *   that know better, e.g. a future lock endpoint.
 */
export type UserStatus = 'active' | 'banned' | 'pending' | 'locked';

export function getUserStatus(user: Pick<AdminUser, 'banned' | 'emailVerified'>): UserStatus {
  if (user.banned === true) return 'banned';
  if (user.emailVerified === false) return 'pending';
  return 'active';
}
