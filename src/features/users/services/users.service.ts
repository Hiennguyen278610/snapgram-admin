import { apiClient } from '@/lib/api/client';
import type { UserFilters } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import {
  adminUserSchema,
  pageAdminUserSchema,
  type AdminUser,
  type PageAdminUser,
} from '../schemas/user.schema';

export const USERS_ENDPOINT = '/api/auth/admin/users';

function invalidShape(label: string, data: unknown, issues: unknown): ApiError {
  console.warn(`[users] Invalid ${label} response shape`, issues);
  return {
    httpStatus: 0,
    kind: 'server',
    message: 'Invalid response shape',
    rawResponse: data,
  };
}

export async function fetchUsers(filters: UserFilters = {}): Promise<PageAdminUser> {
  const { data } = await apiClient.get(USERS_ENDPOINT, {
    params: {
      page: filters.page ?? 0,
      size: filters.size ?? 20,
      ...(filters.q ? { q: filters.q } : {}),
    },
  });

  // `safeParse` keeps a raw ZodError out of the UI; we surface a normalized
  // ApiError instead and log a short diagnostic (never the whole payload).
  const parsed = pageAdminUserSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('users list', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function fetchUser(userId: string): Promise<AdminUser> {
  const { data } = await apiClient.get(`${USERS_ENDPOINT}/${userId}`);

  const parsed = adminUserSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('user detail', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function banUser(userId: string, reason: string): Promise<AdminUser> {
  const { data } = await apiClient.post(`${USERS_ENDPOINT}/${userId}/ban`, { reason });

  const parsed = adminUserSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('ban user', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function unbanUser(userId: string): Promise<AdminUser> {
  const { data } = await apiClient.post(`${USERS_ENDPOINT}/${userId}/unban`);

  const parsed = adminUserSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('unban user', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function assignRole(userId: string, role: string): Promise<AdminUser> {
  const { data } = await apiClient.post(`${USERS_ENDPOINT}/${userId}/roles`, { role });

  const parsed = adminUserSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('assign role', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function removeRole(userId: string, role: string): Promise<AdminUser> {
  const { data } = await apiClient.delete(
    `${USERS_ENDPOINT}/${userId}/roles/${encodeURIComponent(role)}`
  );

  const parsed = adminUserSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('remove role', data, parsed.error.issues);
  }

  return parsed.data;
}
