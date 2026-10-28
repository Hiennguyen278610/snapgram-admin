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

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const { data } = await apiClient.get('/api/auth/me');
  const parsed = currentUserSchema.safeParse(data);
  if (!parsed.success) {
    throw {
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid user profile response',
      rawResponse: data,
    };
  }
  return parsed.data;
}

export async function logoutAdmin(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}
