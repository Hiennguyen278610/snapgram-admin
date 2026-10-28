import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { PaymentOrder } from '../schemas/payment.schema';
import { PaymentDataTable } from './payment-data-table';

const mockOrders: PaymentOrder[] = [
  {
    id: 'p-1',
    orderId: 'ord-pending-1',
    productCode: 'BLUE_TICK',
    amount: 199000,
    currency: 'VND',
    status: 'PENDING',
    createdAt: '2026-10-24T07:16:28Z',
    expiresAt: '2026-10-24T07:31:28Z',
  },
  {
    id: 'p-2',
    orderId: 'ord-success-2',
    productCode: 'BLUE_TICK',
    amount: 199000,
    currency: 'VND',
    status: 'SUCCESS',
    createdAt: '2026-10-24T07:16:28Z',
    expiresAt: null,
  },
];

describe('PaymentDataTable', () => {
  it('renders order rows and triggers reconcile on click', async () => {
    const user = userEvent.setup();
    const onReconcile = vi.fn();
    const onPageChange = vi.fn();

    renderWithProviders(
      <PaymentDataTable
        data={mockOrders}
        page={0}
        totalPages={1}
        onPageChange={onPageChange}
        onReconcile={onReconcile}
      />
    );

    expect(screen.getByText('ord-pending-1')).toBeInTheDocument();
    expect(screen.getByText('ord-success-2')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: /Reconcile/ });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();

    await user.click(buttons[0]);
    expect(onReconcile).toHaveBeenCalledWith(mockOrders[0]);
  });

  it('renders empty state when data is empty', () => {
    renderWithProviders(
      <PaymentDataTable
        data={[]}
        page={0}
        totalPages={0}
        onPageChange={vi.fn()}
        onReconcile={vi.fn()}
      />
    );

    expect(screen.getByText('No payment transactions found')).toBeInTheDocument();
  });
});
