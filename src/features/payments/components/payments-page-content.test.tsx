import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { usePaymentsList } from '../hooks/use-payments-list';
import { useReconcilePayment } from '../hooks/use-reconcile-payment';
import type { PagePaymentOrder } from '../schemas/payment.schema';
import { PaymentsPageContent } from './payments-page-content';

const spy = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: { value: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => spy.searchParams.value,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: spy.replace, push: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin/payments',
}));

vi.mock('../hooks/use-payments-list');
vi.mock('../hooks/use-reconcile-payment');

const mockedUsePaymentsList = vi.mocked(usePaymentsList);
const mockedUseReconcile = vi.mocked(useReconcilePayment);

const mockPage: PagePaymentOrder = {
  content: [
    {
      id: 'p-1',
      orderId: 'ord-test-1',
      productCode: 'BLUE_TICK',
      amount: 199000,
      currency: 'VND',
      status: 'PENDING',
      createdAt: '2026-10-24T07:16:28Z',
      expiresAt: '2026-10-24T07:31:28Z',
    },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
  first: true,
  last: true,
  empty: false,
};

describe('PaymentsPageContent', () => {
  beforeEach(() => {
    mockedUsePaymentsList.mockReset();
    mockedUseReconcile.mockReset();
    mockedUseReconcile.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useReconcilePayment>);
  });

  it('renders heading and table with orders', () => {
    mockedUsePaymentsList.mockReturnValue({
      data: mockPage,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePaymentsList>);

    renderWithProviders(<PaymentsPageContent />);

    expect(screen.getByRole('heading', { name: 'Payment Orders' })).toBeInTheDocument();
    expect(screen.getByText('ord-test-1')).toBeInTheDocument();
  });

  it('opens reconcile dialog when reconcile button is clicked', async () => {
    const user = userEvent.setup();
    mockedUsePaymentsList.mockReturnValue({
      data: mockPage,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePaymentsList>);

    renderWithProviders(<PaymentsPageContent />);

    const reconcileBtn = screen.getByRole('button', { name: /Reconcile/ });
    await user.click(reconcileBtn);

    expect(screen.getByRole('heading', { name: 'Reconcile Transaction' })).toBeInTheDocument();
  });
});
