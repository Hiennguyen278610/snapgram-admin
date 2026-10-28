import { apiClient } from '@/lib/api/client';
import { currentUserSchema, type CurrentUser } from '../schemas/current-user.schema';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  requiresTwoFa?: boolean;
  tempToken?: string;
  user?: { id: string; email: string; role?: string };
}

export async function loginAdmin(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/admin/login', payload);
  return data;
}

export interface TwoFaPayload {
  tempToken: string;
  code: string;
}

export async function verifyTwoFa(payload: TwoFaPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login/2fa', {
    tempToken: payload.tempToken,
    totpCode: payload.code,
  });
  return data;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  displayName?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get<CurrentUser>('/api/auth/me');
  return data;
}

/** Backend answers `204 No Content` (no body). */
export async function logoutAdmin(): Promise<void> {
  await apiClient.post('/api/auth/logout', {});
}
