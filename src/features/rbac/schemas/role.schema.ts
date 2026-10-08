import { z } from 'zod';
import { permissionResponseSchema } from './permission.schema';

/** Backend `CreateRoleRequest.name` constraint (Swagger, verified 2026-10-08). */
export const ROLE_NAME_PATTERN = /^[A-Z0-9_]+$/;
export const ROLE_NAME_MIN_LENGTH = 2;
export const ROLE_NAME_MAX_LENGTH = 50;
export const ROLE_DESCRIPTION_MAX_LENGTH = 255;

/**
 * `RoleDetailResponse` (api-docs/auth-apidocs.md › Admin RBAC API). All eight
 * fields are optional in Swagger; `id` and `name` are required here because a
 * role cannot be keyed or rendered without them. `permissions` carries FULL
 * permission objects (not ids), so matching in the matrix uses `permission.id`.
 *
 * Zod style follows the dashboard/user schemas: plain `z.string()` for ids and
 * date-time fields instead of `.uuid()` / `.datetime()`.
 */
export const roleDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  permissions: z.array(permissionResponseSchema).optional().default([]),
  userCount: z.number().optional().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  system: z.boolean().optional().default(false),
});

export const roleListSchema = z.array(roleDetailSchema);

/**
 * Role name normalisation + validation.
 *
 * The transform runs BEFORE the pattern check, so a user typing lowercase
 * (`moderator`) is still accepted (and normalised to `MODERATOR`) while
 * genuinely invalid characters (`mod-erator`, spaces, emoji) are rejected.
 * `handleSubmit` therefore receives the already-uppercased value.
 */
const roleNameSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .min(ROLE_NAME_MIN_LENGTH, { message: 'rbac.error.nameLength' })
      .max(ROLE_NAME_MAX_LENGTH, { message: 'rbac.error.nameLength' })
      .regex(ROLE_NAME_PATTERN, { message: 'rbac.error.namePattern' })
  );

const roleDescriptionSchema = z
  .string()
  .trim()
  .max(ROLE_DESCRIPTION_MAX_LENGTH, { message: 'rbac.error.descriptionLength' })
  .optional();

/** Create-role form schema (conventions.md §7). */
export const createRoleSchema = z.object({
  name: roleNameSchema,
  description: roleDescriptionSchema,
});

/** Update-role form schema — both fields are optional in the backend contract. */
export const updateRoleSchema = z.object({
  name: roleNameSchema,
  description: roleDescriptionSchema,
});

const ROLE_FIELD_ERROR_PREFIX = 'rbac.error.';

/**
 * Field-error messages emitted by these schemas are i18n keys (`rbac.error.*`).
 * This guards the render layer so only our keys go through `t()` — a raw zod
 * fallback message is passed through untouched.
 */
export function isRoleFieldErrorKey(message: string | undefined): boolean {
  return typeof message === 'string' && message.startsWith(ROLE_FIELD_ERROR_PREFIX);
}

export type RoleDetail = z.infer<typeof roleDetailSchema>;
/** Shape registered with react-hook-form (pre-transform). */
export type CreateRoleFormValues = z.input<typeof createRoleSchema>;
/** Parsed create form output — uppercased name, trimmed description. */
export type CreateRolePayload = z.output<typeof createRoleSchema>;
/** Payload accepted by `createRole()`. */
export type CreateRoleInput = CreateRolePayload & { permissionIds?: string[] };
export type UpdateRoleInput = z.output<typeof updateRoleSchema>;
