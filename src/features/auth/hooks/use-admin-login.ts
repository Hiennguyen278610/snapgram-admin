'use client';
import { useMutation } from '@tanstack/react-query';
import { loginAdmin, type LoginPayload } from '../services/auth.service';

export function useAdminLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginAdmin(payload),
  });
}
