import { apiClient } from '@/lib/api/client';
import type { ApiError } from '@/lib/api/types';
import { permissionMapSchema, type PermissionMap } from '../schemas/permission.schema';
import {
  roleDetailSchema,
  roleListSchema,
  type CreateRoleInput,
  type RoleDetail,
  type UpdateRoleInput,
} from '../schemas/role.schema';

export const ROLES_ENDPOINT = '/api/auth/admin/roles';
export const PERMISSIONS_ENDPOINT = '/api/auth/admin/permissions';

function invalidShape(label: string, data: unknown, issues: unknown): ApiError {
  console.warn(`[rbac] Invalid ${label} response shape`, issues);
  return {
    httpStatus: 0,
    kind: 'server',
    message: 'Invalid response shape',
    rawResponse: data,
  };
}

export async function fetchRoles(): Promise<RoleDetail[]> {
  const { data } = await apiClient.get(ROLES_ENDPOINT);

  const parsed = roleListSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('roles list', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function fetchRoleDetail(roleId: string): Promise<RoleDetail> {
  const { data } = await apiClient.get(`${ROLES_ENDPOINT}/${encodeURIComponent(roleId)}`);

  const parsed = roleDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('role detail', data, parsed.error.issues);
  }

  return parsed.data;
}

/**
 * The live backend groups permissions by category and returns an OBJECT map
 * (`category -> PermissionResponse[]`), not an array — verified 2026-10-08.
 */
export async function fetchPermissions(): Promise<PermissionMap> {
  const { data } = await apiClient.get(PERMISSIONS_ENDPOINT);

  const parsed = permissionMapSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('permissions map', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function createRole(payload: CreateRoleInput): Promise<RoleDetail> {
  const { data } = await apiClient.post(ROLES_ENDPOINT, {
    name: payload.name,
    description: payload.description,
    // Permissions are assigned afterwards from the role detail matrix.
    permissionIds: payload.permissionIds ?? [],
  });

  const parsed = roleDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('create role', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function updateRole(roleId: string, payload: UpdateRoleInput): Promise<RoleDetail> {
  const { data } = await apiClient.put(`${ROLES_ENDPOINT}/${encodeURIComponent(roleId)}`, {
    name: payload.name,
    description: payload.description,
  });

  const parsed = roleDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('update role', data, parsed.error.issues);
  }

  return parsed.data;
}

/**
 * `DELETE /api/auth/admin/roles/{roleId}` responds `200` with NO body
 * (api-docs + live verify 2026-10-08). Deliberately no schema.parse here —
 * parsing an empty body would surface a bogus "Invalid response shape" error.
 */
export async function deleteRole(roleId: string): Promise<void> {
  await apiClient.delete(`${ROLES_ENDPOINT}/${encodeURIComponent(roleId)}`);
}

export async function setRolePermissions(
  roleId: string,
  permissionIds: string[]
): Promise<RoleDetail> {
  const { data } = await apiClient.put(
    `${ROLES_ENDPOINT}/${encodeURIComponent(roleId)}/permissions`,
    { permissionIds }
  );

  const parsed = roleDetailSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('set role permissions', data, parsed.error.issues);
  }

  return parsed.data;
}
