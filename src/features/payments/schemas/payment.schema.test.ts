import { describe, it, expect } from 'vitest';
import { paymentOrderSchema, pagePaymentOrderSchema } from './payment.schema';

describe('paymentOrderSchema', () => {
  it('parses a valid payment order payload', () => {
    const raw = {
      id: 'f9869375-0b65-4fd3-9866-b702112decc8',
      orderId: '0691358635a64d3cbec7cf794ca4aa76',
      productCode: 'BLUE_TICK',
      amount: 199000,
      currency: 'VND',
      status: 'EXPIRED',
      createdAt: '2026-10-24T07:16:28.274950Z',
      expiresAt: '2026-10-24T07:31:28.274666Z',
    };

    const parsed = paymentOrderSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.productCode).toBe('BLUE_TICK');
      expect(parsed.data.amount).toBe(199000);
      expect(parsed.data.status).toBe('EXPIRED');
    }
  });

  it('tolerates missing or null expiresAt', () => {
    const raw = {
      id: 'f9869375-0b65-4fd3-9866-b702112decc8',
      orderId: '0691358635a64d3cbec7cf794ca4aa76',
      productCode: 'BLUE_TICK',
      amount: 199000,
      currency: 'VND',
      status: 'SUCCESS',
      createdAt: '2026-10-24T07:16:28.274950Z',
      expiresAt: null,
    };

    expect(paymentOrderSchema.safeParse(raw).success).toBe(true);
  });

  it('rejects an invalid payment status enum', () => {
    const raw = {
      id: '1',
      orderId: 'ord-1',
      productCode: 'BLUE_TICK',
      amount: 100,
      currency: 'VND',
      status: 'INVALID_STATUS',
      createdAt: '2026-10-24T00:00:00Z',
    };

    expect(paymentOrderSchema.safeParse(raw).success).toBe(false);
  });
});

describe('pagePaymentOrderSchema', () => {
  it('parses paginated payment response', () => {
    const raw = {
      content: [
        {
          id: '1',
          orderId: 'ord-1',
          productCode: 'BLUE_TICK',
          amount: 199000,
          currency: 'VND',
          status: 'SUCCESS',
          createdAt: '2026-10-24T07:16:28Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    const parsed = pagePaymentOrderSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.content).toHaveLength(1);
      expect(parsed.data.totalElements).toBe(1);
    }
  });
});
