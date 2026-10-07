import { apiClient } from '@/lib/api/client';

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
