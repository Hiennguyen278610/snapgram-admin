import { z } from 'zod';

export const supportTicketStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const supportTicketCategorySchema = z.enum([
  'TECHNICAL_ISSUE',
  'ACCOUNT_ISSUE',
  'PAYMENT_ISSUE',
  'FEATURE_FEEDBACK',
  'OTHER',
]);
export const supportTicketPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const supportTicketSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userUsername: z.string().nullable().optional(),
  userDisplayName: z.string().nullable().optional(),
  userAvatarUrl: z.string().nullable().optional(),
  category: supportTicketCategorySchema,
  subject: z.string(),
  description: z.string(),
  attachments: z.array(z.string()).optional().default([]),
  status: supportTicketStatusSchema,
  priority: supportTicketPrioritySchema,
  adminReply: z.string().nullable().optional(),
  responderId: z.string().nullable().optional(),
  resolvedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const pageSupportTicketSchema = z.object({
  content: z.array(supportTicketSchema).optional().default([]),
  totalElements: z.number().optional().default(0),
  totalPages: z.number().optional().default(0),
  number: z.number().optional().default(0),
  size: z.number().optional().default(0),
  numberOfElements: z.number().optional().default(0),
  first: z.boolean().optional().default(true),
  last: z.boolean().optional().default(true),
  empty: z.boolean().optional().default(false),
});

export const replySupportTicketSchema = z.object({
  reply: z.string().trim().min(1, { message: 'Reply must not be empty' }),
  status: supportTicketStatusSchema,
});

export type SupportTicketStatus = z.infer<typeof supportTicketStatusSchema>;
export type SupportTicketCategory = z.infer<typeof supportTicketCategorySchema>;
export type SupportTicketPriority = z.infer<typeof supportTicketPrioritySchema>;
export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type PageSupportTicket = z.infer<typeof pageSupportTicketSchema>;
export type ReplySupportTicketInput = {
  reply: string;
  status: SupportTicketStatus;
};
