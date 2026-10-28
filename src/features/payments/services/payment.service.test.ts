// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { fetchPayments, reconcilePayment, PAYMENTS_ENDPOINT } from './payment.service';

describe('payment.service', () => {
  afterEach(() => server.resetHandlers());

  it('fetches paginated payments with default params', async () => {
    const data = await fetchPayments();
    expect(data.content).toBeDefined();
    expect(data.content.length).toBeGreaterThan(0);
    expect(data.totalElements).toBe(3);
    expect(data.content[0]).toHaveProperty('orderId');
  });

  it('filters payments by status', async () => {
    const data = await fetchPayments({ status: 'PENDING' });
    expect(data.content.every((p) => p.status === 'PENDING')).toBe(true);
  });

  it('reconciles a payment transaction', async () => {
    const result = await reconcilePayment('0691358635a64d3cbec7cf794ca4aa76');
    expect(result.orderId).toBe('0691358635a64d3cbec7cf794ca4aa76');
    expect(result.status).toBe('SUCCESS');
  });

  it('surfaces 404 when reconcile target is not found', async () => {
    await expect(reconcilePayment('nonexistent-id')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    });
  });

  it('throws normalized ApiError when response shape is invalid', async () => {
    server.use(
      http.get(`http://localhost:8080${PAYMENTS_ENDPOINT}`, () =>
        HttpResponse.json({ unexpected: 'shape' })
      )
    );

    await expect(fetchPayments()).rejects.toMatchObject({
      kind: 'server',
      message: 'Invalid response shape',
    });
  });
});
