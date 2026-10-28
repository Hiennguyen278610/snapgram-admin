import { z } from 'zod';

export const currentUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  role: z.string().default('ADMIN'),
  roles: z.array(z.string()).optional().default([]),
  permissions: z.array(z.string()).optional().default([]),
  emailVerified: z.boolean().optional(),
  verified: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
