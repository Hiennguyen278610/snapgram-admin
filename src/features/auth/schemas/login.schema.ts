import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const twoFactorSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
