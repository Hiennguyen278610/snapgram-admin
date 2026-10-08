import { z } from 'zod';

/**
 * Permission categories verified against the LIVE backend on 2026-10-08
 * (`GET /api/auth/admin/permissions`, gateway `:8080`).
 *
 * The endpoint returns a MAP keyed by these five categories, NOT an array.
 * The array order below is also the render order of the permission matrix.
 */
export const PERMISSION_CATEGORIES = [
  'CONTENT_MODERATION',
  'REPORT_MANAGEMENT',
  'SUPPORT',
  'SYSTEM',
  'USER_MANAGEMENT',
] as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];

export function isPermissionCategory(value: string): value is PermissionCategory {
  return (PERMISSION_CATEGORIES as readonly string[]).includes(value);
}

/**
 * `PermissionResponse` (api-docs/auth-apidocs.md › Admin RBAC API).
 *
 * DEVIATION vs the original brief: the real payload is grouped by category, so
 * `permissionMapSchema` below is a record — `z.array(...)` would break against
 * the live backend.
 *
 * NOTE (tech-debt / backend issue): `description` is a single fixed Vietnamese
 * string persisted in the backend DB (e.g. "Xóa bình luận vi phạm"). It is
 * rendered verbatim and never translated — `permission.name` (e.g. `USER:BAN`)
 * is the locale-neutral primary label.
 *
 * Zod style follows the dashboard/user schemas: plain `z.string()` for ids and
 * date-time fields (`.uuid()` / `.datetime()` are deprecated in zod 4.6.5 and
 * intentionally lenient in this repo).
 */
export const permissionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().optional(),
});

/** Response of `GET /api/auth/admin/permissions`: `category -> PermissionResponse[]`. */
export const permissionMapSchema = z.record(z.string(), z.array(permissionResponseSchema));

export type PermissionResponse = z.infer<typeof permissionResponseSchema>;
export type PermissionMap = z.infer<typeof permissionMapSchema>;

/**
 * Flattens the category map into a single, deterministically ordered list.
 * Unknown categories are appended after the five known ones so a backend
 * addition is never silently dropped from the UI.
 */
export function flattenPermissions(permissions: PermissionMap): PermissionResponse[] {
  const known = PERMISSION_CATEGORIES.flatMap((category) => permissions[category] ?? []);
  const unknown = Object.entries(permissions)
    .filter(([category]) => !isPermissionCategory(category))
    .flatMap(([, list]) => list);

  return [...known, ...unknown];
}
