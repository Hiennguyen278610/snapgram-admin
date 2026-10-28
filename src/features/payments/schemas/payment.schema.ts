import { z } from 'zod';

export const paymentStatusEnum = z.enum([
  'PENDING',
  'SUCCESS',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
]);

export type PaymentStatusType = z.infer<typeof paymentStatusEnum>;

export const paymentOrderSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productCode: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: paymentStatusEnum,
  createdAt: z.string(),
  expiresAt: z.string().nullable().optional(),
});

export const pagePaymentOrderSchema = z.object({
  content: z.array(paymentOrderSchema),
  totalElements: z.number(),
  totalPages: z.number(),
  size: z.number(),
  number: z.number(),
  first: z.boolean().optional(),
  last: z.boolean().optional(),
  empty: z.boolean().optional(),
});

export type PaymentOrder = z.infer<typeof paymentOrderSchema>;
export type PagePaymentOrder = z.infer<typeof pagePaymentOrderSchema>;
