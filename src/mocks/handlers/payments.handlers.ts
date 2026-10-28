import { http, HttpResponse } from 'msw';
import type { PaymentOrder } from '@/features/payments/schemas/payment.schema';

const PAYMENTS_URL = 'http://localhost:8080/api/admin/payments';

export const MOCK_PAYMENTS: PaymentOrder[] = [
  {
    id: 'f9869375-0b65-4fd3-9866-b702112decc8',
    orderId: '0691358635a64d3cbec7cf794ca4aa76',
    productCode: 'BLUE_TICK',
    amount: 199000,
    currency: 'VND',
    status: 'EXPIRED',
    createdAt: '2026-10-24T07:16:28.274950Z',
    expiresAt: '2026-10-24T07:31:28.274666Z',
  },
  {
    id: '8ea88949-c84f-4758-8f97-8dae6f3282ae',
    orderId: '4269bbc1edb44836b0a19dd651a5cb3f',
    productCode: 'BLUE_TICK',
    amount: 199000,
    currency: 'VND',
    status: 'PENDING',
    createdAt: '2026-10-24T07:16:16.005597Z',
    expiresAt: '2026-10-24T07:31:15.999693Z',
  },
  {
    id: 'e5a186ba-6934-4119-be6b-444f8696da6e',
    orderId: 'be937ce2ee5c43ba9e873959ad34dc26',
    productCode: 'BLUE_TICK',
    amount: 199000,
    currency: 'VND',
    status: 'SUCCESS',
    createdAt: '2026-10-24T07:07:00.999042Z',
    expiresAt: '2026-10-24T07:22:00.980728Z',
  },
];

export const paymentsHandlers = [
  http.options(`${PAYMENTS_URL}*`, () => new HttpResponse(null, { status: 204 })),

  http.get(PAYMENTS_URL, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let filtered = MOCK_PAYMENTS;
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    return HttpResponse.json({
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: filtered.length === 0,
    });
  }),

  http.post(`${PAYMENTS_URL}/:orderId/reconcile`, ({ params }) => {
    const orderId = params.orderId as string;
    const payment = MOCK_PAYMENTS.find((p) => p.orderId === orderId);
    if (!payment) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: 'Transaction not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      ...payment,
      status: 'SUCCESS',
    });
  }),
];
