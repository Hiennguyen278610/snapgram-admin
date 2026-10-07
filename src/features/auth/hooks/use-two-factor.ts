'use client';
import { useMutation } from '@tanstack/react-query';
import { verifyTwoFa, type TwoFaPayload } from '../services/auth.service';

export function useTwoFactor() {
  return useMutation({
    mutationFn: (payload: TwoFaPayload) => verifyTwoFa(payload),
  });
}
